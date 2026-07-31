/** ثوابت نظام المصادقة — نقية (قابلة للاستيراد في proxy بلا node deps) */

/** اسم كوكي الجلسة */
export const SESSION_COOKIE = 'aqar_session';

/** عمر الجلسة بالأيام */
export const SESSION_TTL_DAYS = 30;

/** طول رمز OTP */
export const OTP_CODE_LENGTH = 6;

/** صلاحية الرمز بالدقائق */
export const OTP_TTL_MINUTES = 10;

/** أقصى محاولات تحقق خاطئة قبل إبطال الرمز (يُخزَّن أيضاً على سجل DB) */
export const OTP_MAX_ATTEMPTS = 5;

/** مهلة إعادة طلب الرمز (ثوانٍ) — لعرض عدّاد في الواجهة */
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

/** محدد معدل قراءة «المستخدم الحالي» لكل IP — دفاع عميق إضافي (المرحلة 8) */
export const AUTH_ME_READ_RATE_LIMIT = {limit: 60, windowMs: 60_000} as const; // في الدقيقة

/** أدوار قابلة للتسجيل ذاتياً — admin خارجها عمداً */
export const REGISTERABLE_ROLES = ['seller', 'buyer', 'agency', 'both'] as const;
export type RegisterableRole = (typeof REGISTERABLE_ROLES)[number];
