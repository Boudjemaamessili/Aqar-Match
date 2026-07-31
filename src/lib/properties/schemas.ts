/**
 * مخططات Zod لنشر العقارات — أول سطر دفاع في الـ API.
 *
 * المصطلحات: أسماء الحقول مطابقة لعقد المرحلة 4 حرفياً
 * (dealType / price / floors…) وتُترجَم لأعمدة Prisma في طبقة الخدمة.
 *
 * قواعد العمل المشتركة تُفرض هنا عبر دوال matching.ts نفسها (بلا تكرار منطق):
 *   - isPropertyTypeAllowed          → TYPE_NOT_ALLOWED
 *   - isValidSecretMin (الحد المطلق) → SECRET_MIN_BELOW_FLOOR
 *   - isValidPricePair               → PRICE_BELOW_SECRET_MIN
 * وجود الولاية/البلدية وانتماء البلدية لولايتها → COMMUNE_WILAYA_MISMATCH.
 * رسائل الأخطاء = رموز ثابتة تترجمها الواجهة (publish.errors.*).
 */
import {z} from 'zod';
import {getCommune, isActiveWilaya} from '@/lib/geo';
import {
  isPropertyTypeAllowed,
  isValidPricePair,
  isValidSecretMin,
  type DealType,
  type PropertyType
} from '@/lib/matching';
import {
  ACCOUNT_TYPES,
  BULK_IMPORT_MAX_ROWS,
  DESCRIPTION_MAX_LENGTH,
  LEGAL_STATUSES,
  MAX_PRICE_DZD,
  NEIGHBORHOOD_MAX_LENGTH,
  OWNER_NAME_MAX_LENGTH,
  OWNER_NAME_MIN_LENGTH,
  PROPERTY_CONDITIONS,
  TITLE_MAX_LENGTH,
  TITLE_MIN_LENGTH
} from './constants';
import {
  MAX_IMAGES_PER_PROPERTY,
  UPLOAD_MAX_BYTES,
  UPLOADED_IMAGE_URL_PATTERN
} from '@/lib/uploads/constants';

const optionalPhone = z.string().trim().min(9).max(32);

/** صورة مرفوعة سلفاً عبر /api/uploads — النمط الصارم يمنع حقن أي مسار */
export const imageInputSchema = z
  .object({
    url: z.string().regex(UPLOADED_IMAGE_URL_PATTERN, 'INVALID_IMAGE_URL'),
    mimeType: z.literal('image/webp'),
    width: z.number().int().min(1).max(20_000),
    height: z.number().int().min(1).max(20_000),
    sizeBytes: z.number().int().min(1).max(UPLOAD_MAX_BYTES)
  })
  .strict();
export type ImageInput = z.infer<typeof imageInputSchema>;

/** مزايا الإيجار الموسمي المهيكلة — الوحيدة المسموح تخزينها في العمود JSON */
export const seasonalFeaturesSchema = z
  .object({
    capacity: z.number().int().min(1).max(50),
    distanceToBeachM: z.number().int().min(0).max(300_000).optional(),
    airConditioning: z.boolean().optional(),
    pool: z.boolean().optional(),
    seaView: z.boolean().optional(),
    wifi: z.boolean().optional()
  })
  .strict();
export type SeasonalFeaturesInput = z.infer<typeof seasonalFeaturesSchema>;

// ─── الجسم المشترك بين النشر الفردي وصفوف الاستيراد ──────────────────────────

const propertyCoreObject = z.object({
  dealType: z.enum(['SALE', 'RENT', 'SEASONAL_RENT']),
  propertyType: z.enum(['APARTMENT', 'HOUSE', 'VILLA', 'LAND', 'COMMERCIAL', 'OFFICE', 'STUDIO']),
  /// رقم الولاية الرسمي (16, 09…)
  wilaya: z.number().int(),
  /// المعرف الرسمي العام للبلدية (انظر geo/communes.ts)
  commune: z.number().int(),
  neighborhood: z.string().trim().min(1).max(NEIGHBORHOOD_MAX_LENGTH).optional(),
  title: z.string().trim().min(TITLE_MIN_LENGTH).max(TITLE_MAX_LENGTH),
  description: z.string().trim().max(DESCRIPTION_MAX_LENGTH).optional(),
  area: z.number().positive().max(1_000_000).optional(),
  rooms: z.number().int().min(0).max(50).optional(),
  floor: z.number().int().min(-2).max(100).optional(),
  /// عدد طوابق المبنى (اسم العقد «floors» ⇐ العمود totalFloors)
  floors: z.number().int().min(0).max(100).optional(),
  bathrooms: z.number().int().min(0).max(20).optional(),
  facades: z.number().int().min(1).max(4).optional(),
  legalStatus: z.enum(LEGAL_STATUSES).optional(),
  condition: z.enum(PROPERTY_CONDITIONS).optional(),
  furnished: z.boolean().optional(),
  hasParking: z.boolean().optional(),
  hasElevator: z.boolean().optional(),
  hasGarden: z.boolean().optional(),
  seasonalFeatures: seasonalFeaturesSchema.optional(),
  /// السعر المطلوب العلني (دج)
  price: z.number().int().positive().max(MAX_PRICE_DZD),
  /// الحد الأدنى السري (دج) — يُستهلك خادمياً فقط ولا يُعاد أبداً
  secretMin: z.number().int().positive().max(MAX_PRICE_DZD),
  images: z.array(imageInputSchema).max(MAX_IMAGES_PER_PROPERTY, 'TOO_MANY_IMAGES').default([])
});

interface CoreRefineTarget {
  dealType: DealType;
  propertyType: PropertyType;
  wilaya: number;
  commune: number;
  price: number;
  secretMin: number;
}

/** قواعد العمل المشتركة — مصدرها matching.ts والجغرافيا الرسمية */
function refineCore(data: CoreRefineTarget, ctx: z.RefinementCtx): void {
  if (!isActiveWilaya(data.wilaya)) {
    ctx.addIssue({code: 'custom', message: 'INVALID_WILAYA', path: ['wilaya']});
  } else {
    const commune = getCommune(data.commune);
    if (!commune) {
      ctx.addIssue({code: 'custom', message: 'INVALID_COMMUNE', path: ['commune']});
    } else if (commune.wilayaCode !== data.wilaya) {
      ctx.addIssue({code: 'custom', message: 'COMMUNE_WILAYA_MISMATCH', path: ['commune']});
    }
  }
  if (!isPropertyTypeAllowed(data.dealType, data.propertyType)) {
    ctx.addIssue({code: 'custom', message: 'TYPE_NOT_ALLOWED', path: ['propertyType']});
  }
  if (!isValidSecretMin(data.dealType, data.secretMin)) {
    ctx.addIssue({
      code: 'custom',
      message: 'SECRET_MIN_BELOW_FLOOR',
      path: ['secretMin'],
      params: {floor: true}
    });
  }
  if (!isValidPricePair(data.price, data.secretMin)) {
    ctx.addIssue({code: 'custom', message: 'PRICE_BELOW_SECRET_MIN', path: ['price']});
  }
}

/** جسم العقار المشترك (نشر فردي ⇐ كامل · استيراد جماعي ⇐ صف بعد التطبيع) */
export const propertyCoreSchema = propertyCoreObject.superRefine(refineCore);
export type PropertyCoreInput = z.infer<typeof propertyCoreSchema>;

/** جسم النشر الفردي الكامل: جوهر العقار + بيانات المالك + نوع الحساب */
export const propertyCreateSchema = propertyCoreObject
  .extend({
    accountType: z.enum(ACCOUNT_TYPES),
    ownerName: z.string().trim().min(OWNER_NAME_MIN_LENGTH).max(OWNER_NAME_MAX_LENGTH),
    ownerPhone: z.string().trim().min(9).max(32),
    /// هاتف حساب موجود لربط الإعلان به (بدونه: نشر مجهول UNMONITORED)
    userPhone: optionalPhone.optional()
  })
  .strict()
  .superRefine(refineCore);
export type PropertyCreateInput = z.infer<typeof propertyCreateSchema>;

// ─── الاستيراد الجماعي — صفوف متساهلة الشكل تُطبَّع قبل التحقق الصارم ────────

const looseNumber = z.union([z.number(), z.string()]);
const looseRequiredText = z.union([z.number(), z.string()]);

/** صف خام (قادم من لصق CSV/Sheets) — الأرقام قد تصل نصاً */
export const bulkRawRowSchema = z.object({
  dealType: z.string().min(1),
  propertyType: z.string().min(1),
  wilaya: looseRequiredText,
  commune: looseRequiredText,
  neighborhood: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  area: looseNumber.optional(),
  rooms: looseNumber.optional(),
  floor: looseNumber.optional(),
  floors: looseNumber.optional(),
  bathrooms: looseNumber.optional(),
  facades: looseNumber.optional(),
  legalStatus: z.string().optional(),
  condition: z.string().optional(),
  price: looseRequiredText,
  secretMin: looseRequiredText,
  images: z.array(imageInputSchema).max(MAX_IMAGES_PER_PROPERTY, 'TOO_MANY_IMAGES').default([])
});
export type BulkRawRow = z.infer<typeof bulkRawRowSchema>;

/** جسم طلب الاستيراد — ≤ 100 صف حسب المواصفة */
export const bulkImportSchema = z.object({
  rows: z.array(bulkRawRowSchema).min(1, 'BULK_EMPTY').max(BULK_IMPORT_MAX_ROWS, 'BULK_TOO_MANY'),
  ownerName: z.string().trim().min(OWNER_NAME_MIN_LENGTH).max(OWNER_NAME_MAX_LENGTH).optional(),
  ownerPhone: optionalPhone.optional(),
  accountType: z.enum(ACCOUNT_TYPES).optional()
});
export type BulkImportInput = z.infer<typeof bulkImportSchema>;
