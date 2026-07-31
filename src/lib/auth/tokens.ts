/**
 * رموز الجلسة — طبقة نقية.
 * القاعدة: ما يصل للمتصفح (token) يختلف عما يُخزَّن (sha256 hex).
 */
import {createHash, randomBytes} from 'node:crypto';

/** رمز جلسة جديد: 32 بايت عشوائية base64url (‎≈43 حرفاً) */
export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

/** بصمة التخزين للرمز (SHA-256) */
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

/** بصمة عنوان IP للتدقيق — لا نخزّن العنوان صراحة */
export function hashIp(ip: string, pepper: string): string {
  return createHash('sha256').update(`${pepper}:${ip}`, 'utf8').digest('hex');
}
