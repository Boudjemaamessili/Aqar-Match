/**
 * مرسل رموز OTP — نقطة تكامل مزوّد الرسائل الوحيدة في النظام.
 *
 * - OTP_MOCK=true  → يطبع الرمز في سجل الخادم (وضع التطوير المعتمد).
 * - الإنتاج بلا مزوّد مهيأ → يفشل بإغلاق صريح (لا يرسل وعوداً كاذبة).
 *
 * ★★ نقطة تكامل ما بعد الإطلاق ★★ — التركيب يكون هنا فقط دون مساس
 * ببقية نظام المصادقة. الخيارات الموصى بها للسوق الجزائري:
 *   1) مزوّد SMS (Twilio / Infobip / بوابة محلية):
 *        حسّن OTP إلى تنسيق نصي قصير «رمزك في عقار Match: 123456»
 *        وفعّل التقييم الزمني لمزوّدك (معدل الإرسال محدود أصلاً هنا).
 *   2) WhatsApp Business API (قالب موافق عليه authentication template):
 *        أرخص وصولاً وأعلى قراءةً في الجزائر؛ القالب يجب أن يستوفي
 *        سياسة WhatsApp للرموز (زر نسخ + رمز منتهي الصلاحية).
 * المتغيرات (موثقة في .env.example):
 *   SMS_PROVIDER | SMS_API_KEY | SMS_SENDER_ID | WHATSAPP_ACCESS_TOKEN |
 *   WHATSAPP_PHONE_NUMBER_ID | WHATSAPP_OTP_TEMPLATE
 * اجعل الفشل مغلقاً: أي استثناء من المزوّد = 503 OTP_PROVIDER_NOT_CONFIGURED
 * كما هو معمول أدناه — لا تبتلع الخطأ وتعد المستخدم بإرسال لم يحدث.
 */
import {ApiError} from '@/lib/api/http';

export interface OtpSendResult {
  readonly mock: boolean;
  /** الرمز نفسه — يُعاد للعميل فقط في وضع التطوير المحاكي */
  readonly devCode?: string;
}

export async function sendOtpCode(phone: string, code: string): Promise<OtpSendResult> {
  const isMock = process.env.OTP_MOCK === 'true';

  if (isMock) {
    console.warn(`[OTP_MOCK] رمز التحقق لـ ${phone}: ${code}`);
    return {
      mock: true,
      devCode: process.env.NODE_ENV === 'development' ? code : undefined
    };
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[OTP] OTP_MOCK غير مفعّل خارج الإنتاج — رمز ${phone}: ${code}`);
    return {mock: true, devCode: code};
  }

  // إنتاج بلا مزوّد — فشل مغلق صريح
  throw new ApiError(
    503,
    'OTP_PROVIDER_NOT_CONFIGURED',
    'مزوّد الرسائل القصيرة غير مهيأ بعد'
  );
}
