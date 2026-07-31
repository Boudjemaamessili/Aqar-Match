/**
 * POST /api/auth/request-otp — طلب رمز تحقق لرقم جزائري.
 * عام بطبيعته؛ يُحمى بمحديد معدل (هاتف + IP) وتحقق صارم للمدخلات.
 */
import type {NextRequest} from 'next/server';
import {prisma} from '@/lib/prisma';
import {logAudit} from '@/lib/audit';
import {ApiError, getClientIp, ok, parseJsonBody, withApi} from '@/lib/api/http';
import {OTP_MAX_ATTEMPTS, OTP_RESEND_COOLDOWN_SECONDS, OTP_TTL_MINUTES} from '@/lib/auth/constants';
import {generateOtpCode, getOtpPepper, hashOtpCode} from '@/lib/auth/otp';
import {sendOtpCode} from '@/lib/auth/otp-sender';
import {normalizeDzPhone} from '@/lib/auth/phone';
import {hitRateLimit, secondsUntilReset} from '@/lib/auth/rate-limit';
import {requestOtpSchema} from '@/lib/auth/schemas';

export const runtime = 'nodejs';

const TEN_MINUTES_MS = 600_000;

export const POST = withApi(async (request: NextRequest) => {
  const body = await parseJsonBody(request, requestOtpSchema);

  // 1) تطبيع الهاتف (مصدر الحقيقة الوحيد)
  const normalized = normalizeDzPhone(body.phone);
  if (!normalized.ok) {
    throw new ApiError(400, 'INVALID_PHONE', `رقم غير صالح: ${normalized.reason}`);
  }
  const phone = normalized.phone;

  // 2) محدد المعدل: 3/10د للرقم + 20/10د لعنوان IP
  const byPhone = hitRateLimit(`otp:req:phone:${phone}`, 3, TEN_MINUTES_MS);
  const byIp = hitRateLimit(`otp:req:ip:${getClientIp(request)}`, 20, TEN_MINUTES_MS);
  const throttled = !byPhone.allowed ? byPhone : !byIp.allowed ? byIp : null;
  if (throttled) {
    throw new ApiError(429, 'RATE_LIMITED', 'تم تجاوز الحد المسموح', {
      retryAfterSeconds: secondsUntilReset(throttled.resetAt)
    });
  }

  // 3) إبطال أي رموز سابقة غير مستهلكة — رمز نشط واحد فقط لكل رقم
  const existingUser = await prisma.user.findUnique({where: {phone}, select: {id: true}});
  const now = new Date();
  await prisma.otpCode.updateMany({
    where: {phone, consumedAt: null},
    data: {consumedAt: now}
  });

  // 4) إنشاء الرمز موقّعاً (HMAC) — لا يُخزَّن صراحة أبداً
  const code = generateOtpCode();
  await prisma.otpCode.create({
    data: {
      phone,
      userId: existingUser?.id ?? null,
      codeHash: hashOtpCode(phone, code, getOtpPepper()),
      maxAttempts: OTP_MAX_ATTEMPTS,
      expiresAt: new Date(now.getTime() + OTP_TTL_MINUTES * 60_000)
    }
  });

  // 5) الإرسال (محاكاة في التطوير — نقطة تكامل المزوّد الوحيدة)
  const sent = await sendOtpCode(phone, code);

  await logAudit({
    actorId: existingUser?.id ?? null,
    action: 'auth.otp.request',
    entity: 'otp',
    metadata: {phone, mock: sent.mock}
  });

  return ok({
    expiresInSeconds: OTP_TTL_MINUTES * 60,
    cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
    mock: sent.mock,
    devCode: sent.devCode
  });
});
