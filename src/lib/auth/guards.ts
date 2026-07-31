/**
 * حُرّاس المسارات — كل API محمي يبدأ من هنا.
 * requireUser: 401 بلا جلسة · requireRole: 403 بدورٍ غير كافٍ.
 */
import type {User} from '@prisma/client';
import {ApiError} from '@/lib/api/http';
import {SESSION_COOKIE} from './constants';
import {getSessionByToken, type SessionWithUser} from './session';

/** يستخرج الجلسة من كوكي طلب الـ API أو يرمي 401 */
export async function requireUser(request: Request): Promise<SessionWithUser> {
  const token = readCookieValue(request.headers.get('cookie'), SESSION_COOKIE);
  if (!token) {
    throw new ApiError(401, 'UNAUTHENTICATED', 'جلسة غير موجودة — سجّل الدخول');
  }
  const session = await getSessionByToken(token);
  if (!session) {
    throw new ApiError(401, 'UNAUTHENTICATED', 'جلسة منتهية أو غير صالحة');
  }
  return session;
}

/** تحقق دور (للمراحل القادمة: نشر عقارات، استيراد وكالات… اعتماد الإدارة) */
export function requireRole(user: User, allowed: readonly string[]): void {
  if (!allowed.includes(user.role)) {
    throw new ApiError(403, 'FORBIDDEN', 'ليست لديك صلاحية هذا الإجراء');
  }
}

/** قارئ كوكي خفيف بلا تبعيات (Request.headers الخام) */
function readCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return null;
}
