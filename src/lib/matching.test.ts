/**
 * اختبارات منطقية لمحرك المطابقة — node:test (tsx --test)
 * تغطي: الثوابت، الرسوم، الطبقات الأربع، الدرجتين، والمطابقة الكاملة.
 */
import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import {
  calcBuyerFee,
  calculateFinalScore,
  calcDisplayedScore,
  calcSellerFee,
  computeDataCompleteness,
  computeRespondBy,
  DEFAULT_WEIGHTS,
  getSecretMinAbsoluteFloor,
  isPropertyTypeAllowed,
  isValidPricePair,
  isValidSecretMin,
  MATCH_MAX_RESULTS,
  MIN_DISPLAY_SCORE,
  NEGOTIATION_BUFFER_PERCENT,
  normalizeNeighborhood,
  normalizeWeights,
  passesHardFilters,
  RESPONSE_DEADLINE_HOURS,
  runMatching,
  SALE_FEE_TIERS,
  scoreFeatures,
  scoreLocation,
  scorePrice,
  SECRET_MIN_ABSOLUTE_FLOOR,
  type MatchableProperty,
  type SearchQuery
} from './matching';

// ─── أدوات بناء تركيبات (fixtures) ───────────────────────────────────────────

let idCounter = 0;

function makeProperty(overrides: Partial<MatchableProperty> = {}): MatchableProperty {
  idCounter += 1;
  return {
    id: `prop-${idCounter}`,
    dealType: 'SALE',
    propertyType: 'APARTMENT',
    status: 'active',
    wilayaCode: 16,
    communeId: 589, // Hydra
    neighborhood: 'Hydra',
    askingPrice: 25_000_000,
    secretMin: 22_000_000,
    areaM2: 120,
    rooms: 4,
    bathrooms: 2,
    floor: 3,
    totalFloors: 8,
    furnished: false,
    hasParking: true,
    hasElevator: true,
    hasGarden: false,
    description: 'شقة راقية في حيدرة بالقرب من كل المرافق والمدارس',
    imagesCount: 5,
    ...overrides
  };
}

function makeSearch(overrides: Partial<SearchQuery> = {}): SearchQuery {
  return {
    dealType: 'SALE',
    propertyType: 'APARTMENT',
    wilayaCode: 16,
    communeId: 589,
    neighborhoods: ['hydra'],
    maxBudget: 25_000_000,
    minAreaM2: 100,
    minRooms: 3,
    minBathrooms: 2,
    ...overrides
  };
}

// ─── الثوابت والتحقق ──────────────────────────────────────────────────────────

describe('الثوابت والتحقق', () => {
  it('قيم الثوابت الأساسية مطابقة للمواصفة', () => {
    assert.equal(RESPONSE_DEADLINE_HOURS, 48);
    assert.equal(NEGOTIATION_BUFFER_PERCENT, 10);
    assert.equal(MIN_DISPLAY_SCORE, 65);
    assert.equal(MATCH_MAX_RESULTS, 10);
    assert.deepEqual(DEFAULT_WEIGHTS, {priceWeight: 40, locationWeight: 40, featuresWeight: 20});
    assert.deepEqual(SECRET_MIN_ABSOLUTE_FLOOR, {SALE: 2_000_000, RENT: 20_000, SEASONAL_RENT: 50_000});
  });

  it('getSecretMinAbsoluteFloor حسب نوع المعاملة', () => {
    assert.equal(getSecretMinAbsoluteFloor('SALE'), 2_000_000);
    assert.equal(getSecretMinAbsoluteFloor('RENT'), 20_000);
    assert.equal(getSecretMinAbsoluteFloor('SEASONAL_RENT'), 50_000);
  });

  it('isValidSecretMin و isValidPricePair', () => {
    assert.equal(isValidSecretMin('SALE', 2_000_000), true);
    assert.equal(isValidSecretMin('SALE', 1_999_999), false);
    assert.equal(isValidSecretMin('RENT', 19_999), false);
    assert.equal(isValidSecretMin('SALE', Number.NaN), false);
    assert.equal(isValidPricePair(25_000_000, 22_000_000), true);
    assert.equal(isValidPricePair(21_000_000, 22_000_000), false);
  });

  it('isPropertyTypeAllowed: الأرض للإيجار غير مسموحة', () => {
    assert.equal(isPropertyTypeAllowed('SALE', 'LAND'), true);
    assert.equal(isPropertyTypeAllowed('RENT', 'LAND'), false);
    assert.equal(isPropertyTypeAllowed('SEASONAL_RENT', 'COMMERCIAL'), false);
    assert.equal(isPropertyTypeAllowed('SEASONAL_RENT', 'APARTMENT'), true);
    assert.equal(isPropertyTypeAllowed('RENT', 'OFFICE'), true);
  });

  it('computeRespondBy يضيف 48 ساعة بالضبط', () => {
    const base = new Date('2026-07-29T12:00:00.000Z');
    assert.equal(computeRespondBy(base).toISOString(), '2026-07-31T12:00:00.000Z');
  });
});

// ─── الرسوم ──────────────────────────────────────────────────────────────────

describe('الرسوم', () => {
  it('شرائح البيع عند الحدود بالضبط (inclusive)', () => {
    for (const tier of SALE_FEE_TIERS) {
      assert.equal(calcSellerFee('SALE', tier.maxSecretMin), tier.fee, `عند ${tier.maxSecretMin}`);
    }
  });

  it('شرائح البيع: وحدة واحدة فوق الحد تنتقل للشريحة التالية', () => {
    assert.equal(calcSellerFee('SALE', 5_000_000), 10_000);
    assert.equal(calcSellerFee('SALE', 5_000_001), 15_000);
    assert.equal(calcSellerFee('SALE', 20_000_001), 40_000);
  });

  it('فوق 120M: قاعدة 100.000 + 5.000 لكل 10M إضافية (تقريب للأعلى)', () => {
    assert.equal(calcSellerFee('SALE', 130_000_000), 105_000);
    assert.equal(calcSellerFee('SALE', 120_000_001), 105_000);
    assert.equal(calcSellerFee('SALE', 200_000_000), 140_000);
  });

  it('الإيجار والموسمي: نصف قيمة secretMin', () => {
    assert.equal(calcSellerFee('RENT', 100_000), 50_000);
    assert.equal(calcSellerFee('SEASONAL_RENT', 50_000), 25_000);
    assert.equal(calcSellerFee('RENT', 55_555), 27_778); // تقريب
  });

  it('قيم غير صالحة ⇒ صفر رسوم', () => {
    assert.equal(calcSellerFee('SALE', -5), 0);
    assert.equal(calcSellerFee('SALE', Number.NaN), 0);
  });

  it('رسوم المشتري صفر دائماً', () => {
    assert.equal(calcBuyerFee(), 0);
  });
});

// ─── تطبيع الحي والأوزان ─────────────────────────────────────────────────────

describe('التطبيع', () => {
  it('normalizeNeighborhood: عربي وفرنسي', () => {
    assert.equal(normalizeNeighborhood('  Hydra  '), 'hydra');
    assert.equal(normalizeNeighborhood('حيّ الـقـُـصور'), 'حي القصور');
    assert.equal(normalizeNeighborhood('حي إدريس'), 'حي ادريس');
    assert.equal(normalizeNeighborhood('بن عكنون'), 'بن عكنون');
    assert.equal(normalizeNeighborhood('Bab-Ezzouar'), 'bab ezzouar');
  });

  it('normalizeWeights: يكمل ويعيد القياس لمجموع 100', () => {
    assert.deepEqual(normalizeWeights(), DEFAULT_WEIGHTS);
    assert.deepEqual(normalizeWeights({}), DEFAULT_WEIGHTS);
    const w = normalizeWeights({priceWeight: 60, locationWeight: 60, featuresWeight: 60});
    assert.ok(Math.abs(w.priceWeight + w.locationWeight + w.featuresWeight - 100) < 1e-9);
    assert.ok(Math.abs(w.priceWeight - 100 / 3) < 1e-9);
    // أوزان صفرية كلها ⇒ افتراضية
    assert.deepEqual(normalizeWeights({priceWeight: 0, locationWeight: 0, featuresWeight: 0}), DEFAULT_WEIGHTS);
    // جزئية: يُحترم الجزء المدخل ويُكمل بالافتراضي
    const partial = normalizeWeights({priceWeight: 50});
    assert.equal(partial.priceWeight, (50 / (50 + 40 + 20)) * 100);
  });
});

// ─── الطبقة 1: الفلاتر الصارمة ────────────────────────────────────────────────

describe('الطبقة 1 — Hard Filters', () => {
  const search = makeSearch();

  it('يطابق عند التطابق الكامل', () => {
    assert.equal(passesHardFilters(makeProperty(), search), true);
  });

  it('يرفض اختلاف نوع المعاملة', () => {
    assert.equal(passesHardFilters(makeProperty({dealType: 'RENT'}), search), false);
  });

  it('يرفض اختلاف نوع العقار', () => {
    assert.equal(passesHardFilters(makeProperty({propertyType: 'VILLA'}), search), false);
  });

  it('يرفض اختلاف الولاية', () => {
    assert.equal(passesHardFilters(makeProperty({wilayaCode: 31}), search), false);
  });

  it('الحالة يجب أن تكون ضمن القائمة المؤهلة فقط', () => {
    for (const status of ['active', 'matched', 'unmonitored'] as const) {
      assert.equal(passesHardFilters(makeProperty({status}), search), true, status);
    }
    assert.equal(
      passesHardFilters(makeProperty({status: 'paused' as unknown as 'active'}), search),
      false
    );
  });
});

// ─── الطبقة 2: المكاني ──────────────────────────────────────────────────────

describe('الطبقة 2 — Spatial Fuzzy Logic', () => {
  it('نفس البلدية + نفس الحي ⇒ 100', () => {
    const r = scoreLocation(makeProperty({neighborhood: '  HYDRA '}), makeSearch({neighborhoods: ['حيدرة', 'hydra']}));
    assert.equal(r.score, 100);
    assert.equal(r.detail, 'same_neighborhood');
  });

  it('نفس البلدية بلا تفضيل حي ⇒ 90', () => {
    const r = scoreLocation(makeProperty({neighborhood: 'Val d\u2019Hydra'}), makeSearch({neighborhoods: []}));
    assert.equal(r.score, 90);
    assert.equal(r.detail, 'same_commune');
  });

  it('نفس البلدية وحي مختلف ⇒ 85', () => {
    const r = scoreLocation(makeProperty({neighborhood: 'Paradou'}), makeSearch({neighborhoods: ['hydra']}));
    assert.equal(r.score, 85);
  });

  it('نفس البلدية وحي العقار مجهول مع تفضيل ⇒ 85', () => {
    const r = scoreLocation(makeProperty({neighborhood: null}), makeSearch({neighborhoods: ['hydra']}));
    assert.equal(r.score, 85);
  });

  it('بلدية أخرى بنفس الولاية ⇒ 70', () => {
    const r = scoreLocation(makeProperty({communeId: 571}), makeSearch());
    assert.equal(r.score, 70);
    assert.equal(r.detail, 'same_wilaya');
  });
});

// ─── الطبقة 3: السعر الأعمى ─────────────────────────────────────────────────

describe('الطبقة 3 — Blind Price', () => {
  const SECRET = 20_000_000;

  it('ميزانية ≥ 120٪ من السرّي ⇒ 100', () => {
    assert.equal(scorePrice(makeProperty({secretMin: SECRET}), makeSearch({maxBudget: 24_000_000})).score, 100);
    assert.equal(scorePrice(makeProperty({secretMin: SECRET}), makeSearch({maxBudget: 30_000_000})).score, 100);
  });

  it('ميزانية = السرّي ⇒ 80', () => {
    const r = scorePrice(makeProperty({secretMin: SECRET}), makeSearch({maxBudget: SECRET}));
    assert.equal(r.score, 80);
    assert.equal(r.detail, 'meets_secret_min');
  });

  it('ميزانية = 110٪ ⇒ 90 (خطي)', () => {
    assert.equal(scorePrice(makeProperty({secretMin: SECRET}), makeSearch({maxBudget: 22_000_000})).score, 90);
  });

  it('عجز 5٪ ⇒ 70 · عجز 10٪ ⇒ 60 (داخل هامش التفاوض)', () => {
    assert.equal(scorePrice(makeProperty({secretMin: SECRET}), makeSearch({maxBudget: 19_000_000})).score, 70);
    const edge = scorePrice(makeProperty({secretMin: SECRET}), makeSearch({maxBudget: 18_000_000}));
    assert.equal(edge.score, 60);
    assert.equal(edge.detail, 'within_negotiation_buffer');
  });

  it('عجز 20٪ ⇒ 45 · ويتلاشى إلى 0 عند عجز 50٪', () => {
    const r = scorePrice(makeProperty({secretMin: SECRET}), makeSearch({maxBudget: 16_000_000}));
    assert.equal(r.score, 45);
    assert.equal(r.detail, 'below_negotiation_buffer');
    assert.equal(scorePrice(makeProperty({secretMin: SECRET}), makeSearch({maxBudget: 10_000_000})).score, 0);
    assert.equal(scorePrice(makeProperty({secretMin: SECRET}), makeSearch({maxBudget: 8_000_000})).score, 0);
  });

  it('سرّي أو ميزانية غير صالحة ⇒ 0/invalid_price', () => {
    assert.equal(scorePrice(makeProperty({secretMin: 0}), makeSearch()).detail, 'invalid_price');
    assert.equal(scorePrice(makeProperty(), makeSearch({maxBudget: 0})).score, 0);
  });
});

// ─── الطبقة 4: المزايا ──────────────────────────────────────────────────────

describe('الطبقة 4 — Soft Features', () => {
  it('تطابق كامل التفضيلات وبيانات مكتملة ⇒ درجة عالية', () => {
    const r = scoreFeatures(makeProperty(), makeSearch());
    assert.ok(r.score >= 95, `متوقع ≥95 حصلنا ${r.score}`);
    assert.equal(r.detail, 'matched_preferences');
  });

  it('بلا تفضيلات ⇒ 70 + 30×اكتمال و detail مناسب', () => {
    const full = makeProperty();
    const r = scoreFeatures(full, makeSearch({minAreaM2: null, minRooms: null, minBathrooms: null}));
    const completeness = computeDataCompleteness(full);
    assert.equal(r.detail, 'no_preferences_provided');
    assert.equal(r.score, Math.round(70 + 30 * completeness));
  });

  it('بيانات ناقصة تعطي درجات محايدة معقولة (لا صفر)', () => {
    const Sparse = makeProperty({areaM2: null, rooms: null, bathrooms: null});
    const r = scoreFeatures(Sparse, makeSearch());
    assert.ok(r.score >= 50, `متوقع ≥50 حصلنا ${r.score}`);
  });

  it('العقار الأضعف تفضيلاً يحصل درجة أقل (رتّبية صحيحة)', () => {
    const good = scoreFeatures(makeProperty({areaM2: 150, rooms: 5, bathrooms: 3}), makeSearch());
    const bad = scoreFeatures(makeProperty({areaM2: 60, rooms: 1, bathrooms: 0}), makeSearch());
    assert.ok(good.score > bad.score, `${good.score} يجب أن يتفوق على ${bad.score}`);
  });

  it('computeDataCompleteness محصور بين 0 و1 ويزيد مع البيانات', () => {
    const empty = makeProperty({
      areaM2: null, rooms: null, bathrooms: null, floor: null, totalFloors: null,
      furnished: null, hasParking: null, hasElevator: null, hasGarden: null,
      neighborhood: null, description: null, imagesCount: 0
    });
    assert.equal(computeDataCompleteness(empty), 0);
    assert.equal(computeDataCompleteness(makeProperty()), 1);
  });
});

// ─── التسجيل النهائي والعرض ─────────────────────────────────────────────────

describe('التسجيل النهائي', () => {
  it('calculateFinalScore مجموع مرجّح صحيح', () => {
    // (100*40 + 80*40 + 90*20)/100 = 90
    assert.equal(calculateFinalScore(100, 80, 90, DEFAULT_WEIGHTS), 90);
    assert.equal(calculateFinalScore(0, 0, 0, DEFAULT_WEIGHTS), 0);
    assert.equal(calculateFinalScore(100, 100, 100, DEFAULT_WEIGHTS), 100);
  });

  it('calcDisplayedScore: علني فقط + مكافأة خشنة', () => {
    // ميزانية تكفي السعر العلني + داخلية عالية ⇒ 100
    assert.equal(calcDisplayedScore(20_000_000, 25_000_000, 92), 100);
    // نفس الشيء بدون مكافأة كاملة
    assert.equal(calcDisplayedScore(20_000_000, 25_000_000, 70), 100); // fit=100 +3 فيُقصَّ المنحنى عند 100
    // ميزانية 80٪ من العلني + داخلية 92 ⇒ 80+10=90
    assert.equal(calcDisplayedScore(25_000_000, 20_000_000, 92), 90);
    // داخلية 66 ⇒ +3 ⇒ 83
    assert.equal(calcDisplayedScore(25_000_000, 20_000_000, 66), 83);
    // داخلية ضعيفة < 65 ⇒ بلا مكافأة
    assert.equal(calcDisplayedScore(25_000_000, 20_000_000, 40), 80);
  });

  it('calcDisplayedScore محصورة دائماً في [0,100]', () => {
    assert.equal(calcDisplayedScore(0, 10_000_000, 100), 100);
    assert.equal(calcDisplayedScore(50_000_000, 1_000_000, 0), 2);
  });
});

// ─── المطابقة الكاملة (end-to-end) ──────────────────────────────────────────

describe('runMatching', () => {
  it('يرفض الطلبات غير الصالحة بنيوياً', () => {
    assert.deepEqual(runMatching(makeSearch({propertyType: 'LAND', dealType: 'RENT'}), [makeProperty()]), []);
    assert.deepEqual(runMatching(makeSearch({maxBudget: 0}), [makeProperty()]), []);
  });

  it('يرشّح ويرتّب ويقصّ على 10 ويحترم عتبة 65', () => {
    const search = makeSearch({maxBudget: 25_000_000});
    const candidates: MatchableProperty[] = [];

    // 12 مرشحاً قوياً (يجب ألا يتجاوز الناتج 10)
    for (let i = 0; i < 12; i += 1) {
      candidates.push(
        makeProperty({
          secretMin: 18_000_000 + i * 200_000,
          askingPrice: 20_000_000 + i * 200_000,
          neighborhood: 'hydra'
        })
      );
    }
    // مرشح ضعيف جداً بالسعر (درجة عرض < 65 ⇒ يُستبعد)
    candidates.push(makeProperty({secretMin: 40_000_000, askingPrice: 49_000_000, neighborhood: 'hydra'}));
    // غير مطابق للفلاتر
    candidates.push(makeProperty({dealType: 'RENT'}));

    const results = runMatching(search, candidates);

    assert.ok(results.length <= MATCH_MAX_RESULTS, `النتائج ${results.length} > 10`);
    assert.ok(results.length > 0, 'يجب إيجاد مرشحين');
    for (const r of results) {
      assert.ok(r.displayedScore >= MIN_DISPLAY_SCORE, `درجة عرض ${r.displayedScore} دون العتبة`);
      assert.ok(r.internalScore >= 0 && r.internalScore <= 100);
    }
    // ترتيب تنازلي بالدرجة الداخلية
    for (let i = 1; i < results.length; i += 1) {
      assert.ok(results[i - 1]!.internalScore >= results[i]!.internalScore, 'الترتيب مكسور');
    }
    // لا ازدواجية
    assert.equal(new Set(results.map((r) => r.propertyId)).size, results.length);
    // الأفضل سعراً يتصدّر
    assert.equal(results[0]!.breakdown.priceDetail, 'above_secret_min_120');
  });

  it('الأفضل في الحي يتقدّم على نفس البلدية ثم على بنفس الولاية', () => {
    const search = makeSearch({neighborhoods: ['hydra'], maxBudget: 30_000_000, minAreaM2: null, minRooms: null, minBathrooms: null});
    const inNeighborhood = makeProperty({id: 'A-neighborhood', neighborhood: 'Hydra'});
    const inCommune = makeProperty({id: 'B-commune', neighborhood: 'Paradou'});
    const inWilaya = makeProperty({id: 'C-wilaya', communeId: 571, neighborhood: 'Rouiba'});

    const results = runMatching(search, [inWilaya, inCommune, inNeighborhood]);
    assert.deepEqual(results.map((r) => r.propertyId), ['A-neighborhood', 'B-commune', 'C-wilaya']);
    assert.equal(results[0]!.breakdown.locationDetail, 'same_neighborhood');
    assert.equal(results[2]!.breakdown.locationDetail, 'same_wilaya');
  });

  it('لقطة الرسوم تُحسب من secretMin داخل النتيجة', () => {
    const r = runMatching(makeSearch(), [makeProperty({secretMin: 22_000_000})]);
    assert.equal(r[0]!.breakdown.sellerFee, 40_000); // شريحة ≤ 35M للبيع
  });

  it('الأوزان المخصّصة تؤثر في الترتيب منطقياً', () => {
    const search = makeSearch({neighborhoods: ['hydra'], maxBudget: 20_000_000});
    // سعر ممتاز موقع أبعد
    const priceStar = makeProperty({id: 'price-star', communeId: 571, secretMin: 18_000_000, askingPrice: 19_000_000});
    // موقع مثالي سعر أضعف (داخل الهامش)
    const locationStar = makeProperty({id: 'location-star', neighborhood: 'hydra', secretMin: 24_000_000, askingPrice: 20_000_000});

    const priceWins = runMatching({...search, weights: {priceWeight: 90, locationWeight: 5, featuresWeight: 5}}, [locationStar, priceStar]);
    assert.equal(priceWins[0]!.propertyId, 'price-star');

    const locationWins = runMatching({...search, weights: {priceWeight: 5, locationWeight: 90, featuresWeight: 5}}, [locationStar, priceStar]);
    assert.equal(locationWins[0]!.propertyId, 'location-star');
  });
});
