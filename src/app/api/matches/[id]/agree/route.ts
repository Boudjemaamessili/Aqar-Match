/**
 * POST /api/matches/:id/agree — موافقة البائع + الدفع ← كشف التواصل.
 *
 * المالك المرتبط فقط (match.sellerId === session). عقار UNMONITORED لا يملك
 * بائعاً حسابياً — يبقى بانتظار الربط وينقضي آلياً (تصعيد طبيعي للبائعين
 * الجادّين المسجّلين). محاكاة الدفع هنا مقصودة (provider:'mock') — التكامل
 * البنكي (CIB/EDAHABIA) يركّب خلف نفس دالة الخدمة في مرحلة الإنتاج.
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
import {agreeAndPayMatch, expireOverdueMatches, getMatchForParty} from '@/lib/matches/service';

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

  // كنس كسول على نطاق البائع — ربما انقضت مهلة هذه المطابقة ذاتها
  await expireOverdueMatches({sellerId: user.id});

  // يجب أن تكون بائعها (buyer لا يوافق على مطابقة بائع)
  const {match, party} = await getMatchForParty(id, user);
  if (party !== 'seller') {
    throw new ApiError(403, 'MATCH_NOT_PARTY', 'الموافقة والدفع من صلاحية بائع العقار');
  }

  const outcome = await agreeAndPayMatch(match, user);

  await logAudit({
    actorId: user.id,
    action: 'match.agree_pay',
    entity: 'match',
    entityId: match.id,
    metadata: {sellerFee: outcome.sellerFee, status: outcome.status}
  });

  return ok(outcome);
});
