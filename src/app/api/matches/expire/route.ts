/**
 * POST /api/matches/expire — كنس يدوي شامل للمطابقات المنتهية (إداري).
 * قرار معتمد: الكنس كسول في نقاط القراءة + هذه النقطة للتشغيل اليدوي/
 * المجدول الخارجي لاحقاً (تُحمى بدور admin الآن).
 */
import type {NextRequest} from 'next/server';
import {ok, withApi} from '@/lib/api/http';
import {logAudit} from '@/lib/audit';
import {requireRole, requireUser} from '@/lib/auth/guards';
import {expireOverdueMatches} from '@/lib/matches/service';

export const runtime = 'nodejs';

export const POST = withApi(async (request: NextRequest) => {
  const {user} = await requireUser(request);
  requireRole(user, ['admin']);

  const result = await expireOverdueMatches();

  await logAudit({
    actorId: user.id,
    action: 'match.expire_sweep',
    entity: 'match',
    metadata: {expired: result.expired}
  });

  return ok(result);
});
