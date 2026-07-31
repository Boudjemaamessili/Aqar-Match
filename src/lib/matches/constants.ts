/**
 * ثوابت مجال البحث والمطابقة — نقية (client-safe).
 */
import {MAX_PRICE_DZD} from '@/lib/properties/constants';

export {MAX_PRICE_DZD};

/** سقف ميزانية البحث: Decimal(14,0) ⇐ 14 خانة */
export const MAX_BUDGET_DZD = MAX_PRICE_DZD;

/** أقصى أحياء مفضّلة في طلب البحث */
export const MAX_SEARCH_NEIGHBORHOODS = 5;

/** سقف طول الحي الواحد */
export const SEARCH_NEIGHBORHOOD_MAX_LENGTH = 120;

/** عتبات معدل الطلبات */
export const SEARCH_CREATE_RATE_LIMIT = {limit: 10, windowMs: 86_400_000} as const; // في اليوم
export const MATCH_ACTION_RATE_LIMIT = {limit: 60, windowMs: 3_600_000} as const; // في الساعة
export const CONTACT_READ_RATE_LIMIT = {limit: 60, windowMs: 3_600_000} as const;

/// قراءات الصناديق (لكل مستخدم): سخية للاستعمال البشري، مانعة للسحب الآلي (المرحلة 8)
export const MATCHES_READ_RATE_LIMIT = {limit: 30, windowMs: 60_000} as const; // في الدقيقة
export const SEARCH_READ_RATE_LIMIT = {limit: 30, windowMs: 60_000} as const;
export const NOTIFICATIONS_READ_RATE_LIMIT = {limit: 60, windowMs: 60_000} as const; // يُستدعى دورياً من الواجهة
export const NOTIFICATIONS_MARK_RATE_LIMIT = {limit: 20, windowMs: 60_000} as const;

/** أحجام القوائم */
export const SEARCHES_LIST_MAX_ITEMS = 50;
export const MATCHES_INBOX_MAX_ITEMS = 100;
export const NOTIFICATIONS_LIST_MAX_ITEMS = 50;
