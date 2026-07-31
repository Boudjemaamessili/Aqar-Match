/**
 * /api/searches — طلبات بحث المشتري.
 *
 * POST: ينشئ طلب بحث ثم يشغّل محرك المطابقة فوراً (نفس الطلب = نتائج فورية).
 *   المشتري يجب أن يكون مسجلاً (مبدأ إلزامي) — requireUser.
 *   الأحياء تُخزَّن مُطبَّعة (normalizeNeighborhood) كما صممها المخطط.
 *   يرجع الطلب + عدد المطابقات المنشأة + بطاقات العقارات العامة (بلا سِرّية).
 *
 * GET: طلباتي مع عدّادات (لكل طلب: كل المطابقات + بانتظار رد البائع).
 */
import type {NextRequest} from 'next/server';
import {
  assertSameOrigin,
  ok,
  parseJsonBody,
  withApi,
  ApiError
} from '@/lib/api/http';
import {logAudit} from '@/lib/audit';
import {requireUser} from '@/lib/auth/guards';
import {hitRateLimit, secondsUntilReset} from '@/lib/auth/rate-limit';
import {normalizeNeighborhood} from '@/lib/matching';
import {
  SEARCH_CREATE_RATE_LIMIT,
  SEARCH_READ_RATE_LIMIT,
  SEARCHES_LIST_MAX_ITEMS
} from '@/lib/matches/constants';
import {searchCreateSchema} from '@/lib/matches/schemas';
import {toBuyerMatchView, toPublicSearchRequest} from '@/lib/matches/serializers';
import {runSearchMatchingAndPersist} from '@/lib/matches/service';
import {prisma} from '@/lib/prisma';

export const runtime = 'nodejs';

export const POST = withApi(async (request: NextRequest) => {
  assertSameOrigin(request);
  const {user} = await requireUser(request);

  const rate = hitRateLimit(
    `search:user:${user.id}`,
    SEARCH_CREATE_RATE_LIMIT.limit,
    SEARCH_CREATE_RATE_LIMIT.windowMs
  );
  if (!rate.allowed) {
    throw new ApiError(429, 'RATE_LIMITED', 'بلغت الحد اليومي لطلبات البحث — أعد المحاولة غداً', {
      retryAfterSeconds: secondsUntilReset(rate.resetAt)
    });
  }

  const body = await parseJsonBody(request, searchCreateSchema);

  const search = await prisma.searchRequest.create({
    data: {
      buyerId: user.id,
      transactionType: body.dealType,
      propertyType: body.propertyType,
      wilayaCode: body.wilaya,
      communeId: body.commune ?? null,
      // الأحياء تُخزَّن مُطبَّعة لخدمة الطبقة المكانية (نفس دالة المحرك)
      neighborhoods: body.neighborhoods.map(normalizeNeighborhood).filter((n) => n.length > 0),
      maxBudget: body.maxBudget,
      minAreaM2: body.minAreaM2 ?? null,
      minRooms: body.minRooms ?? null,
      minBathrooms: body.minBathrooms ?? null
    }
  });

  const run = await runSearchMatchingAndPersist(search);

  // بطاقات النتائج للعرض الفوري (استعلام واحد بعلاقاته — لا N+1)
  const matches = await prisma.match.findMany({
    where: {searchRequestId: search.id},
    orderBy: {internalScore: 'desc'},
    include: {
      property: {
        include: {
          wilaya: {select: {code: true, nameAr: true, nameFr: true}},
          commune: {select: {id: true, nameAr: true, nameFr: true}},
          images: {orderBy: {sortOrder: 'asc'}, take: 1}
        }
      }
    }
  });

  await logAudit({
    actorId: user.id,
    action: 'search.create',
    entity: 'search_request',
    entityId: search.id,
    metadata: {matchesCreated: run.matchesCreated}
  });

  return ok(
    {
      search: toPublicSearchRequest({...search, _count: {matches: matches.length}}, run.matchesCreated),
      matchesCreated: run.matchesCreated,
      matches: matches.map(toBuyerMatchView)
    },
    {status: 201}
  );
});

export const GET = withApi(async (request: NextRequest) => {
  const {user} = await requireUser(request);

  // محدد معدل قراءة (الإنشاء له سقفه اليومي الأضيق أعلاه)
  const readRate = hitRateLimit(
    `search:read:${user.id}`,
    SEARCH_READ_RATE_LIMIT.limit,
    SEARCH_READ_RATE_LIMIT.windowMs
  );
  if (!readRate.allowed) {
    throw new ApiError(429, 'RATE_LIMITED', 'طلبات قراءة كثيرة — أعد المحاولة بعد قليل', {
      retryAfterSeconds: secondsUntilReset(readRate.resetAt)
    });
  }

  const searches = await prisma.searchRequest.findMany({
    where: {buyerId: user.id},
    orderBy: {createdAt: 'desc'},
    take: SEARCHES_LIST_MAX_ITEMS,
    include: {
      _count: {select: {matches: true}},
      matches: {where: {status: 'SELLER_NOTIFIED'}, select: {id: true}}
    }
  });

  return ok({
    items: searches.map((s) => toPublicSearchRequest(s, s.matches.length)),
    count: searches.length
  });
});
