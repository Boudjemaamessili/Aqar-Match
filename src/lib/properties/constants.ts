/**
 * ثوابت مجال نشر العقارات — نقية (client-safe).
 * مرايا تعدادات Prisma تُستورد من @prisma/client في طبقة الخادم فقط،
 * أما هنا فقوائم ثابتة للتحقق والواجهة معاً.
 */
import type {DealType} from '@/lib/matching';

/** أنواع حساب الناشر */
export const ACCOUNT_TYPES = ['INDIVIDUAL', 'AGENCY'] as const;
export type AccountTypeInput = (typeof ACCOUNT_TYPES)[number];

/** الوضعيات القانونية المعروفة */
export const LEGAL_STATUSES = [
  'NOTARIZED_DEED',
  'LAND_TITLE',
  'PROMISE_OF_SALE',
  'ALLOCATION_DECISION',
  'PRIVATE_AGREEMENT',
  'IN_REGULARIZATION'
] as const;
export type LegalStatusInput = (typeof LEGAL_STATUSES)[number];

/** حالات العقار (سلامته) المقبولة عند النشر */
export const PROPERTY_CONDITIONS = [
  'NEW',
  'GOOD',
  'RENOVATED',
  'TO_RENOVATE',
  'UNDER_CONSTRUCTION'
] as const;
export type PropertyConditionInput = (typeof PROPERTY_CONDITIONS)[number];

/** جميع أنواع المعاملات */
export const DEAL_TYPES: readonly DealType[] = ['SALE', 'RENT', 'SEASONAL_RENT'];

/** جميع أنواع العقارات */
export const PROPERTY_TYPES = [
  'APARTMENT',
  'HOUSE',
  'VILLA',
  'LAND',
  'COMMERCIAL',
  'OFFICE',
  'STUDIO'
] as const;

/** سقف الاستيراد الجماعي (100 عقار دفعة واحدة — حسب المواصفة) */
export const BULK_IMPORT_MAX_ROWS = 100;

/** سقف السعر المخزَّن: Decimal(14,0) ⇐ 14 خانة */
export const MAX_PRICE_DZD = 99_999_999_999_999;

/** حدود النصوص */
export const TITLE_MIN_LENGTH = 5;
export const TITLE_MAX_LENGTH = 120;
export const DESCRIPTION_MAX_LENGTH = 2000;
export const NEIGHBORHOOD_MAX_LENGTH = 120;
export const OWNER_NAME_MIN_LENGTH = 2;
export const OWNER_NAME_MAX_LENGTH = 80;

/** عتبات معدل الطلبات */
export const PUBLISH_RATE_LIMIT_PER_IP = {limit: 10, windowMs: 3_600_000} as const;
export const PUBLISH_RATE_LIMIT_PER_USER = {limit: 50, windowMs: 86_400_000} as const;
export const BULK_RATE_LIMIT_PER_USER = {limit: 5, windowMs: 3_600_000} as const;
/// المطالبة بالإعلانات المجهولة برقم الهاتف (المرحلة 8) — حسّاسة لذا ضيقة
export const PROPERTY_CLAIM_RATE_LIMIT = {limit: 5, windowMs: 600_000} as const; // كل 10 دقائق

/** سقف القائمة الإدارية (آخر N عقار) */
export const ADMIN_LIST_MAX_ITEMS = 200;
