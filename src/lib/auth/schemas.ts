/**
 * مخططات Zod لطلبات المصادقة — الحدود الخارجية للنظام (validation أول سطر دفاع).
 * تطبيع الهاتف نفسه يتم في phone.ts (مصدر حقيقة واحد).
 */
import {z} from 'zod';
import {OTP_CODE_LENGTH, REGISTERABLE_ROLES} from './constants';

export const requestOtpSchema = z.object({
  phone: z.string().min(6).max(32),
  locale: z.enum(['ar', 'fr']).optional()
});

export const verifyOtpSchema = z.object({
  phone: z.string().min(6).max(32),
  code: z
    .string()
    .trim()
    .regex(new RegExp(`^\\d{${OTP_CODE_LENGTH}}$`), 'code must be digits'),
  // الاسم مطلوب فقط لحساب جديد — يُفحص شرطياً في المسار (rule: لا تغيير اسم لرقم مسجّل)
  name: z.string().trim().min(2).max(80).optional(),
  role: z.enum(REGISTERABLE_ROLES).optional(),
  locale: z.enum(['ar', 'fr']).optional()
});

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
