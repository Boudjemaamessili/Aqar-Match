/**
 * POST /api/notifications/mark-read — تمييز إشعارات المستخدم كمقروءة.
 *
 * جسم JSON اختياري بالكامل: {ids: [...]} لمجموعة محددة، أو حذف الحقل
 * (أو جسم فارغ تماماً) = كل غير المقروءة. التحديث ذرّي بـ updateMany
 * منطوق عليه userId + readAt:null — يستحيل لمس إشعارات مستخدم آخر
 * ولا يُعاد كنس المقروءة سابقاً (idempotent).
 */
import type {NextRequest} from 'next/server';
import {
  ApiError,
  assertSameOrigin,
  ok,
  withApi
} from '@/lib/api/http';
import {requireUser} from '@/lib/auth/guards';
import {hitRateLimit, secondsUntilReset} from '@/lib/auth/rate-limit';
import {NOTIFICATIONS_MARK_RATE_LIMIT} from '@/lib/matches/constants';
import {notificationsMarkReadSchema} from '@/lib/matches/schemas';
import {prisma} from '@/lib/prisma';

export const runtime = 'nodejs';

export const POST = withApi(async (request: NextRequest) => {
  assertSameOrigin(request);
  const {user} = await requireUser(request);

  const rate = hitRateLimit(
    `notifications:mark:${user.id}`,
    NOTIFICATIONS_MARK_RATE_LIMIT.limit,
    NOTIFICATIONS_MARK_RATE_LIMIT.windowMs
  );
  if (!rate.allowed) {
    throw new ApiError(429, 'RATE_LIMITED', 'طلبات كثيرة — أعد المحاولة بعد قليل', {
      retryAfterSeconds: secondsUntilReset(rate.resetAt)
    });
  }

  // الجسم اختياري — الفارغ يعني «كُنِّس الكل»
  let ids: readonly string[] | undefined;
  const text = await request.text();
  if (text.trim().length > 0) {
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      throw new ApiError(400, 'INVALID_JSON', 'جسم الطلب ليس JSON صالحاً');
    }
    ids = notificationsMarkReadSchema.parse(raw).ids;
  }

  const result = await prisma.notification.updateMany({
    where: {
      userId: user.id,
      readAt: null,
      ...(ids && ids.length > 0 ? {id: {in: [...ids]}} : {})
    },
    data: {readAt: new Date()}
  });

  return ok({marked: result.count});
});
