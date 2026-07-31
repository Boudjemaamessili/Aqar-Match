/**
 * GET /api/notifications — إشعاراتي (الأحدث أولاً) + عدد غير المقروءة.
 * الحمولات معرفات فقط (بلا بيانات حساسة — قاعدة المخطط).
 * محدد معدل سخي (الواجهة تستطلع دورياً) لكنه مانع للسحب الآلي.
 */
import type {NextRequest} from 'next/server';
import {ApiError, ok, withApi} from '@/lib/api/http';
import {requireUser} from '@/lib/auth/guards';
import {hitRateLimit, secondsUntilReset} from '@/lib/auth/rate-limit';
import {NOTIFICATIONS_LIST_MAX_ITEMS, NOTIFICATIONS_READ_RATE_LIMIT} from '@/lib/matches/constants';
import {prisma} from '@/lib/prisma';

export const runtime = 'nodejs';

export const GET = withApi(async (request: NextRequest) => {
  const {user} = await requireUser(request);

  const rate = hitRateLimit(
    `notifications:read:${user.id}`,
    NOTIFICATIONS_READ_RATE_LIMIT.limit,
    NOTIFICATIONS_READ_RATE_LIMIT.windowMs
  );
  if (!rate.allowed) {
    throw new ApiError(429, 'RATE_LIMITED', 'طلبات كثيرة — أعد المحاولة بعد قليل', {
      retryAfterSeconds: secondsUntilReset(rate.resetAt)
    });
  }

  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: {userId: user.id},
      orderBy: {createdAt: 'desc'},
      take: NOTIFICATIONS_LIST_MAX_ITEMS,
      select: {id: true, type: true, payload: true, readAt: true, createdAt: true}
    }),
    prisma.notification.count({where: {userId: user.id, readAt: null}})
  ]);

  return ok({
    items: items.map((n) => ({
      id: n.id,
      type: n.type,
      payload: n.payload,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString()
    })),
    unreadCount
  });
});
