/**
 * GET /api/stats — إحصائيات المنصة العامة (عدّادات ومتوسطات فقط).
 * ديناميكي قسرياً: الأرقام تُحسب لحظياً. مع Fallback ذكي داخل الخدمة:
 * قاعدة فارغة أو عطل قراءة ⇒ أرقام استرشادية موسومة isFallback.
 * عامة لكنها محدودة المعدل لكل IP (دفاع ضد السحب الآلي — المرحلة 8).
 */
import type {NextRequest} from 'next/server';
import {ApiError, getClientIp, ok, withApi} from '@/lib/api/http';
import {hitRateLimit, secondsUntilReset} from '@/lib/auth/rate-limit';
import {STATS_READ_RATE_LIMIT} from '@/lib/stats/core';
import {getPlatformStats} from '@/lib/stats/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withApi(async (request: NextRequest) => {
  const rate = hitRateLimit(
    `stats:read:ip:${getClientIp(request)}`,
    STATS_READ_RATE_LIMIT.limit,
    STATS_READ_RATE_LIMIT.windowMs
  );
  if (!rate.allowed) {
    throw new ApiError(429, 'RATE_LIMITED', 'طلبات كثيرة من هذا العنوان — أعد المحاولة بعد قليل', {
      retryAfterSeconds: secondsUntilReset(rate.resetAt)
    });
  }
  return ok(await getPlatformStats());
});
