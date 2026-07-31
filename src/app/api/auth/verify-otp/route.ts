/**
 * POST /api/auth/verify-otp — التحقق من الرمز + دخول أو إنشاء حساب.
 * قواعد العمل الصارمة:
 *   - رقم مسجّل ← دخول فقط (يُتجاهَل الاسم/الدور المُدخَلان)
 *   - رقم جديد   ← إنشاء حساب (الاسم إلزامي) + تفضيلات افتراضية
 */
import type {NextRequest} from 'next/server';
import {prisma} from '@/lib/prisma';
import {logAudit} from '@/lib/audit';
import {ApiError, getClientIp, getUserAgent, ok, parseJsonBody, withApi} from '@/lib/api/http';
import {SESSION_COOKIE} from '@/lib/auth/constants';
import {getOtpPepper, hashOtpCode, verifyOtpHash} from '@/lib/auth/otp';
import {generateSessionToken, hashIp, hashSessionToken} from '@/lib/auth/tokens';
import {normalizeDzPhone} from '@/lib/auth/phone';
import {hitRateLimit, secondsUntilReset} from '@/lib/auth/rate-limit';
import {toPublicUser} from '@/lib/auth/serializers';
import {sessionCookieOptions, sessionExpiryFromNow} from '@/lib/auth/session';
import {verifyOtpSchema} from '@/lib/auth/schemas';

export const runtime = 'nodejs';

const TEN_MINUTES_MS = 600_000;

export const POST = withApi(async (request: NextRequest) => {
  const body = await parseJsonBody(request, verifyOtpSchema);

  const normalized = normalizeDzPhone(body.phone);
  if (!normalized.ok) {
    throw new ApiError(400, 'INVALID_PHONE', `رقم غير صالح: ${normalized.reason}`);
  }
  const phone = normalized.phone;

  // محدد معدل التحقق — يكمّل عدّاد المحاولات في DB
  const rate = hitRateLimit(`otp:ver:phone:${phone}`, 10, TEN_MINUTES_MS);
  if (!rate.allowed) {
    throw new ApiError(429, 'RATE_LIMITED', 'تم تجاوز الحد المسموح', {
      retryAfterSeconds: secondsUntilReset(rate.resetAt)
    });
  }

  // أحدث رمز نشط للرقم
  const otp = await prisma.otpCode.findFirst({
    where: {phone, consumedAt: null},
    orderBy: {createdAt: 'desc'}
  });
  if (!otp || otp.expiresAt.getTime() <= Date.now()) {
    throw new ApiError(400, 'OTP_EXPIRED', 'لا يوجد رمز صالح — اطلب رمزاً جديداً');
  }
  if (otp.attempts >= otp.maxAttempts) {
    throw new ApiError(429, 'OTP_TOO_MANY', 'محاولات خاطئة كثيرة');
  }

  const candidateHash = hashOtpCode(phone, body.code, getOtpPepper());
  if (!verifyOtpHash(otp.codeHash, candidateHash)) {
    const attemptsLeft = otp.maxAttempts - (otp.attempts + 1);
    await prisma.otpCode.update({
      where: {id: otp.id},
      data: {
        attempts: {increment: 1},
        // استنفاد المحاولات يُبطل الرمز فوراً
        consumedAt: attemptsLeft <= 0 ? new Date() : null
      }
    });
    throw new ApiError(400, 'OTP_INVALID', 'رمز غير صحيح', {attemptsLeft: Math.max(0, attemptsLeft)});
  }

  // نجاح التحقق — استهلاك الرمز ذرّياً (يمنع إعادة استخدام متزامنة)
  const consumed = await prisma.otpCode.updateMany({
    where: {id: otp.id, consumedAt: null},
    data: {consumedAt: new Date()}
  });
  if (consumed.count !== 1) {
    throw new ApiError(400, 'OTP_EXPIRED', 'الرمز استُهلك — اطلب رمزاً جديداً');
  }

  // ── دخول أو إنشاء حساب ──
  const now = new Date();
  const existing = await prisma.user.findUnique({where: {phone}});
  if (existing?.deletedAt) {
    throw new ApiError(403, 'ACCOUNT_DISABLED', 'هذا الحساب موقوف');
  }

  let user;
  let isNew = false;
  if (existing) {
    // دخول فقط — يُمنع تغيير الاسم/الدور عبر هذا المسار (قاعدة مصادقة صارمة)
    user = await prisma.user.update({
      where: {id: existing.id},
      data: {
        lastLoginAt: now,
        ...(body.locale ? {preferredLocale: body.locale} : {})
      }
    });
  } else {
    const name = body.name?.trim();
    if (!name) {
      throw new ApiError(400, 'NAME_REQUIRED', 'الاسم مطلوب لإنشاء حساب جديد', {field: 'name'});
    }
    isNew = true;
    user = await prisma.user.create({
      data: {
        phone,
        name,
        role: body.role ?? 'both',
        preferredLocale: body.locale ?? 'ar',
        lastLoginAt: now,
        // تفضيلات المطابقة الافتراضية (1:1) — تُملأ لاحقاً من سلوك المستخدم
        preferences: {create: {}}
      }
    });
  }

  // ── جلسة جديدة (يُخزَّن hash فقط) ──
  const token = generateSessionToken();
  await prisma.session.create({
    data: {
      tokenHash: hashSessionToken(token),
      userId: user.id,
      userAgent: getUserAgent(request),
      ipHash: hashIp(getClientIp(request), getOtpPepper()),
      expiresAt: sessionExpiryFromNow()
    }
  });

  await logAudit({
    actorId: user.id,
    action: isNew ? 'auth.register' : 'auth.login',
    entity: 'user',
    entityId: user.id,
    metadata: {phone, role: user.role}
  });

  const response = ok({user: toPublicUser(user), isNew});
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
});
