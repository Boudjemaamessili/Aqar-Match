/**
 * إدارة الجلسات (DB-backed) — الجزء المعتمد على Prisma من نظام المصادقة.
 * لا تستورده من proxy (middleware) — فقط الحقول النقية من constants.
 */
import {cookies} from 'next/headers';
import type {Session, User} from '@prisma/client';
import {prisma} from '@/lib/prisma';
import {SESSION_COOKIE, SESSION_TTL_DAYS} from './constants';
import {generateSessionToken, hashSessionToken} from './tokens';

export interface SessionWithUser {
  readonly session: Session;
  readonly user: User;
}

export function sessionExpiryFromNow(): Date {
  return new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);
}

/** إنشاء جلسة وإرجاع رمزها الصريح (يُرسل للعميل مرة واحدة) */
export async function createSession(input: {
  readonly userId: string;
  readonly userAgent: string | null;
  readonly ipHash: string | null;
}): Promise<{readonly token: string; readonly session: Session}> {
  const token = generateSessionToken();
  const session = await prisma.session.create({
    data: {
      tokenHash: hashSessionToken(token),
      userId: input.userId,
      userAgent: input.userAgent,
      ipHash: input.ipHash,
      expiresAt: sessionExpiryFromNow()
    }
  });
  return {token, session};
}

/** جلب جلسة صالحة بمستخدمها — null لأي حالة غير صالحة (بلا استثناءات) */
export async function getSessionByToken(token: string): Promise<SessionWithUser | null> {
  const found = await prisma.session.findUnique({
    where: {tokenHash: hashSessionToken(token)},
    include: {user: true}
  });
  if (!found) return null;
  if (found.expiresAt.getTime() <= Date.now()) return null;
  if (found.user.deletedAt !== null) return null;
  return {session: found, user: found.user};
}

/** حذف جلسة بالرمز الصريح (logout متساهل: نجاح حتى لو لم توجد) */
export async function destroySessionByToken(token: string): Promise<void> {
  await prisma.session.deleteMany({where: {tokenHash: hashSessionToken(token)}});
}

/**
 * قراءة جلسة الطلب الحالي داخل RSC/route handlers عبر الكوكيز.
 * ملاحظة أداء: استعلام واحد بـ include — لا N+1.
 */
export async function getSessionUserOrNull(): Promise<SessionWithUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getSessionByToken(token);
}

/** خيارات كوكي الجلسة القياسية */
export function sessionCookieOptions(): {
  readonly httpOnly: true;
  readonly sameSite: 'lax';
  readonly secure: boolean;
  readonly path: '/';
  readonly maxAge: number;
} {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_DAYS * 86_400
  };
}
