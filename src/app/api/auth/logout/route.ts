/**
 * POST /api/auth/logout — إتلاف الجلسة ومسح الكوكي.
 * متساهل: ينجح حتى بلا جلسة صالحة (idempotent) — لكنه محمي بفحص الأصل (CSRF).
 */
import type {NextRequest} from 'next/server';
import {logAudit} from '@/lib/audit';
import {assertSameOrigin, ok, withApi} from '@/lib/api/http';
import {SESSION_COOKIE} from '@/lib/auth/constants';
import {destroySessionByToken, getSessionByToken} from '@/lib/auth/session';

export const runtime = 'nodejs';

export const POST = withApi(async (request: NextRequest) => {
  assertSameOrigin(request);

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    const existing = await getSessionByToken(token);
    await destroySessionByToken(token);
    if (existing) {
      await logAudit({
        actorId: existing.user.id,
        action: 'auth.logout',
        entity: 'user',
        entityId: existing.user.id
      });
    }
  }

  const response = ok({loggedOut: true});
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0
  });
  return response;
});
