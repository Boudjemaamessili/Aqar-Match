/**
 * آلة حالات المطابقة — طبقة نقية صارمة: لا انتقال خارج الجدول أبداً.
 *
 * السلسلة (قرار معتمد):
 *   SELLER_NOTIFIED → SELLER_AGREED → BUYER_PAID → CONTACT_REVEALED
 * عند «موافقة+دفع البائع» تُقطع السلسلة ذرّياً حتى الكشف في معاملة واحدة
 * (خطوة المشتري تلقائية 0 دج حالياً — تُسجَّل للتاريخ)، فتبقى الحالتان
 * الوسيطتان مرئيتين كطوابع زمنية (sellerAgreedAt / buyerPaidAt).
 *
 * الإلغاء ممكن بالكامل قبل كشف التواصل فقط (مبدأ المنتج القابل للإلغاء).
 */
export type MatchFlowStatus =
  | 'SELLER_NOTIFIED'
  | 'SELLER_AGREED'
  | 'BUYER_PAID'
  | 'CONTACT_REVEALED'
  | 'EXPIRED'
  | 'CANCELLED';

const LEGAL_TRANSITIONS: Readonly<Record<MatchFlowStatus, readonly MatchFlowStatus[]>> = {
  SELLER_NOTIFIED: ['SELLER_AGREED', 'EXPIRED', 'CANCELLED'],
  SELLER_AGREED: ['BUYER_PAID', 'CANCELLED'],
  BUYER_PAID: ['CONTACT_REVEALED'],
  CONTACT_REVEALED: [],
  EXPIRED: [],
  CANCELLED: []
} as const;

/** هل الانتقال from → to نظامي؟ (المصدر الوحيد للحقيقة) */
export function canTransition(from: MatchFlowStatus, to: MatchFlowStatus): boolean {
  return LEGAL_TRANSITIONS[from].includes(to);
}

/** الحالات الحسّاسة للمهلة: فقط بانتظار رد البائع تنقضي بمرور 48 ساعة */
export function isAwaitingSeller(status: MatchFlowStatus): boolean {
  return status === 'SELLER_NOTIFIED';
}

/** هل انقضت مهلة رد البائع عند اللحظة الزمنية المعطاة؟ */
export function isOverdue(respondBy: Date, now: Date = new Date()): boolean {
  return respondBy.getTime() <= now.getTime();
}

/** نتيجة فحص أهلية الموافقة (قبل أي كتابة) */
export type AgreeEligibility = 'ok' | 'expired' | 'not_awaiting_seller';

export function checkAgreeEligibility(
  status: MatchFlowStatus,
  respondBy: Date,
  now: Date = new Date()
): AgreeEligibility {
  if (!isAwaitingSeller(status)) return 'not_awaiting_seller';
  if (isOverdue(respondBy, now)) return 'expired';
  return 'ok';
}

/** الإلغاء ممكن فقط قبل كشف التواصل (وطبعاً ليس من حالة نهائية) */
export function isCancellable(status: MatchFlowStatus): boolean {
  return status === 'SELLER_NOTIFIED' || status === 'SELLER_AGREED';
}

/** هل الحالة نهائية (لا تتحرك أبداً بعدها)؟ */
export function isTerminal(status: MatchFlowStatus): boolean {
  return LEGAL_TRANSITIONS[status].length === 0;
}
