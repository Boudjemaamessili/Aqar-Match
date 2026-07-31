/**
 * ثوابت رفع الصور — نقية (بدون node) لمشاركتها بين الخادم والواجهة.
 * قواعد صارمة: أنواع محدودة + حجم محدود + إعادة ترميز إجبارية في image.ts.
 */

/** الحد الأقصى لحجم الملف الواحد: 5 ميغابايت */
export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

/** أقصى عدد صور لعقار واحد */
export const MAX_IMAGES_PER_PROPERTY = 10;

/** الأنواع المقبولة (mime ⇠ امتداد الإدخال) — SVG ممنوع عمداً (ناقل XSS) */
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif'
] as const;
export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

/** بادئة المسار العام للملفات المرفوعة */
export const PUBLIC_UPLOADS_PREFIX = '/uploads/';

/**
 * نمط URL الشديد الصرامة لصورة مرفوعة عبر منصتنا:
 * ‎/uploads/<uuid v4 hex>.webp — يمنع أي حقن مسار خارجي في إدخال العقار.
 */
export const UPLOADED_IMAGE_URL_PATTERN =
  /^\/uploads\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/;

/** أبعاد الإخراج القصوى (أطول ضلع) — يُصغَّر ما هو أكبر، ولا تكبير */
export const OUTPUT_MAX_DIMENSION = 1600;

/** جودة WebP للإخراج */
export const OUTPUT_WEBP_QUALITY = 82;
