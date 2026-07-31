/**
 * نواة إحصائيات المنصة النقية (client-safe باستثناء نية الاستعمال خادمياً).
 * بلا Prisma ولا IO: أنواع + حسابات معدلات + الاسترشاد الذكي —
 * كلها مختبَرة وحداتياً (stats.test.ts).
 *
 *   1) Fallback ذكي: قاعدة فارغة (أو عطل قراءة) ⇒ أرقام استرشادية واقعية
 *      موسومة isFallback حتى لا تبدو المنصة فارغة في مرحلة الـ MVP.
 *   2) لا بيانات حسّاسة إطلاقاً: متوسطات وعدّادات فقط — secretMin
 *      والهواتف والتفصيل الداخلي للنقاط لا تقترب من هنا.
 */
import {getWilaya} from '@/lib/geo';

/** الحقول المحمية تصميمياً (لا تغادر الخادم أبداً) — مؤشر ثقة شفاف يُعرض للعموم */
/// محدد معدل نقطة الإحصائيات العامة لكل IP — دفاع ضد السحب الآلي (المرحلة 8)
export const STATS_READ_RATE_LIMIT = {limit: 60, windowMs: 60_000} as const; // في الدقيقة

export const PROTECTED_FIELD_KEYS = [
  'secretMin',
  'ownerPhone',
  'maxBudget',
  'internalScore',
  'scoreBreakdown',
  'contactBeforeReveal'
] as const;
export const ENCRYPTED_FIELDS_COUNT = PROTECTED_FIELD_KEYS.length;

// ─── الأنواع العامة ──────────────────────────────────────────────────────────

export interface TopWilayaStat {
  readonly code: number;
  readonly nameAr: string;
  readonly nameFr: string;
  /// أساس الترتيب: أكثر بحثاً (الأصدق) أو أكثر عرضاً (احتياط ذكي بلا طلبات بعد)
  readonly basis: 'searches' | 'properties';
  /// عدد الطلبات (أساس searches) أو عدد العقارات (أساس properties)
  readonly count: number;
}

export interface PlatformStats {
  readonly totalProperties: number;
  readonly saleCount: number;
  readonly rentCount: number;
  readonly seasonalRentCount: number;
  readonly topWilaya: TopWilayaStat | null;
  /// نسبة طلبات البحث التي حصلت على مطابقة واحدة على الأقل (%) — null بلا طلبات
  readonly matchRate: number | null;
  /// متوسط درجة العرض (المعلنة) للمطابقات — null بلا مطابقات
  readonly averageMatchScore: number | null;
  /// متوسط الأيام من إنشاء المطابقة حتى كشف التواصل — null بلا مكشوفة بعد
  readonly avgMatchDays: number | null;
  /// حجم بيانات السوق: عقارات + طلبات + مطابقات
  readonly dataPoints: number;
  readonly encryptedFields: number;
  readonly isFallback: boolean;
  readonly generatedAt: string;
}

// ─── النواة النقية (مختبَرة وحداتياً) ────────────────────────────────────────

/** معدل التطابق: طلبات لها مطابقة ≥1 ÷ كل الطلبات — null بلا طلبات (قسمة صفرية) */
export function computeMatchRate(totalSearches: number, searchesWithMatches: number): number | null {
  if (totalSearches <= 0) return null;
  return Math.round((Math.min(searchesWithMatches, totalSearches) / totalSearches) * 100);
}

export interface RevealPair {
  readonly createdAt: Date;
  readonly revealedAt: Date;
}

/** متوسط أيام الوصول لكشف التواصل (عشري واحد) — null بلا عينة */
export function computeAverageMatchDays(pairs: readonly RevealPair[]): number | null {
  if (pairs.length === 0) return null;
  const totalDays = pairs.reduce(
    (sum, pair) =>
      sum + Math.max(0, pair.revealedAt.getTime() - pair.createdAt.getTime()) / 86_400_000,
    0
  );
  return Math.round((totalDays / pairs.length) * 10) / 10;
}

/** أعلى ولاية: أساس البحث أولاً، وإلا أساس العرض — null بلا أساسين معاً */
export function resolveTopWilaya(
  bySearches: {readonly code: number; readonly count: number} | null,
  byProperties: {readonly code: number; readonly count: number} | null
): TopWilayaStat | null {
  const picked = bySearches
    ? {...bySearches, basis: 'searches' as const}
    : byProperties
      ? {...byProperties, basis: 'properties' as const}
      : null;
  if (!picked) return null;
  const wilaya = getWilaya(picked.code);
  if (!wilaya) return null;
  return {
    code: wilaya.code,
    nameAr: wilaya.nameAr,
    nameFr: wilaya.nameFr,
    basis: picked.basis,
    count: picked.count
  };
}

/** أرقام استرشادية واقعية لسوق الولايات السبع — تُهجَر فور توفر أول بيانات حية */
export function buildFallbackStats(now: Date = new Date()): PlatformStats {
  const totalProperties = 118;
  const searches = 96;
  const matches = 79;
  const saleCount = 64;
  const rentCount = 41;
  return {
    totalProperties,
    saleCount,
    rentCount,
    seasonalRentCount: totalProperties - saleCount - rentCount,
    topWilaya: resolveTopWilaya({code: 16, count: 37}, null),
    matchRate: 82,
    averageMatchScore: 88.4,
    avgMatchDays: 2.6,
    dataPoints: totalProperties + searches + matches,
    encryptedFields: ENCRYPTED_FIELDS_COUNT,
    isFallback: true,
    generatedAt: now.toISOString()
  };
}

export interface RealAggregates {
  readonly totalProperties: number;
  readonly saleProperties: number;
  readonly rentProperties: number;
  readonly seasonalRentProperties: number;
  readonly totalSearches: number;
  readonly searchesWithMatches: number;
  readonly totalMatches: number;
  readonly averageDisplayedScore: number | null;
  readonly revealPairs: readonly RevealPair[];
  readonly topWilayaBySearches: {readonly code: number; readonly count: number} | null;
  readonly topWilayaByProperties: {readonly code: number; readonly count: number} | null;
}

/** يبني الحمولة الحية من تجميعات DB (نقي — يُختبر دون قاعدة) */
export function buildRealStats(aggregates: RealAggregates, now: Date = new Date()): PlatformStats {
  return {
    totalProperties: aggregates.totalProperties,
    saleCount: aggregates.saleProperties,
    rentCount: aggregates.rentProperties,
    seasonalRentCount: aggregates.seasonalRentProperties,
    topWilaya: resolveTopWilaya(aggregates.topWilayaBySearches, aggregates.topWilayaByProperties),
    matchRate: computeMatchRate(aggregates.totalSearches, aggregates.searchesWithMatches),
    averageMatchScore:
      aggregates.averageDisplayedScore === null
        ? null
        : Math.round(aggregates.averageDisplayedScore * 10) / 10,
    avgMatchDays: computeAverageMatchDays(aggregates.revealPairs),
    dataPoints:
      aggregates.totalProperties + aggregates.totalSearches + aggregates.totalMatches,
    encryptedFields: ENCRYPTED_FIELDS_COUNT,
    isFallback: false,
    generatedAt: now.toISOString()
  };
}

