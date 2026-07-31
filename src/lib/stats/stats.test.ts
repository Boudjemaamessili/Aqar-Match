/**
 * اختبارات نواة إحصائيات المنصة النقية — node:test (tsx --test).
 * المعدلات + متوسط الأيام +حل أعلى ولاية + الاسترشاد الذكي + بناء الحمولة الحية
 * — كلها بلا قاعدة بيانات (الدوال المجمِّعة تُغطى بفحص الدخان الحي).
 */
import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFallbackStats,
  buildRealStats,
  computeAverageMatchDays,
  computeMatchRate,
  ENCRYPTED_FIELDS_COUNT,
  resolveTopWilaya,
  type RealAggregates
} from './core';

const DAY_MS = 86_400_000;

describe('computeMatchRate — معدل التطابق', () => {
  it('يعيد null بلا طلبات بحث (تفادي قسمة صفرية)', () => {
    assert.equal(computeMatchRate(0, 0), null);
  });

  it('يحسب النسبة مقربة لأقرب عدد صحيح', () => {
    assert.equal(computeMatchRate(4, 3), 75);
    assert.equal(computeMatchRate(3, 1), 33);
    assert.equal(computeMatchRate(50, 41), 82);
  });

  it('يقيّد أي تجاوز منطقي (with > total = خطأ بيانات محتمل)', () => {
    assert.equal(computeMatchRate(5, 7), 100);
  });
});

describe('computeAverageMatchDays — متوسط أيام كشف التواصل', () => {
  it('يعيد null بلا عينة', () => {
    assert.equal(computeAverageMatchDays([]), null);
  });

  it('يحسب متوسطاً بعشري واحد', () => {
    const base = new Date('2026-07-01T00:00:00Z');
    const pairs = [
      {createdAt: base, revealedAt: new Date(base.getTime() + 2 * DAY_MS)},
      {createdAt: base, revealedAt: new Date(base.getTime() + 5 * DAY_MS)}
    ];
    assert.equal(computeAverageMatchDays(pairs), 3.5);
  });

  it('يقيّد الفوارق السالبة إلى صفر (بيانات مشوّهة لا تفسد المتوسط)', () => {
    const base = new Date('2026-07-01T00:00:00Z');
    const pairs = [
      {createdAt: base, revealedAt: new Date(base.getTime() - DAY_MS)},
      {createdAt: base, revealedAt: new Date(base.getTime() + DAY_MS)}
    ];
    assert.equal(computeAverageMatchDays(pairs), 0.5);
  });
});

describe('resolveTopWilaya — أعلى ولاية نشاطاً', () => {
  it('يفضّل أساس البحث عند وجوده', () => {
    const top = resolveTopWilaya({code: 16, count: 5}, {code: 31, count: 99});
    assert.equal(top?.code, 16);
    assert.equal(top?.basis, 'searches');
    assert.equal(top?.count, 5);
    assert.equal(top?.nameAr, 'الجزائر');
    assert.equal(top?.nameFr, 'Alger');
  });

  it('يرجع لأساس العرض عند غياب طلبات البحث', () => {
    const top = resolveTopWilaya(null, {code: 31, count: 9});
    assert.equal(top?.basis, 'properties');
    assert.equal(top?.nameAr, 'وهران');
  });

  it('يعيد null بلا أساسين أو لولاية غير معروفة', () => {
    assert.equal(resolveTopWilaya(null, null), null);
    assert.equal(resolveTopWilaya({code: 999, count: 5}, null), null);
  });
});

describe('buildFallbackStats — الاسترشاد الذكي', () => {
  it('متسق داخلياً وموسوم isFallback', () => {
    const stats = buildFallbackStats(new Date('2026-07-30T12:00:00Z'));
    assert.equal(stats.isFallback, true);
    assert.equal(stats.saleCount + stats.rentCount + stats.seasonalRentCount, stats.totalProperties);
    assert.equal(stats.topWilaya?.code, 16);
    assert.equal(stats.topWilaya?.basis, 'searches');
    assert.equal(stats.encryptedFields, ENCRYPTED_FIELDS_COUNT);
    assert.ok(stats.dataPoints >= stats.totalProperties);
    assert.equal(stats.generatedAt, '2026-07-30T12:00:00.000Z');
  });

  it('بلا قيم null في مؤشرات العرض (لا واجهة فارغة في MVP)', () => {
    const stats = buildFallbackStats();
    assert.notEqual(stats.matchRate, null);
    assert.notEqual(stats.averageMatchScore, null);
    assert.notEqual(stats.avgMatchDays, null);
    assert.notEqual(stats.topWilaya, null);
  });
});

describe('buildRealStats — الحمولة الحية', () => {
  const baseAggregates: RealAggregates = {
    totalProperties: 12,
    saleProperties: 7,
    rentProperties: 4,
    seasonalRentProperties: 1,
    totalSearches: 5,
    searchesWithMatches: 4,
    totalMatches: 9,
    averageDisplayedScore: 87.666,
    revealPairs: [
      {
        createdAt: new Date('2026-07-01T00:00:00Z'),
        revealedAt: new Date('2026-07-01T12:00:00Z')
      }
    ],
    topWilayaBySearches: {code: 31, count: 3},
    topWilayaByProperties: {code: 16, count: 6}
  };

  it('يبني حمولة حية صحيحة وموسومة isFallback=false', () => {
    const stats = buildRealStats(baseAggregates, new Date('2026-07-30T00:00:00Z'));
    assert.equal(stats.isFallback, false);
    assert.equal(stats.totalProperties, 12);
    assert.equal(stats.matchRate, 80);
    assert.equal(stats.averageMatchScore, 87.7);
    assert.equal(stats.avgMatchDays, 0.5);
    assert.equal(stats.topWilaya?.basis, 'searches');
    assert.equal(stats.topWilaya?.nameAr, 'وهران');
    assert.equal(stats.dataPoints, 12 + 5 + 9);
    assert.equal(stats.encryptedFields, ENCRYPTED_FIELDS_COUNT);
  });

  it('يمرّر null حيث لا بيانات (بلا أرقام ملفّقة في الوضع الحي)', () => {
    const stats = buildRealStats({
      ...baseAggregates,
      totalSearches: 0,
      searchesWithMatches: 0,
      averageDisplayedScore: null,
      revealPairs: [],
      topWilayaBySearches: null
    });
    assert.equal(stats.matchRate, null);
    assert.equal(stats.averageMatchScore, null);
    assert.equal(stats.avgMatchDays, null);
    // بلا طلبات: أعلى ولاية من أساس العرض (الاحتياط الذكي)
    assert.equal(stats.topWilaya?.basis, 'properties');
  });
});
