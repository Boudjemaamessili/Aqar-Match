/**
 * ═══════════════════════════════════════════════════════════════════════════
 * محرك المطابقة — عقار Match (Matching Engine)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * وحدة مجال نقية (pure domain module):
 *   - بلا Prisma، بلا Next، بلا أي I/O — مدخلات/مخرجات فقط.
 *   - قابلة للاختبار بالكامل (src/lib/matching.test.ts).
 *
 * الحدود الأمنية:
 *   - `secretMin` مسموح دخوله هنا لأن المحرك server-only.
 *   - `internalScore` يستخدم السعر السري ← لا يخرج أبداً للعميل.
 *   - `displayedScore` مبني على `askingPrice` العلني + مكافأة خشنة من الداخلي
 *     (3/6/10) حتى لا يمكن استنتاج السرّي من درجة العرض.
 *
 * المصطلحات اللغوية (vocabulary) مرآة حرفية لتعدادات Prisma:
 *   DealType ← TransactionType | PropertyType ← PropertyType
 *   أما `status` فهي مفردات المحرك الصغيرة المعتمدة في المواصفة
 *   (active / matched / unmonitored) وتُترجَم من PropertyStatus في طبقة
 *   التسلسل: ACTIVE ← 'active' (المرحلتان 4–5).
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ─── الأنواع اللغوية (مرآة Prisma enums) ─────────────────────────────────────

export type DealType = 'SALE' | 'RENT' | 'SEASONAL_RENT';

export type PropertyType =
  | 'APARTMENT'
  | 'HOUSE'
  | 'VILLA'
  | 'LAND'
  | 'COMMERCIAL'
  | 'OFFICE'
  | 'STUDIO';

/** حالات العقار المؤهلة للمطابقة — مفردات المحرك (تُترجم من Prisma في الطبقة الأعلى) */
export type EligibleStatus = 'active' | 'matched' | 'unmonitored';

// ─── الثوابت ─────────────────────────────────────────────────────────────────

/** مهلة رد البائع على المطابقة قبل التصعيد للمرشّح التالي */
export const RESPONSE_DEADLINE_HOURS = 48;

/** الحد الأدنى المطلق المسموح لـ secretMin حسب نوع المعاملة (دج) */
export const SECRET_MIN_ABSOLUTE_FLOOR: Readonly<Record<DealType, number>> = {
  SALE: 2_000_000,
  RENT: 20_000,
  SEASONAL_RENT: 50_000
} as const;

/** أنواع العقارات المسموحة لكل نوع معاملة */
export const PROPERTY_TYPE_RULES: Readonly<Record<DealType, readonly PropertyType[]>> = {
  SALE: ['APARTMENT', 'HOUSE', 'VILLA', 'LAND', 'COMMERCIAL', 'OFFICE', 'STUDIO'],
  RENT: ['APARTMENT', 'HOUSE', 'VILLA', 'COMMERCIAL', 'OFFICE', 'STUDIO'],
  SEASONAL_RENT: ['APARTMENT', 'HOUSE', 'VILLA', 'STUDIO']
} as const;

/** هامش التفاوض في خوارزمية السعر الأعمى (٪) */
export const NEGOTIATION_BUFFER_PERCENT = 10;

/** درجة السعر عند هامش التفاوض (بداية المنطقة) والنهاية (عجز 10٪) */
const PRICE_SCORE_IN_BUFFER_START = 80;
const PRICE_SCORE_IN_BUFFER_END = 60;
/** عجز العجز: أي عجز ≥ 50٪ يصفّر درجة السعر */
const PRICE_DEFICIT_ZERO_AT = 0.5;

/** الحد الأدنى لدرجة العرض — لا يُعرض أي تطابق دونها */
export const MIN_DISPLAY_SCORE = 65;

/** أقصى عدد نتائج مُعادة — أعلى 10 مطابقات فقط */
export const MATCH_MAX_RESULTS = 10;

/** الأوزان الافتراضية للطبقات (تُجمع = 100) */
export const DEFAULT_WEIGHTS: Readonly<ScoringWeights> = {
  priceWeight: 40,
  locationWeight: 40,
  featuresWeight: 20
} as const;

/** الحالات المؤهلة للمطابقة فقط */
export const ELIGIBLE_STATUSES: readonly EligibleStatus[] = ['active', 'matched', 'unmonitored'];

// ─── جدول رسوم البائع (بيع) — يُراجَع ويُعتمد قبل الإطلاق ────────────────────

/**
 * شرائح رسوم البيع حسب secretMin (حد الشريحة شامل — inclusive upper bound):
 *   ≤ 5M      → 10.000 دج      ≤ 50M  → 60.000 دج
 *   ≤ 10M     → 15.000 دج      ≤ 80M  → 80.000 دج
 *   ≤ 20M     → 25.000 دج      ≤ 120M → 100.000 دج
 *   ≤ 35M     → 40.000 دج      >  120M → 100.000 + 5.000 عن كل 10M إضافية
 */
export const SALE_FEE_TIERS: ReadonlyArray<{readonly maxSecretMin: number; readonly fee: number}> = [
  {maxSecretMin: 5_000_000, fee: 10_000},
  {maxSecretMin: 10_000_000, fee: 15_000},
  {maxSecretMin: 20_000_000, fee: 25_000},
  {maxSecretMin: 35_000_000, fee: 40_000},
  {maxSecretMin: 50_000_000, fee: 60_000},
  {maxSecretMin: 80_000_000, fee: 80_000},
  {maxSecretMin: 120_000_000, fee: 100_000}
] as const;

/** فوق آخر شريحة: قاعدة + زيادة عن كل 10M إضافية (تقريب للأعلى) */
const SALE_FEE_OVERFLOW_BASE = 100_000;
const SALE_FEE_OVERFLOW_STEP_AMOUNT = 10_000_000;
const SALE_FEE_OVERFLOW_STEP_FEE = 5_000;

/** رسوم الإيجار/الموسمي = نصف قيمة secretMin (حسب المواصفة المعتمدة) */
const RENT_FEE_RATIO_OF_SECRET_MIN = 0.5;

// ─── الواجهات ────────────────────────────────────────────────────────────────

/** عقار بصيغة قابلة للمطابقة (يُبنى من سجل Prisma عبر مُسلسِل في المرحلة 5) */
export interface MatchableProperty {
  readonly id: string;
  readonly dealType: DealType;
  readonly propertyType: PropertyType;
  readonly status: EligibleStatus;
  readonly wilayaCode: number;
  readonly communeId: number;
  /** حي العقار (يُطبَّع داخل المحرك دفاعياً) */
  readonly neighborhood: string | null;
  /** السعر المطلوب العلني (دج) */
  readonly askingPrice: number;
  /** 🔒 الحد الأدنى السري — server-only */
  readonly secretMin: number;
  // حقول المزايا المرنة (null = غير محدد)
  readonly areaM2: number | null;
  readonly rooms: number | null;
  readonly bathrooms: number | null;
  // حقول اكتمال البيانات
  readonly floor: number | null;
  readonly totalFloors: number | null;
  readonly furnished: boolean | null;
  readonly hasParking: boolean | null;
  readonly hasElevator: boolean | null;
  readonly hasGarden: boolean | null;
  readonly description: string | null;
  /** عدد الصور المنشورة (0 = بلا صور) */
  readonly imagesCount: number;
}

/** طلب بحث المشتري */
export interface SearchQuery {
  readonly dealType: DealType;
  readonly propertyType: PropertyType;
  readonly wilayaCode: number;
  /** null = كامل الولاية */
  readonly communeId: number | null;
  /** أحياء مفضّلة (تُطبَّع داخلياً) — فارغة = بلا تفضيل */
  readonly neighborhoods: readonly string[];
  /** الميزانية القصوى (دج) */
  readonly maxBudget: number;
  // تفضيلات مرنة (null = بلا تفضيل)
  readonly minAreaM2: number | null;
  readonly minRooms: number | null;
  readonly minBathrooms: number | null;
  /** أوزان مخصّصة (ديناميكية لاحقاً حسب سلوك المستخدم) — تُطبَّع لمجموع 100 */
  readonly weights?: Partial<ScoringWeights>;
}

/** أوزان الطبقات (نسب مئوية، المجموع 100 بعد التطبيع) */
export interface ScoringWeights {
  readonly priceWeight: number;
  readonly locationWeight: number;
  readonly featuresWeight: number;
}

export type LocationDetail = 'same_neighborhood' | 'same_commune' | 'same_wilaya';

export type PriceDetail =
  | 'above_secret_min_120'
  | 'meets_secret_min'
  | 'within_negotiation_buffer'
  | 'below_negotiation_buffer'
  | 'invalid_price';

export type FeaturesDetail =
  | 'matched_preferences'
  | 'partial_preferences'
  | 'no_preferences_provided';

export interface LayerScore<TDetail extends string> {
  readonly score: number;
  readonly detail: TDetail;
}

/** تفصيل النقاط — داخلي (audit/debug)، لا يُعاد في الواجهات العامة */
export interface ScoreBreakdown {
  readonly locationScore: number;
  readonly locationDetail: LocationDetail;
  readonly priceScore: number;
  readonly priceDetail: PriceDetail;
  readonly featuresScore: number;
  readonly featuresDetail: FeaturesDetail;
  dataCompleteness: number;
  readonly weights: ScoringWeights;
  /** لقطة رسوم البائع وقت المطابقة (تُخزَّن على Match.feeSeller) */
  readonly sellerFee: number;
}

export interface MatchResult {
  readonly propertyId: string;
  /** دقيقة، مبنية على السعر السري — داخلية فقط */
  readonly internalScore: number;
  /** مبسّطة للعرض، مبنية على السعر العلني + مكافأة خشنة */
  readonly displayedScore: number;
  readonly breakdown: ScoreBreakdown;
}

// ─── أدوات داخلية ────────────────────────────────────────────────────────────

function clampScore(score: number): number {
  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * تطبيع اسم الحي للمطابقة:
 *   NFKC + صغير + إزالة تشكيل العربية + توحيد الألف/التاء المربوطة/الياء
 *   + استبدال غير الحروف والأرقام بمسافة واحدة.
 * تُستخدم أيضاً عند كتابة neighborhoodKey في المرحلة 4 — لا تغيّرها بلا حذر.
 */
export function normalizeNeighborhood(input: string): string {
  return input
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ً-ْٰـ]/g, '') // حركات وتشكيل وتطويل (tatweel)
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[éèêë]/g, 'e')
    .replace(/[àâä]/g, 'a')
    .replace(/[ûü]/g, 'u')
    .replace(/[ôö]/g, 'o')
    .replace(/[îï]/g, 'i')
    .replace(/ç/g, 'c')
    .replace(/[^\p{Script=Arabic}a-z0-9]+/giu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** تطبيع الأوزان: دمج الجزئي مع الافتراضي وإعادة القياس لمجموع 100 */
export function normalizeWeights(partial?: Partial<ScoringWeights>): ScoringWeights {
  const merged: ScoringWeights = {
    priceWeight: partial?.priceWeight ?? DEFAULT_WEIGHTS.priceWeight,
    locationWeight: partial?.locationWeight ?? DEFAULT_WEIGHTS.locationWeight,
    featuresWeight: partial?.featuresWeight ?? DEFAULT_WEIGHTS.featuresWeight
  };
  const sum = merged.priceWeight + merged.locationWeight + merged.featuresWeight;
  if (sum <= 0) {
    return {...DEFAULT_WEIGHTS};
  }
  if (Math.abs(sum - 100) < Number.EPSILON) {
    return merged;
  }
  const scale = 100 / sum;
  return {
    priceWeight: merged.priceWeight * scale,
    locationWeight: merged.locationWeight * scale,
    featuresWeight: merged.featuresWeight * scale
  };
}

/** موعد انتهاء مهلة رد البائع (48 ساعة) — للاستخدام عند إنشاء المطابقة */
export function computeRespondBy(from: Date = new Date()): Date {
  return new Date(from.getTime() + RESPONSE_DEADLINE_HOURS * 3_600_000);
}

// ─── دوال الرسوم والتحقق ─────────────────────────────────────────────────────

/** الحد الأدنى المطلق لـ secretMin حسب نوع المعاملة */
export function getSecretMinAbsoluteFloor(dealType: DealType): number {
  return SECRET_MIN_ABSOLUTE_FLOOR[dealType];
}

/** هل قيمة secretMin صالحة (فوق الحد الأدنى المطلق)؟ */
export function isValidSecretMin(dealType: DealType, secretMin: number): boolean {
  return Number.isFinite(secretMin) && secretMin >= getSecretMinAbsoluteFloor(dealType);
}

/** السعر المطلوب يجب ألا يقل عن السرّي (قاعدة نزاهة إدخال — المرحلة 4) */
export function isValidPricePair(askingPrice: number, secretMin: number): boolean {
  return Number.isFinite(askingPrice) && askingPrice >= secretMin;
}

/** هل نوع العقار مسموح لهذا النوع من المعاملات؟ */
export function isPropertyTypeAllowed(dealType: DealType, propertyType: PropertyType): boolean {
  return PROPERTY_TYPE_RULES[dealType].includes(propertyType);
}

/**
 * رسوم البائع (دج) — تُحتسب على secretMin وتُخزَّن لقطة على المطابقة:
 *   بيع: جدول الشرائح SALE_FEE_TIERS (+ تجاوز تصاعدي فوق 120M)
 *   إيجار/موسمي: نصف قيمة secretMin
 */
export function calcSellerFee(dealType: DealType, secretMin: number): number {
  if (!Number.isFinite(secretMin) || secretMin < 0) {
    return 0;
  }
  if (dealType !== 'SALE') {
    return Math.round(secretMin * RENT_FEE_RATIO_OF_SECRET_MIN);
  }
  for (const tier of SALE_FEE_TIERS) {
    if (secretMin <= tier.maxSecretMin) {
      return tier.fee;
    }
  }
  const lastTier = SALE_FEE_TIERS[SALE_FEE_TIERS.length - 1]!;
  const overflow = secretMin - lastTier.maxSecretMin;
  const steps = Math.ceil(overflow / SALE_FEE_OVERFLOW_STEP_AMOUNT);
  return SALE_FEE_OVERFLOW_BASE + steps * SALE_FEE_OVERFLOW_STEP_FEE;
}

/** رسوم المشتري — صفر حالياً؛ التفعيل المستقبلي يمر عبر جدول معلن */
export function calcBuyerFee(): number {
  return 0;
}

// ─── الطبقة 1: الفلاتر الصارمة ────────────────────────────────────────────────

/** نوع المعاملة + نوع العقار + الولاية مطابقة تماماً + حالة مؤهلة */
export function passesHardFilters(property: MatchableProperty, search: SearchQuery): boolean {
  return (
    property.dealType === search.dealType &&
    property.propertyType === search.propertyType &&
    property.wilayaCode === search.wilayaCode &&
    ELIGIBLE_STATUSES.includes(property.status)
  );
}

// ─── الطبقة 2: المنطق الضبابي المكاني ────────────────────────────────────────

/**
 * نفس البلدية + نفس الحي → 100 · نفس البلدية → 85–90 · نفس الولاية → 70.
 * 90: المشتري بلا تفضيل حي (مرونة كاملة داخل البلدية)
 * 85: فضّل أحياءً وحي العقار غير مطابق/مجهول
 */
export function scoreLocation(
  property: MatchableProperty,
  search: SearchQuery
): LayerScore<LocationDetail> {
  if (property.communeId !== search.communeId) {
    // الفلاتر الصارمة تضمن نفس الولاية سلفاً
    return {score: 70, detail: 'same_wilaya'};
  }

  const targets = search.neighborhoods.map(normalizeNeighborhood);
  const propertyNeighborhood = property.neighborhood
    ? normalizeNeighborhood(property.neighborhood)
    : null;

  if (propertyNeighborhood !== null && propertyNeighborhood.length > 0 && targets.includes(propertyNeighborhood)) {
    return {score: 100, detail: 'same_neighborhood'};
  }
  if (targets.length === 0) {
    return {score: 90, detail: 'same_commune'};
  }
  return {score: 85, detail: 'same_commune'};
}

// ─── الطبقة 3: خوارزمية السعر الأعمى ─────────────────────────────────────────

/**
 * تعمل على secretMin (لا تُظهره أبداً):
 *   ميزانية ≥ 120٪ من السرّي → 100
 *   ميزانية ≥ السرّي          → 80..100 خطياً (عند السرّي = 80)
 *   عجز ≤ 10٪ (هامش التفاوض)  → 60..80 خطياً
 *   عجز أكبر                  → انحدار خطي حتى 0 عند عجز 50٪
 */
export function scorePrice(
  property: MatchableProperty,
  search: SearchQuery
): LayerScore<PriceDetail> {
  const {secretMin} = property;
  const budget = search.maxBudget;

  if (!Number.isFinite(secretMin) || secretMin <= 0 || !Number.isFinite(budget) || budget <= 0) {
    return {score: 0, detail: 'invalid_price'};
  }

  const ratio = budget / secretMin;

  if (ratio >= 1.2) {
    return {score: 100, detail: 'above_secret_min_120'};
  }
  if (ratio >= 1) {
    const score = PRICE_SCORE_IN_BUFFER_START + ((ratio - 1) / 0.2) * (100 - PRICE_SCORE_IN_BUFFER_START);
    return {score: clampScore(score), detail: 'meets_secret_min'};
  }

  const deficit = 1 - ratio;
  if (deficit <= NEGOTIATION_BUFFER_PERCENT / 100) {
    const span = PRICE_SCORE_IN_BUFFER_START - PRICE_SCORE_IN_BUFFER_END;
    const score = PRICE_SCORE_IN_BUFFER_START - (deficit / (NEGOTIATION_BUFFER_PERCENT / 100)) * span;
    return {score: clampScore(score), detail: 'within_negotiation_buffer'};
  }

  const remaining = Math.max(0, 1 - (deficit - NEGOTIATION_BUFFER_PERCENT / 100) / (PRICE_DEFICIT_ZERO_AT - NEGOTIATION_BUFFER_PERCENT / 100));
  return {score: clampScore(PRICE_SCORE_IN_BUFFER_END * remaining), detail: 'below_negotiation_buffer'};
}

// ─── الطبقة 4: المزايا المرنة ────────────────────────────────────────────────

/**
 * اكتمال بيانات الإعلان: نسبة الحقول الاختيارية المملوءة (0..1).
 * قائمة الحقول: مساحة، غرف، حمامات، طابق، طوابق، مفروش، موقف، مصعد، حديقة،
 * حي، وصف ≥ 30 حرفاً، صورة واحدة على الأقل.
 */
export function computeDataCompleteness(property: MatchableProperty): number {
  const checks: readonly boolean[] = [
    property.areaM2 !== null,
    property.rooms !== null,
    property.bathrooms !== null,
    property.floor !== null,
    property.totalFloors !== null,
    property.furnished !== null,
    property.hasParking !== null,
    property.hasElevator !== null,
    property.hasGarden !== null,
    property.neighborhood !== null && property.neighborhood.trim().length > 0,
    property.description !== null && property.description.trim().length >= 30,
    property.imagesCount > 0
  ];
  const present = checks.filter(Boolean).length;
  return present / checks.length;
}

/** درجة جزئية مرنة لقيمة عددية مقابل حد أدنى مطلوب */
function scoreAgainstMin(
  value: number | null,
  min: number | null,
  unknownScore: number,
  scores: {readonly met: number; readonly oneShort: number; readonly twoShort: number; readonly worse: number}
): number {
  if (min === null) return 70; // المشتري بلا تفضيل هنا
  if (value === null) return unknownScore; // بيانات ناقصة — موقف محايد
  if (value >= min) return scores.met;
  const shortfall = min - value;
  if (shortfall <= 1) return scores.oneShort;
  if (shortfall <= 2) return scores.twoShort;
  return scores.worse;
}

/** درجة المساحة (منطق نسبي: قريب من المطلوب ≠ حرمان كامل) */
function scoreArea(areaM2: number | null, minAreaM2: number | null): number {
  if (minAreaM2 === null) return 70;
  if (areaM2 === null) return 50;
  const ratio = areaM2 / minAreaM2;
  if (ratio >= 1) return 100;
  if (ratio >= 0.9) return 85;
  if (ratio >= 0.8) return 70;
  return clampScore(ratio * 75); // خطي تحت 80٪
}

/**
 * الأوزان الداخلية للطبقة الرابعة: مساحة 40٪ + غرف 40٪ + (حمامات/اكتمال) 20٪.
 * بلا أي تفضيل مشترٍ: خط أساس عادل 70 + 30×اكتمال البيانات.
 */
export function scoreFeatures(
  property: MatchableProperty,
  search: SearchQuery
): LayerScore<FeaturesDetail> {
  const completeness = computeDataCompleteness(property);
  const hasPreferences =
    search.minAreaM2 !== null || search.minRooms !== null || search.minBathrooms !== null;

  if (!hasPreferences) {
    return {
      score: clampScore(70 + 30 * completeness),
      detail: 'no_preferences_provided'
    };
  }

  const areaSub = scoreArea(property.areaM2, search.minAreaM2);
  const roomsSub = scoreAgainstMin(property.rooms, search.minRooms, 50, {
    met: 100,
    oneShort: 75,
    twoShort: 50,
    worse: 25
  });
  const bathroomsSub = scoreAgainstMin(property.bathrooms, search.minBathrooms, 60, {
    met: 100,
    oneShort: 70,
    twoShort: 40,
    worse: 40
  });
  // سلة الـ 20٪: نصفها حمامات ونصفها اكتمال بيانات
  const bathroomAndCompletenessSub = bathroomsSub * 0.5 + completeness * 100 * 0.5;

  const score = areaSub * 0.4 + roomsSub * 0.4 + bathroomAndCompletenessSub * 0.2;

  const weakest = Math.min(
    search.minAreaM2 !== null ? areaSub : 100,
    search.minRooms !== null ? roomsSub : 100,
    search.minBathrooms !== null ? bathroomsSub : 100
  );

  return {
    score: clampScore(score),
    detail: weakest >= 75 ? 'matched_preferences' : 'partial_preferences'
  };
}

// ─── التسجيل النهائي ─────────────────────────────────────────────────────────

/** الدرجة الداخلية: مجموع مرجّح بالأوزان (مطبَّعة سلفاً لمجموع 100) */
export function calculateFinalScore(
  locationScore: number,
  priceScore: number,
  featuresScore: number,
  weights: ScoringWeights
): number {
  return clampScore(
    (locationScore * weights.locationWeight +
      priceScore * weights.priceWeight +
      featuresScore * weights.featuresWeight) /
      100
  );
}

/**
 * درجة العرض: مبنية على askingPrice العلني فقط + مكافأة خشنة من الداخلية
 * (الخطوات 3/6/10 تمنع استنتاج السرّي من تفاضل دقيق).
 */
export function calcDisplayedScore(
  askingPrice: number,
  maxBudget: number,
  internalScore: number
): number {
  let fit: number;
  if (maxBudget >= askingPrice) {
    fit = 100;
  } else if (askingPrice > 0) {
    fit = (maxBudget / askingPrice) * 100;
  } else {
    fit = 0;
  }
  const bonus = internalScore >= 90 ? 10 : internalScore >= 75 ? 6 : internalScore >= 65 ? 3 : 0;
  return clampScore(fit + bonus);
}

// ─── الدالة الرئيسية ─────────────────────────────────────────────────────────

/**
 * المطابقة الكاملة: فلاتر صارمة ← 3 طبقات تسجيل ← درجتان ← عتبة 65 ←
 * ترتيب تنازلي بالدرجة الداخلية ← أعلى 10 فقط.
 *
 * مدخل غير صالح بنيوياً (نوع غير مسموح / ميزانية صفرية) ⇒ مصفوفة فارغة.
 */
export function runMatching(search: SearchQuery, properties: readonly MatchableProperty[]): MatchResult[] {
  if (!isPropertyTypeAllowed(search.dealType, search.propertyType)) {
    return [];
  }
  if (!Number.isFinite(search.maxBudget) || search.maxBudget <= 0) {
    return [];
  }

  const weights = normalizeWeights(search.weights);
  const results: MatchResult[] = [];

  for (const property of properties) {
    if (!passesHardFilters(property, search)) continue;

    const location = scoreLocation(property, search);
    const price = scorePrice(property, search);
    const features = scoreFeatures(property, search);
    const internalScore = calculateFinalScore(location.score, price.score, features.score, weights);
    const displayedScore = calcDisplayedScore(property.askingPrice, search.maxBudget, internalScore);

    if (displayedScore < MIN_DISPLAY_SCORE) continue;

    results.push({
      propertyId: property.id,
      internalScore,
      displayedScore,
      breakdown: {
        locationScore: location.score,
        locationDetail: location.detail,
        priceScore: price.score,
        priceDetail: price.detail,
        featuresScore: features.score,
        featuresDetail: features.detail,
        dataCompleteness: computeDataCompleteness(property),
        weights,
        sellerFee: calcSellerFee(property.dealType, property.secretMin)
      }
    });
  }

  results.sort(
    (a, b) =>
      b.internalScore - a.internalScore ||
      b.displayedScore - a.displayedScore ||
      a.propertyId.localeCompare(b.propertyId)
  );

  return results.slice(0, MATCH_MAX_RESULTS);
}
