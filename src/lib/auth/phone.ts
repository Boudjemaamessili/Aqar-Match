/**
 * تطبيع أرقام الهاتف الجزائرية — طبقة نقية (testable).
 *
 * القاعدة: المعرف الوحيد هو رقم موبايل جزائري بالصيغة الدولية
 * ‎+213XXXXXXXXX (9 أرقام تبدأ بـ 5/6/7). الخطوط الثابتة مرفوضة —
 * رمز OTP يحتاج رقماً نقّالاً فعلياً.
 */

export type PhoneRejectReason =
  | 'empty'
  | 'invalid_chars'
  | 'invalid_length'
  | 'not_mobile';

export type PhoneNormalizeResult =
  | {readonly ok: true; readonly phone: string}
  | {readonly ok: false; readonly reason: PhoneRejectReason};

const MOBILE_FIRST_DIGIT = /^[567]/;

export function normalizeDzPhone(input: string): PhoneNormalizeResult {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return {ok: false, reason: 'empty'};
  }

  // إزالة الفواصل الشائعة: مسافات، نقاط، شرطات، أقواس
  let digits = trimmed.replace(/[\s().-]/g, '');

  // 00213… ← +213…
  if (digits.startsWith('00')) {
    digits = `+${digits.slice(2)}`;
  }
  if (digits.startsWith('+')) {
    digits = digits.slice(1);
  }
  if (!/^\d+$/.test(digits)) {
    return {ok: false, reason: 'invalid_chars'};
  }

  // إلى صميم مكوَّن من 9 أرقام:
  //   213XXXXXXXXX (12) ← إقليمي دولي
  //   0XXXXXXXXX   (10) ← محلي بصفر
  //   XXXXXXXXX    (9)  ← محلي بلا صفر
  if (digits.startsWith('213')) {
    digits = digits.slice(3);
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  if (digits.length !== 9) {
    return {ok: false, reason: 'invalid_length'};
  }
  if (!MOBILE_FIRST_DIGIT.test(digits)) {
    return {ok: false, reason: 'not_mobile'};
  }
  return {ok: true, phone: `+213${digits}`};
}

/** عرض منسّق: +213612345678 ← ‎+213 612 34 56 78 */
export function formatDzPhone(phone: string): string {
  const normalized = normalizeDzPhone(phone);
  if (!normalized.ok) return phone;
  const body = normalized.phone.slice(4); // 9 أرقام
  return `+213 ${body.slice(0, 3)} ${body.slice(3, 5)} ${body.slice(5, 7)} ${body.slice(7, 9)}`;
}

/** إخفاء الرقم للعرض العام/السجلات: ‎+213 6•• •• •• 78 */
export function maskDzPhone(phone: string): string {
  const normalized = normalizeDzPhone(phone);
  if (!normalized.ok) return '•••';
  const body = normalized.phone.slice(4);
  return `+213 ${body.slice(0, 1)}•• •• •• ${body.slice(7)}`;
}
