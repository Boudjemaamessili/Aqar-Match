/**
 * خدمة تجميع إحصائيات المنصة (server-only — Prisma).
 * النواة الحسابية في core.ts؛ هنا الاستعلامات فقط:
 *   - لا N+1: عدّادات في معاملة قراءة واحدة + تجميعات متوازية.
 *   - ثلاث طبقات مرونة: بيانات حية ⇒ fallback عند قاعدة فارغة ⇒
 *     fallback عند عطل قراءة (السجل العام لا ينكسر بسبب إحصائية).
 */
import {prisma} from '@/lib/prisma';
import {
  buildFallbackStats,
  buildRealStats,
  type PlatformStats,
  type RevealPair
} from './core';

export * from './core';

/** سقف عينة المطابقات المكشوفة لحساب متوسط الأيام (حماية أداء — MVP أصغر بكثير) */
const REVEALED_SAMPLE_MAX = 1_000;

// ─── التجميع من قاعدة البيانات ───────────────────────────────────────────────

/**
 * يحسب إحصائيات المنصة.
 * ثلاث طبقات مرونة: بيانات حية ⇒ fallback عند قاعدة فارغة ⇒ fallback عند عطل قراءة.
 * ملاحظة: groupBy/aggregate تُستدعى مباشرة (لا داخل $transaction) للحفاظ
 * على دقة أنواعها المستدلّة — تُوازى مع حزمة العدّادات عبر Promise.all.
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  try {
    const countsPromise = prisma.$transaction([
      prisma.property.count(),
      prisma.property.count({where: {transactionType: 'SALE'}}),
      prisma.property.count({where: {transactionType: 'RENT'}}),
      prisma.property.count({where: {transactionType: 'SEASONAL_RENT'}}),
      prisma.searchRequest.count(),
      // طلبات لها مطابقة واحدة على الأقل — فلتر علاقي (بلا سحب صفوف)
      prisma.searchRequest.count({where: {matches: {some: {}}}}),
      prisma.match.count()
    ]);
    const [counts, scoreAggregate, revealRows, topSearchGroups, topPropertyGroups] =
      await Promise.all([
        countsPromise,
        prisma.match.aggregate({_avg: {displayedScore: true}}),
        prisma.match.findMany({
          where: {revealedAt: {not: null}},
          select: {createdAt: true, revealedAt: true},
          take: REVEALED_SAMPLE_MAX
        }),
        prisma.searchRequest.groupBy({
          by: ['wilayaCode'],
          _count: {wilayaCode: true},
          orderBy: {_count: {wilayaCode: 'desc'}},
          take: 1
        }),
        prisma.property.groupBy({
          by: ['wilayaCode'],
          _count: {wilayaCode: true},
          orderBy: {_count: {wilayaCode: 'desc'}},
          take: 1
        })
      ]);
    const [
      totalProperties,
      saleProperties,
      rentProperties,
      seasonalRentProperties,
      totalSearches,
      searchesWithMatches,
      totalMatches
    ] = counts;

    // منصة بلا عقار واحد = مرحلة ما قبل الإقلاع ⇒ الاسترشاد الذكي
    if (totalProperties === 0) {
      return buildFallbackStats();
    }

    // الفلتر where لا يضيّق النوع — نتحقق صراحة (الصف المكشوف revealedAt≠null حتماً)
    const revealPairs = revealRows.filter((r): r is RevealPair => r.revealedAt !== null);
    const topSearch = topSearchGroups[0];
    const topProperty = topPropertyGroups[0];
    return buildRealStats({
      totalProperties,
      saleProperties,
      rentProperties,
      seasonalRentProperties,
      totalSearches,
      searchesWithMatches,
      totalMatches,
      averageDisplayedScore: scoreAggregate._avg.displayedScore,
      revealPairs,
      topWilayaBySearches: topSearch
        ? {code: topSearch.wilayaCode, count: topSearch._count.wilayaCode}
        : null,
      topWilayaByProperties: topProperty
        ? {code: topProperty.wilayaCode, count: topProperty._count.wilayaCode}
        : null
    });
  } catch (error: unknown) {
    // السجل العام لا يجب أن ينكسر أبداً بسبب إحصائية (قاعدة منقطعة، هجرة ناقصة…)
    console.error('[stats] تعذّر حساب الإحصائيات — رجوع للوضع الاسترشادي:', error);
    return buildFallbackStats();
  }
}
