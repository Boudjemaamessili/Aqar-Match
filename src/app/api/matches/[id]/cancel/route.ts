/**
 * POST /api/matches/:id/cancel — إلغاء كامل لمطابقة (قبل كشف التواصل فقط).
 * أيٌّ من الطرفين؛ الطرف الآخر يُشعَر (MATCH_CANCELLED). body: {reason?}
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
import {hitRateLimit, secondsUntilReset} from '@/lib/auth/rate-limit';
import {MATCH_ACTION_RATE_LIMIT} from '@/lib/matches/constants';
import {cancelMatchSchema} from '@/lib/matches/schemas';
import {cancelMatch, getMatchForParty} from '@/lib/matches/service';

export const runtime = 'nodejs';

type Props = {params: Promise<{id: string}>};

export const POST = withApi(async (request: NextRequest, {params}: Props) => {
  assertSameOrigin(request);
  const {user} = await requireUser(request);

  const rate = hitRateLimit(
    `match:act:${user.id}`,
    MATCH_ACTION_RATE_LIMIT.limit,
    MATCH_ACTION_RATE_LIMIT.windowMs
  );
  if (!rate.allowed) {
    throw new ApiError(429, 'RATE_LIMITED', 'محاولات كثيرة — أعد المحاولة لاحقاً', {
      retryAfterSeconds: secondsUntilReset(rate.resetAt)
    });
  }

  const {id} = await params;

  // الجسم اختياري بالكامل — تقبَّل الفارغ
  let reason: string | null = null;
  const text = await request.text();
  if (text.trim().length > 0) {
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      throw new ApiError(400, 'INVALID_JSON', 'جسم الطلب ليس JSON صالحاً');
    }
    reason = cancelMatchSchema.parse(raw).reason ?? null;
  }

  const {match} = await getMatchForParty(id, user);
  const outcome = await cancelMatch(match, user, reason);

  await logAudit({
    actorId: user.id,
    action: 'match.cancel',
    entity: 'match',
    entityId: match.id,
    metadata: {by: match.sellerId === user.id ? 'seller' : 'buyer'}
  });

  return ok(outcome);
});
