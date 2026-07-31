/**
 * خدمة المطابقة والدفع — قلب المنصة التشغيلي (server-only).
 *
 * المسارات الحرجة:
 *   1) runSearchMatchingAndPersist: SQL بفلاتر المحرك الصارمة نفسها
 *      (passesHardFilters — الطبقة 1) لتضييق المرشّحين ← runMatching كاملاً
 *      ← إنشاء Match بمهلة 48 س (computeRespondBy) ولقطة رسوم من breakdown
 *      ← إشعار كل بائع مرتبط بحساب (MATCH_FOUND). بلا N+1: استعلام
 *      مرشّحين واحد + createMany + استعلام نتائج واحد + createMany إشعارات.
 *   2) agreeAndPay: موافقة البائع (وحارس تفاؤلي ضد السباق) ← دفعتان (البائع
 *      موقّت «mock» + المشتري 0 دج تلقائياً) ← قفز ذرّي حتى CONTACT_REVEALED
 *      ← إشعار المشتري. حارس updateMany شرطي يمنع الدفع المزدوج تحت سباق.
 *   3) expireOverdueMatches: الكنس الكسول — تعتيم ما انقضت مهلته (48 س)
 *      + إشعارات MATCH_EXPIRED. تُستدعى من نقاط القراءة ومن الـ sweep الإداري.
 *   4) cancelMatch: إلغاء كامل قبل الكشف + إشعار الطرف الآخر.
 *
 * ⚠️ secretMin لا يخرج من هنا في أي استجابة: النتائج العامة تُبنى عبر
 *    serializers.ts حصراً. تفصيل النقاط يُخزَّن على Match (داخلي) فقط.
 */
import type {Match, Prisma, SearchRequest, User} from '@prisma/client';
import {prisma} from '@/lib/prisma';
import {computeRespondBy, runMatching, type MatchResult} from '@/lib/matching';
import {ApiError} from '@/lib/api/http';
import {toEngineSearch, toMatchableProperty} from './serializers';
import {checkAgreeEligibility, isCancellable} from './transitions';

const MATCH_INCLUDE_FOR_BUYER = {
  property: {
    include: {
      wilaya: {select: {code: true, nameAr: true, nameFr: true}},
      commune: {select: {id: true, nameAr: true, nameFr: true}},
      images: {orderBy: {sortOrder: 'asc'}, take: 1}
    }
  }
} as const satisfies Prisma.MatchInclude;

export type MatchForBuyer = Prisma.MatchGetPayload<{include: typeof MATCH_INCLUDE_FOR_BUYER}>;

// ─── 1) تشغيل المحرك وحفظ المطابقات ─────────────────────────────────────────

export interface MatchingRunSummary {
  readonly matchesCreated: number;
  readonly matches: readonly Match[];
}

/** يشغّل المحرك على طلب بحث محفوظ ويحفظ النتائج + الإشعارات ذرّياً قدر المستطاع */
export async function runSearchMatchingAndPersist(search: SearchRequest): Promise<MatchingRunSummary> {
  // المرشّحون: فلاتر الطبقة 1 تُدفَع لـ SQL نفسها (نشطة/غير مراقبة + نوع + ولاية)
  const candidates = await prisma.property.findMany({
    where: {
      status: {in: ['ACTIVE', 'UNMONITORED']},
      transactionType: search.transactionType,
      propertyType: search.propertyType,
      wilayaCode: search.wilayaCode
    },
    include: {_count: {select: {images: true}}}
  });

  const results: MatchResult[] = runMatching(toEngineSearch(search), candidates.map(toMatchableProperty));

  if (results.length === 0) {
    return {matchesCreated: 0, matches: []};
  }

  const respondBy = computeRespondBy();
  const sellerByProperty = new Map(candidates.map((p) => [p.id, p.sellerId]));

  await prisma.match.createMany({
    data: results.map((result) => ({
      propertyId: result.propertyId,
      searchRequestId: search.id,
      sellerId: sellerByProperty.get(result.propertyId) ?? null,
      buyerId: search.buyerId,
      internalScore: result.internalScore,
      displayedScore: result.displayedScore,
      spatialScore: result.breakdown.locationScore,
      priceScore: result.breakdown.priceScore,
      softScore: result.breakdown.featuresScore,
      feeSeller: result.breakdown.sellerFee,
      feeBuyer: 0,
      status: 'SELLER_NOTIFIED',
      respondBy
    })),
    skipDuplicates: true
  });

  const created = await prisma.match.findMany({
    where: {searchRequestId: search.id, status: 'SELLER_NOTIFIED'},
    orderBy: {internalScore: 'desc'}
  });

  // إشعار البائعين أصحاب الحسابات (العقارات غير المراقبة: SMS — مرحلة 8)
  const notifications: Prisma.NotificationCreateManyInput[] = created
    .filter((m) => m.sellerId !== null)
    .map((m) => ({
      userId: m.sellerId as string,
      type: 'MATCH_FOUND',
      payload: {matchId: m.id, propertyId: m.propertyId}
    }));
  if (notifications.length > 0) {
    await prisma.notification.createMany({data: notifications});
  }

  return {matchesCreated: created.length, matches: created};
}

// ─── 2) الكنس الكسول للمنتهية (48 س) ─────────────────────────────────────────

export interface ExpirySweepResult {
  readonly expired: number;
  readonly expiredIds: readonly string[];
}

/**
 * يعتّم المطابقات بانتظار رد تجاوزت مهلتها. نطاق اختياري (buyerId/sellerId)
 * لقراءات المستخدم (يقلل الكتابة للضرورة فقط) وبلا نطاق للـ sweep الإداري.
 */
export async function expireOverdueMatches(scope?: {
  readonly buyerId?: string;
  readonly sellerId?: string;
}): Promise<ExpirySweepResult> {
  const now = new Date();
  const where: Prisma.MatchWhereInput = {
    status: 'SELLER_NOTIFIED',
    respondBy: {lt: now},
    ...(scope?.buyerId ? {buyerId: scope.buyerId} : {}),
    ...(scope?.sellerId ? {sellerId: scope.sellerId} : {})
  };

  const overdue = await prisma.match.findMany({
    where,
    select: {id: true, sellerId: true, buyerId: true, propertyId: true, searchRequestId: true}
  });
  if (overdue.length === 0) {
    return {expired: 0, expiredIds: []};
  }

  await prisma.match.updateMany({
    where: {id: {in: overdue.map((m) => m.id)}},
    data: {status: 'EXPIRED', expiredAt: now}
  });

  const notifications: Prisma.NotificationCreateManyInput[] = overdue.flatMap((m) => {
    const base: Prisma.NotificationCreateManyInput[] = [
      {userId: m.buyerId, type: 'MATCH_EXPIRED', payload: {matchId: m.id, propertyId: m.propertyId}}
    ];
    if (m.sellerId) {
      base.push({userId: m.sellerId, type: 'MATCH_EXPIRED', payload: {matchId: m.id, propertyId: m.propertyId}});
    }
    return base;
  });
  await prisma.notification.createMany({data: notifications});

  return {expired: overdue.length, expiredIds: overdue.map((m) => m.id)};
}

// ─── 3) موافقة البائع + الدفع ← كشف التواصل (ذرّي) ──────────────────────────

export interface AgreeOutcome {
  readonly matchId: string;
  readonly status: 'CONTACT_REVEALED';
  readonly sellerFee: number;
  readonly buyerFee: number;
  readonly paymentIds: readonly string[];
}

/**
 * ينفّذ: SELLER_NOTIFIED →SELLER_AGREED → BUYER_PAID → CONTACT_REVEALED
 * داخل معاملة واحدة. حارس updateMany الشرطي يمنع السباق/الدفع المزدوج.
 * المشتري: خطوة تلقائية 0 دج (قرار معتمد) تُسجَّل بدفعة PAID للتاريخ.
 */
export async function agreeAndPayMatch(match: Match, seller: User): Promise<AgreeOutcome> {
  const eligibility = checkAgreeEligibility(match.status, match.respondBy);
  if (eligibility === 'not_awaiting_seller') {
    throw new ApiError(409, 'MATCH_ALREADY_RESPONDED', 'هذه المطابقة لم تعد بانتظار ردك');
  }
  if (eligibility === 'expired') {
    throw new ApiError(410, 'MATCH_EXPIRED', 'انقضت مهلة الـ 48 ساعة لهذه المطابقة');
  }
  if (match.sellerId !== seller.id) {
    throw new ApiError(403, 'MATCH_NOT_PARTY', 'هذه المطابقة لا تخصك');
  }

  const now = new Date();
  return prisma.$transaction(async (tx) => {
    // قفل تفاؤلي: لا يتحرك إلا إن كانت ما تزال بانتظار صالح آلي زمنياً
    const claim = await tx.match.updateMany({
      where: {id: match.id, status: 'SELLER_NOTIFIED', respondBy: {gt: now}},
      data: {status: 'SELLER_AGREED', sellerAgreedAt: now}
    });
    if (claim.count === 0) {
      throw new ApiError(409, 'MATCH_ALREADY_RESPONDED', 'سبقك طرف آخر أو انقضت المهلة — حدّث الصفحة');
    }

    // خطوة المشتري (تلقائية 0 — قرار معتمد): SELLER_AGREED → BUYER_PAID
    await tx.match.update({
      where: {id: match.id},
      data: {status: 'BUYER_PAID', buyerPaidAt: now}
    });

    // ★★ نقطة تكامل الدفع (ما بعد الإطلاق) ★★
    // استبدل provider:'mock' ببوابة جزائرية حقيقية خلف دالة خدمة واحدة:
    //   const charge = await chargeSellerFee({amount: match.feeSeller, matchId})
    //   • CIB / EDAHABIA عبر SATIM (redirect + webhook تأكيد)
    //   • BaridiMob (بريد الجزائر) أو تحويل CCP موثَّق إدارياً
    // القواعد الواجب الحفاظ عليها عند التركيب:
    //   1) لا يُنتقل إلى BUYER_PAID/CONTACT_REVEALED إلا بعد تأكيد webhook
    //      موقَّع من البوابة (وليس بمجرد رجوع المستخدم من صفحة الدفع).
    //   2) status يبدأ PENDING ثم PAID عند التأكيد، مع تخزين مرجع العملية.
    //   3) الاسترداد عند عدم استجابة البائع: دفعة معلَّقة تُلغى آلياً (void)
    //      ضمن عامل الكنس الدوري لمطابقات EXPIRED — لم يُنفَّذ بعد، وهو
    //      بند صريح في قائمة «نقاط التكامل بعد الإطلاق» (README).
    const sellerPayment = await tx.payment.create({
      data: {
        matchId: match.id,
        payerId: seller.id,
        purpose: 'SELLER_MATCH_FEE',
        amount: match.feeSeller,
        status: 'PAID',
        provider: 'mock',
        paidAt: now
      }
    });
    const buyerPayment = await tx.payment.create({
      data: {
        matchId: match.id,
        payerId: match.buyerId,
        purpose: 'BUYER_MATCH_FEE',
        amount: 0,
        status: 'PAID',
        provider: 'mock',
        paidAt: now
      }
    });

    // BUYER_PAID → CONTACT_REVEALED
    await tx.match.update({
      where: {id: match.id},
      data: {status: 'CONTACT_REVEALED', revealedAt: now}
    });

    await tx.notification.create({
      data: {
        userId: match.buyerId,
        type: 'CONTACT_REVEALED',
        payload: {matchId: match.id, propertyId: match.propertyId}
      }
    });
    // ★ نقطة تكامل إشعارات خارجية (ما بعد الإطلاق): عند تركيب WhatsApp
    // Business API أو SMS، اربط الإرسال هنا (طبقة خدمة، بعد نجاح المعاملة)
    // مع قالب موافق عليه مسبقاً، ولا ترسل أبداً أي حقل محمي (secretMin
    // وتفصيل النقاط) حتى بعد كشف التواصل. راجع README ← نقاط التكامل.

    return {
      matchId: match.id,
      status: 'CONTACT_REVEALED' as const,
      sellerFee: Number(match.feeSeller),
      buyerFee: 0,
      paymentIds: [sellerPayment.id, buyerPayment.id]
    };
  });
}

// ─── 4) الإلغاء (قبل الكشف فقط) ─────────────────────────────────────────────

export interface CancelOutcome {
  readonly matchId: string;
  readonly status: 'CANCELLED';
}

export async function cancelMatch(
  match: Match,
  actor: User,
  reason: string | null
): Promise<CancelOutcome> {
  const isSeller = match.sellerId === actor.id;
  const isBuyer = match.buyerId === actor.id;
  if (!isSeller && !isBuyer) {
    throw new ApiError(403, 'MATCH_NOT_PARTY', 'هذه المطابقة لا تخصك');
  }
  if (match.status === 'CONTACT_REVEALED') {
    throw new ApiError(409, 'MATCH_ALREADY_REVEALED', 'كُشف التواصل بالفعل — الإلغاء غير ممكن');
  }
  if (!isCancellable(match.status)) {
    throw new ApiError(409, 'MATCH_NOT_CANCELLABLE', 'هذه المطابقة في حالة نهائية ولا تقبل الإلغاء');
  }

  await prisma.match.update({
    where: {id: match.id},
    data: {status: 'CANCELLED', cancelledAt: new Date(), cancelReason: reason}
  });

  // الطرف الآخر فقط (العقارات غير المراقبة لا صندوق وارد لها)
  const counterpartyId = isSeller ? match.buyerId : match.sellerId;
  if (counterpartyId) {
    await prisma.notification.create({
      data: {
        userId: counterpartyId,
        type: 'MATCH_CANCELLED',
        payload: {
          matchId: match.id,
          propertyId: match.propertyId,
          cancelledBy: isSeller ? 'seller' : 'buyer'
        }
      }
    });
  }

  return {matchId: match.id, status: 'CANCELLED'};
}

// ─── 5) جلب مطابقة مع حارس العضوية ──────────────────────────────────────────

export type MatchParty = 'buyer' | 'seller';

/** يجلب المطابقة ويؤكد أن المستخدم طرف فيها — ويعيد دوره */
export async function getMatchForParty(
  matchId: string,
  user: User
): Promise<{match: Match; party: MatchParty}> {
  const match = await prisma.match.findUnique({where: {id: matchId}});
  if (!match) {
    throw new ApiError(404, 'MATCH_NOT_FOUND', 'المطابقة غير موجودة');
  }
  if (match.buyerId === user.id) return {match, party: 'buyer'};
  if (match.sellerId === user.id) return {match, party: 'seller'};
  throw new ApiError(403, 'MATCH_NOT_PARTY', 'هذه المطابقة لا تخصك');
}

export const matchIncludeForBuyerClause = MATCH_INCLUDE_FOR_BUYER;
