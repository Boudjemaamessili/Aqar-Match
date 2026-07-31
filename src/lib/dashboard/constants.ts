/**
 * ثوابت لوحة التحكم — نقية (client-safe).
 */

/** سقوف عناصر أقسام اللوحة (تكفي سنوات من الاستعمال الفعلي) */
export const DASHBOARD_PROPERTIES_MAX_ITEMS = 60;
export const DASHBOARD_SEARCHES_MAX_ITEMS = 50;
export const DASHBOARD_MATCHES_MAX_ITEMS = 60;

/**
 * محدد معدل قراءة اللوحة لكل IP (دفاع إضافي ضد تعداد الأرقام —
 * التفويض الحقيقي يبقى كون الجلسة تطابق الرقم — قرار المالك المعتمد)
 */
export const DASHBOARD_READ_RATE_LIMIT = {limit: 30, windowMs: 600_000} as const; // كل 10 دقائق
