/**
 * /api/properties
 *
 * POST — نشر عقار جديد (عام: بجلسة أو بدونها).
 *   التدفق: CSRF ⇐ محدد معدل ⇐ Zod صارم (قواعد matching.ts بلا تكرار)
 *   ⇐ تطبيع الهواتف ⇐ حسم الهوية (جلسة/حساب/مجهول ⇐ UNMONITORED)
 *   ⇐ حساب الرسم عبر calcSellerFee على secretMin (في الخادم فقط)
 *   ⇐ إنشاء متداخل مع الصور ⇐ إيصال بلا أي أثر للسرّي.
 *
 * GET — آخر 200 عقار (إداري: دور admin فقط — جاهز للوحة المرحلة 6).
 *   حتى مع كونها إدارية، تمر عبر مسلسِل يحجب secretMin ويقنّع ownerPhone
 *   (دفاع بالعمق: التسريب مستحيل مهما كان المستهلك).
 */
import type {NextRequest} from 'next/server';
import {
  ApiError,
  assertSameOrigin,
  getClientIp,
  ok,
  parseJsonBody,
  withApi
} from '@/lib/api/http';
import {logAudit} from '@/lib/audit';
import {requireRole, requireUser} from '@/lib/auth/guards';
import {maskDzPhone, normalizeDzPhone} from '@/lib/auth/phone';
import {hitRateLimit, secondsUntilReset} from '@/lib/auth/rate-limit';
import {getSessionUserOrNull} from '@/lib/auth/session';
import {calcSellerFee} from '@/lib/matching';
import {prisma} from '@/lib/prisma';
import {
  ADMIN_LIST_MAX_ITEMS,
  PUBLISH_RATE_LIMIT_PER_IP,
  PUBLISH_RATE_LIMIT_PER_USER
} from '@/lib/properties/constants';
import {MAX_IMAGES_PER_PROPERTY} from '@/lib/uploads/constants';
import {propertyCreateSchema} from '@/lib/properties/schemas';
import {toPublicPropertyListItem, toPublishReceipt} from '@/lib/properties/serializers';
import {createPropertyRecord, resolvePublishIdentity} from '@/lib/properties/service';

export const runtime = 'nodejs';

export const POST = withApi(async (request: NextRequest) => {
  assertSameOrigin(request);

  // 1) جلسة اختيارية — النشر العام مقصود (مبدأ المنتج)
  const session = await getSessionUserOrNull();

  // 2) محدد المعدل: لكل IP دائماً + لكل حساب سقف يومي أوسع
  const byIp = hitRateLimit(
    `publish:ip:${getClientIp(request)}`,
    PUBLISH_RATE_LIMIT_PER_IP.limit,
    PUBLISH_RATE_LIMIT_PER_IP.windowMs
  );
  if (!byIp.allowed) {
    throw new ApiError(429, 'RATE_LIMITED', 'محاولات نشر كثيرة من هذا العنوان', {
      retryAfterSeconds: secondsUntilReset(byIp.resetAt)
    });
  }
  if (session) {
    const byUser = hitRateLimit(
      `publish:user:${session.user.id}`,
      PUBLISH_RATE_LIMIT_PER_USER.limit,
      PUBLISH_RATE_LIMIT_PER_USER.windowMs
    );
    if (!byUser.allowed) {
      throw new ApiError(429, 'RATE_LIMITED', 'بلغت الحد اليومي للنشر — أعد المحاولة غداً', {
        retryAfterSeconds: secondsUntilReset(byUser.resetAt)
      });
    }
  }

  // 3) تحقق صارم + قواعد العمل (refinements داخل المخطط نفسه)
  const body = await parseJsonBody(request, propertyCreateSchema);

  // 4) الهواتف: تطبيع مركزي (نفس دالة المصادقة)
  const ownerPhone = normalizeDzPhone(body.ownerPhone);
  if (!ownerPhone.ok) {
    throw new ApiError(400, 'INVALID_PHONE', `هاتف المالك غير صالح (${ownerPhone.reason})`);
  }
  const userPhone = body.userPhone ? normalizeDzPhone(body.userPhone) : null;
  if (userPhone && !userPhone.ok) {
    throw new ApiError(400, 'INVALID_PHONE', `هاتف الحساب المراد الربط به غير صالح (${userPhone.reason})`);
  }

  // 5) الهوية: جلسة ⇐ حساب موجود ⇐ مجهول (UNMONITORED)
  const identity = await resolvePublishIdentity({
    sessionUser: session?.user ?? null,
    userPhoneNormalized: userPhone?.ok ? userPhone.phone : null
  });

  // 6) الرسم (على السرّي — هنا فقط، ولا يُخزَّن على العقار بل يلتقط عند المطابقة)
  const fee = calcSellerFee(body.dealType, body.secretMin);

  // 7) الإنشاء المتداخل
  const property = await createPropertyRecord(body, {
    ownerName: body.ownerName,
    ownerPhone: ownerPhone.phone,
    accountType: body.accountType,
    source: 'MANUAL',
    identity
  });

  await logAudit({
    actorId: identity.sellerId,
    action: 'property.create',
    entity: 'property',
    entityId: property.id,
    // بلا أي بيانات سريّة في السجل: سعر علني/رسم/حالة/هاتف مقنَّع فقط
    metadata: {
      source: 'MANUAL',
      status: property.status,
      fee,
      askingPrice: property.askingPrice.toString(),
      ownerPhoneMasked: maskDzPhone(ownerPhone.phone)
    }
  });

  // 8) الإيصال — بلا secretMin إطلاقاً (حسب العقد: id + fee + status)
  return ok(toPublishReceipt(property, fee, body.images.length), {status: 201});
});

export const GET = withApi(async (request: NextRequest) => {
  const {user} = await requireUser(request);
  requireRole(user, ['admin']);

  // استعلام واحد بعلاقاته (بلا N+1) — آخر 200.
  // الصور محدودة صراحة بسقف العقار الواحد (لا نظام يقبض أكثر منه عند الإنشاء،
  // والحد يحمي من أي انحراف مستقبلي في البيانات — المرحلة 8).
  const properties = await prisma.property.findMany({
    orderBy: {createdAt: 'desc'},
    take: ADMIN_LIST_MAX_ITEMS,
    include: {
      wilaya: {select: {code: true, nameAr: true, nameFr: true}},
      commune: {select: {id: true, nameAr: true, nameFr: true}},
      images: {orderBy: {sortOrder: 'asc'}, take: MAX_IMAGES_PER_PROPERTY}
    }
  });

  return ok({
    items: properties.map(toPublicPropertyListItem),
    count: properties.length
  });
});
