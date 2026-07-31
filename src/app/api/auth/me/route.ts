/**
 * GET /api/auth/me — المستخدم الحالي (للمكوّنات العميلة كرابط الحساب في الترويسة).
 * محدودة المعدل لكل IP — دفاع عميق (الجلسة وحدها هي التفويض) (المرحلة 8).
 */
import type {NextRequest} from 'next/server';
import {ApiError, getClientIp, ok, withApi} from '@/lib/api/http';
import {requireUser} from '@/lib/auth/guards';
import {AUTH_ME_READ_RATE_LIMIT} from '@/lib/auth/constants';
import {hitRateLimit, secondsUntilReset} from '@/lib/auth/rate-limit';
import {toPublicUser} from '@/lib/auth/serializers';

export const runtime = 'nodejs';

export const GET = withApi(async (request: NextRequest) => {
  const rate = hitRateLimit(
    `auth:me:${getClientIp(request)}`,
    AUTH_ME_READ_RATE_LIMIT.limit,
    AUTH_ME_READ_RATE_LIMIT.windowMs
  );
  if (!rate.allowed) {
    throw new ApiError(429, 'RATE_LIMITED', 'طلبات كثيرة — أعد المحاولة بعد قليل', {
      retryAfterSeconds: secondsUntilReset(rate.resetAt)
    });
  }

  const {user} = await requireUser(request);
  return ok({user: toPublicUser(user)});
});
