/**
 * POST /api/properties/claim-mine — المطالبة (التصعيد) بالإعلانات المجهولة.
 *
 * القاعدة: جلسة المستخدم تُثبت ملكية هاتفه (OTP)، لذا أي إعلان منشور
 * بلا حساب (UNMONITORED) يحمل ownerPhone = هاتفه هو ملكه فعلياً.
 * تُربط بحسابه (sellerId) وتُرقَّى إلى ACTIVE فتصبح قابلة للرد على
 * المطابقات الواردة — هذا هو «التصعيد الطبيعي للبائعين الجادّين».
 *
 * لا نلمس بطاقة اتصال أحد آخر: المعيار تطابق الهاتف المُتحقَّق منه حصراً
 * ولا يُقبل أي معامل اختيار خارجي (لا ids ولا phone في الجسم — JSON فارغ).
 *
 * ذرّي وidempotent: updateMany بشروط مرشِّحة؛ إعادة الاستدعاء = 0 مطالبة.
 */
import type {NextRequest} from 'next/server';
import {
  ApiError,
  assertSameOrigin,
  ok,
  withApi
} from '@/lib/api/http';
import {logAudit} from '@/lib/audit';
import {requireUser} from '@/lib/auth/guards';
import {maskDzPhone} from '@/lib/auth/phone';
import {hitRateLimit, secondsUntilReset} from '@/lib/auth/rate-limit';
import {prisma} from '@/lib/prisma';
import {PROPERTY_CLAIM_RATE_LIMIT} from '@/lib/properties/constants';

export const runtime = 'nodejs';

export const POST = withApi(async (request: NextRequest) => {
  assertSameOrigin(request);
  const {user} = await requireUser(request);

  const rate = hitRateLimit(
    `property:claim:${user.id}`,
    PROPERTY_CLAIM_RATE_LIMIT.limit,
    PROPERTY_CLAIM_RATE_LIMIT.windowMs
  );
  if (!rate.allowed) {
    throw new ApiError(429, 'RATE_LIMITED', 'محاولات كثيرة — أعد المحاولة بعد قليل', {
      retryAfterSeconds: secondsUntilReset(rate.resetAt)
    });
  }

  // لا جسم مطلوباً — لكن إن أُرسل يجب أن يكون JSON فارغاً صحيحاً (صرامة المدخلات)
  const text = await request.text();
  if (text.trim().length > 0) {
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      throw new ApiError(400, 'INVALID_JSON', 'جسم الطلب ليس JSON صالحاً');
    }
    if (typeof raw === 'object' && raw !== null && Object.keys(raw).length > 0) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'هذه النقطة لا تقبل أي معاملات — الهوية من الجلسة');
    }
  }

  // الربط الذرّي: مجهولة + هاتفي + غير مرتبطة أصلاً
  const claimed = await prisma.property.updateMany({
    where: {
      ownerPhone: user.phone,
      sellerId: null,
      status: 'UNMONITORED'
    },
    data: {
      sellerId: user.id,
      status: 'ACTIVE'
    }
  });

  // إشعار داخلي بالرقم فقط (payload معرفات/أرقام — قاعدة المخطط)
  if (claimed.count > 0) {
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'SYSTEM',
        payload: {event: 'PROPERTIES_CLAIMED', count: claimed.count}
      }
    });
  }

  await logAudit({
    actorId: user.id,
    action: 'property.claim_mine',
    entity: 'property',
    metadata: {claimed: claimed.count, ownerPhoneMasked: maskDzPhone(user.phone)}
  });

  // القيمة وحدها تكفي الواجهة (لا نعيد القائمة — بيانات المستخدم في لوحته)
  return ok({claimed: claimed.count});
});
