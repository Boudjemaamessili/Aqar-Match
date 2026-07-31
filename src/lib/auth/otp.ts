/**
 * توليد وتوقيع رموز OTP — طبقة نقية (crypto فقط، بلا DB).
 *
 * الرقم نفسه جزء من التوقيع (HMAC-SHA256) ⇒ رمز مسروق من رقم
 * لا يصلح لرقم آخر. لا يُخزَّن الرمز صراحة أبداً.
 */
import {createHmac, randomInt, timingSafeEqual} from 'node:crypto';
import {OTP_CODE_LENGTH} from './constants';

/** توقيع التطوير الافتراضي — يُرفض في الإنتاج */
const DEV_FALLBACK_PEPPER = 'dev-only-pepper-change-me';

/** رمز عشوائي آمن تشفيرياً من OTP_CODE_LENGTH أرقام */
export function generateOtpCode(length: number = OTP_CODE_LENGTH): string {
  const max = 10 ** length;
  return randomInt(0, max).toString().padStart(length, '0');
}

/** مفتاح التوقيع من البيئة — يفشل بإغلاق صارم في الإنتاج بلا مفتاح */
export function getOtpPepper(): string {
  const pepper = process.env.OTP_PEPPER;
  if (pepper && pepper !== DEV_FALLBACK_PEPPER) {
    return pepper;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('OTP_PEPPER غير مهيأ في الإنتاج — أوقف الإقلاع الآن');
  }
  return DEV_FALLBACK_PEPPER;
}

/** HMAC-SHA256(pepper, "phone:code") بصيغة hex */
export function hashOtpCode(phone: string, code: string, pepper: string = getOtpPepper()): string {
  return createHmac('sha256', pepper).update(`${phone}:${code}`, 'utf8').digest('hex');
}

/** مقارنة آمنة زمنياً — تتحمل اختلاف الأطوال دون تسريب */
export function verifyOtpHash(expectedHash: string, candidateHash: string): boolean {
  const a = Buffer.from(expectedHash, 'hex');
  const b = Buffer.from(candidateHash, 'hex');
  if (a.length !== b.length || a.length === 0) {
    // إنفاق زمن مماثل لتفادي قياس الطول
    timingSafeEqual(Buffer.alloc(32), Buffer.alloc(32));
    return false;
  }
  return timingSafeEqual(a, b);
}
