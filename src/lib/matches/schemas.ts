/**
 * مخططات Zod لطلبات البحث (المشتري) — الأولى من خط الدفاع.
 * قواعد العمل عبر matching.ts نفسه: isPropertyTypeAllowed + الحد المطلق العلني
 * (SECRET_MIN_ABSOLUTE_FLOOR ثابت منصّة علني — استعماله هنا ليس كشف سِرّية).
 * البلدية اختيارية (كل الولاية)، وعند ذكرها يجب انتماؤها لولاتها.
 */
import {z} from 'zod';
import {getCommune, isActiveWilaya} from '@/lib/geo';
import {getSecretMinAbsoluteFloor, isPropertyTypeAllowed, type DealType, type PropertyType} from '@/lib/matching';
import {
  MAX_BUDGET_DZD,
  MAX_SEARCH_NEIGHBORHOODS,
  NOTIFICATIONS_LIST_MAX_ITEMS,
  SEARCH_NEIGHBORHOOD_MAX_LENGTH
} from './constants';

export const searchCreateSchema = z
  .object({
    dealType: z.enum(['SALE', 'RENT', 'SEASONAL_RENT']),
    propertyType: z.enum(['APARTMENT', 'HOUSE', 'VILLA', 'LAND', 'COMMERCIAL', 'OFFICE', 'STUDIO']),
    wilaya: z.number().int(),
    /// حذفها = كامل الولاية (الطبقة المكانية تمنح 70)
    commune: z.number().int().optional(),
    neighborhoods: z
      .array(z.string().trim().min(1).max(SEARCH_NEIGHBORHOOD_MAX_LENGTH))
      .max(MAX_SEARCH_NEIGHBORHOODS)
      .default([]),
    maxBudget: z.number().int().positive().max(MAX_BUDGET_DZD),
    minAreaM2: z.number().positive().max(1_000_000).optional(),
    minRooms: z.number().int().min(0).max(50).optional(),
    minBathrooms: z.number().int().min(0).max(20).optional()
  })
  .strict()
  .superRefine((data, ctx) => {
    if (!isActiveWilaya(data.wilaya)) {
      ctx.addIssue({code: 'custom', message: 'INVALID_WILAYA', path: ['wilaya']});
    } else if (data.commune !== undefined) {
      const commune = getCommune(data.commune);
      if (!commune) {
        ctx.addIssue({code: 'custom', message: 'INVALID_COMMUNE', path: ['commune']});
      } else if (commune.wilayaCode !== data.wilaya) {
        ctx.addIssue({code: 'custom', message: 'COMMUNE_WILAYA_MISMATCH', path: ['commune']});
      }
    }
    const target: {dealType: DealType; propertyType: PropertyType} = data;
    if (!isPropertyTypeAllowed(target.dealType, target.propertyType)) {
      ctx.addIssue({code: 'custom', message: 'TYPE_NOT_ALLOWED', path: ['propertyType']});
    }
    // أرضية علنية: ميزانية دونها يستحيل أن تطابق أي عقار في هذه المعاملة
    if (data.maxBudget < getSecretMinAbsoluteFloor(target.dealType)) {
      ctx.addIssue({code: 'custom', message: 'BUDGET_BELOW_FLOOR', path: ['maxBudget']});
    }
  });

export type SearchCreateInput = z.infer<typeof searchCreateSchema>;

export const cancelMatchSchema = z
  .object({
    reason: z.string().trim().max(200).optional()
  })
  .strict();
export type CancelMatchInput = z.infer<typeof cancelMatchSchema>;

/// معامل استعلام صندوق المطابقات: دور صريح فقط (الافتراضي مشتري)
export const matchesInboxQuerySchema = z
  .object({
    role: z.enum(['buyer', 'seller']).default('buyer')
  })
  .strict();
export type MatchesInboxQuery = z.infer<typeof matchesInboxQuerySchema>;

/// تمييز الإشعارات كمقروءة: معرفات محددة أو حذف الحقل = الكل
export const notificationsMarkReadSchema = z
  .object({
    ids: z.array(z.string().min(1).max(64)).max(NOTIFICATIONS_LIST_MAX_ITEMS).optional()
  })
  .strict();
export type NotificationsMarkReadInput = z.infer<typeof notificationsMarkReadSchema>;
