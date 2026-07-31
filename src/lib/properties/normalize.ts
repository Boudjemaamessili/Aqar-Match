/**
 * تطبيع مدخلات الاستيراد الجماعي — طبقة نقية (بلا I/O).
 *
 * الوكالات ترسل تسميات حرة بالعربية/الفرنسية (بيع، شقة، location، تيران…).
 * الواجب هنا: تحويلها لمفاتيح النظام الداخلية أو رفضها برمز واضح.
 * مقارنة النصوص تعيد استخدام normalizeNeighborhood من matching.ts
 * (توحيد الألف/التاء/الحركات/علامات الترقيم الفرنسية) — بلا تكرار منطق.
 * بعد التطبيع يمر كل صف على propertyCoreSchema نفسها (نفس قواعد النشر الفردي).
 */
import {ACTIVE_WILAYAS, communesOfWilaya} from '@/lib/geo';
import {normalizeNeighborhood, type DealType, type PropertyType} from '@/lib/matching';
import type {LegalStatusInput, PropertyConditionInput} from './constants';
import type {BulkRawRow} from './schemas';

// ─── خرائط التسميات (المفاتيح مُطبَّعة مسبقاً بنفس الدالة) ───────────────────

const DEAL_TYPE_LABELS: Readonly<Record<string, DealType>> = buildLabelMap<DealType>({
  بيع: 'SALE',
  للبيع: 'SALE',
  vente: 'SALE',
  sale: 'SALE',
  إيجار: 'RENT',
  ايجار: 'RENT',
  كراء: 'RENT',
  location: 'RENT',
  louer: 'RENT',
  rent: 'RENT',
  'إيجار موسمي': 'SEASONAL_RENT',
  'كراء موسمي': 'SEASONAL_RENT',
  موسمي: 'SEASONAL_RENT',
  saisonnier: 'SEASONAL_RENT',
  saisonnière: 'SEASONAL_RENT',
  'location saisonnière': 'SEASONAL_RENT',
  'location saisonniere': 'SEASONAL_RENT',
  seasonal: 'SEASONAL_RENT',
  'seasonal rent': 'SEASONAL_RENT'
});

const PROPERTY_TYPE_LABELS: Readonly<Record<string, PropertyType>> = buildLabelMap<PropertyType>({
  شقة: 'APARTMENT',
  شقه: 'APARTMENT',
  appartement: 'APARTMENT',
  appart: 'APARTMENT',
  apartment: 'APARTMENT',
  منزل: 'HOUSE',
  دار: 'HOUSE',
  بيت: 'HOUSE',
  maison: 'HOUSE',
  house: 'HOUSE',
  فيلا: 'VILLA',
  villa: 'VILLA',
  أرض: 'LAND',
  ارض: 'LAND',
  'قطعة أرض': 'LAND',
  'قطعة ارض': 'LAND',
  terrain: 'LAND',
  land: 'LAND',
  lot: 'LAND',
  محل: 'COMMERCIAL',
  'محل تجاري': 'COMMERCIAL',
  commercial: 'COMMERCIAL',
  local: 'COMMERCIAL',
  'local commercial': 'COMMERCIAL',
  boutique: 'COMMERCIAL',
  magasin: 'COMMERCIAL',
  مكتب: 'OFFICE',
  bureau: 'OFFICE',
  office: 'OFFICE',
  ستوديو: 'STUDIO',
  استوديو: 'STUDIO',
  studio: 'STUDIO'
});

const LEGAL_STATUS_LABELS: Readonly<Record<string, LegalStatusInput>> = buildLabelMap<LegalStatusInput>({
  موثق: 'NOTARIZED_DEED',
  'عقد موثق': 'NOTARIZED_DEED',
  'acte notarié': 'NOTARIZED_DEED',
  notarié: 'NOTARIZED_DEED',
  notaire: 'NOTARIZED_DEED',
  'دفتر عقاري': 'LAND_TITLE',
  'livret foncier': 'LAND_TITLE',
  'وعد بالبيع': 'PROMISE_OF_SALE',
  'promesse de vente': 'PROMISE_OF_SALE',
  promesse: 'PROMISE_OF_SALE',
  'قرار امتياز': 'ALLOCATION_DECISION',
  'قرار تخصيص': 'ALLOCATION_DECISION',
  attribution: 'ALLOCATION_DECISION',
  "décision d'attribution": 'ALLOCATION_DECISION',
  'عقد عرفي': 'PRIVATE_AGREEMENT',
  عرفي: 'PRIVATE_AGREEMENT',
  'sous-seing privé': 'PRIVATE_AGREEMENT',
  'قيد التسوية': 'IN_REGULARIZATION',
  'في التسوية': 'IN_REGULARIZATION',
  'en cours': 'IN_REGULARIZATION',
  'en régularisation': 'IN_REGULARIZATION'
});

const CONDITION_LABELS: Readonly<Record<string, PropertyConditionInput>> =
  buildLabelMap<PropertyConditionInput>({
    جديد: 'NEW',
    neuf: 'NEW',
    neuve: 'NEW',
    new: 'NEW',
    جيد: 'GOOD',
    'حالة جيدة': 'GOOD',
    bon: 'GOOD',
    'bon état': 'GOOD',
    good: 'GOOD',
    مجدد: 'RENOVATED',
    مرمم: 'RENOVATED',
    rénové: 'RENOVATED',
    renovated: 'RENOVATED',
    'يحتاج تهيئة': 'TO_RENOVATE',
    'يحتاج ترميم': 'TO_RENOVATE',
    للترميم: 'TO_RENOVATE',
    'à rénover': 'TO_RENOVATE',
    'قيد الإنجاز': 'UNDER_CONSTRUCTION',
    'في الإنجاز': 'UNDER_CONSTRUCTION',
    'en construction': 'UNDER_CONSTRUCTION'
  });

/** يبني خريطة بمفاتيح مُطبَّعة — التطبيع يوحّد الحالة/الهمزات/العلامات */
function buildLabelMap<T>(labels: Readonly<Record<string, T>>): Readonly<Record<string, T>> {
  const normalized: Record<string, T> = {};
  for (const [label, value] of Object.entries(labels)) {
    normalized[normalizeNeighborhood(label)] = value;
  }
  return normalized;
}

function lookup<T>(map: Readonly<Record<string, T>>, input: string): T | null {
  const key = normalizeNeighborhood(input);
  return key.length > 0 ? (map[key] ?? null) : null;
}

/** بيع / location / موسمي… → مفتاح المعاملة الداخلي */
export function normalizeDealTypeLabel(input: string): DealType | null {
  return lookup(DEAL_TYPE_LABELS, input);
}

/** شقة / villa / bureau… → مفتاح نوع العقار الداخلي */
export function normalizePropertyTypeLabel(input: string): PropertyType | null {
  return lookup(PROPERTY_TYPE_LABELS, input);
}

/** عقد موثق / livret foncier… → الوضعية القانونية */
export function normalizeLegalStatusLabel(input: string): LegalStatusInput | null {
  return lookup(LEGAL_STATUS_LABELS, input);
}

/** جديد / rénové… → حالة العقار */
export function normalizeConditionLabel(input: string): PropertyConditionInput | null {
  return lookup(CONDITION_LABELS, input);
}

/**
 * يحول رقماً قادماً من جدول Sheets بأي لبوس:
 *   «12 000 000» · «12 000 000» (فواصل آلاف) · «120,5» (فاصلة فرنسية) · 16
 * null = غير قابل للتفسير. لا تقريب خفي — القيمة تُفحص لاحقاً بـ Zod.
 */
export function parseAmountNumber(input: string | number): number | null {
  if (typeof input === 'number') {
    return Number.isFinite(input) ? input : null;
  }
  const cleaned = input.trim().replace(/\s+/g, '').replace(',', '.');
  if (cleaned.length === 0) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

/** رقم ولاية (16، «09»، alger، الجزائر، Oran…) → الرمز الرسمي أو null */
export function resolveWilayaInput(input: string | number): number | null {
  const numeric = typeof input === 'number' ? input : parseAmountNumber(input);
  if (numeric !== null && Number.isInteger(numeric)) {
    const byCode = ACTIVE_WILAYAS.find((w) => w.code === numeric);
    if (byCode) return byCode.code;
  }
  if (typeof input !== 'string') return null;
  const key = normalizeNeighborhood(input);
  const byLabel = ACTIVE_WILAYAS.find(
    (w) => normalizeNeighborhood(w.slug) === key || normalizeNeighborhood(w.nameAr) === key || normalizeNeighborhood(w.nameFr) === key
  );
  return byLabel?.code ?? null;
}

/** بلدية داخل ولاية محددة (معرف رسمي، slug، اسم عربي/فرنسي) → المعرف أو null */
export function resolveCommuneInput(wilayaCode: number, input: string | number): number | null {
  const communes = communesOfWilaya(wilayaCode);
  const numeric = typeof input === 'number' ? input : parseAmountNumber(input);
  if (numeric !== null && Number.isInteger(numeric)) {
    const byId = communes.find((c) => c.id === numeric);
    if (byId) return byId.id;
  }
  if (typeof input !== 'string') return null;
  const key = normalizeNeighborhood(input);
  if (key.length === 0) return null;
  const byLabel = communes.find(
    (c) =>
      normalizeNeighborhood(c.slug) === key ||
      normalizeNeighborhood(c.nameAr) === key ||
      normalizeNeighborhood(c.nameFr) === key
  );
  return byLabel?.id ?? null;
}

// ─── بناء جسم التحقق الصارم من صف خام ────────────────────────────────────────

export interface BulkRowFailure {
  readonly field: string;
  readonly reason: string;
}

export type BulkRowBuildResult =
  | {readonly ok: true; readonly input: unknown}
  | {readonly ok: false; readonly failures: readonly BulkRowFailure[]};

function optionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseOptionalNumber(
  value: string | number | undefined,
  field: string,
  failures: BulkRowFailure[]
): number | undefined {
  if (value === undefined) return undefined;
  const parsed = parseAmountNumber(value);
  if (parsed === null) {
    failures.push({field, reason: 'INVALID_NUMBER'});
    return undefined;
  }
  return parsed;
}

/** صف خام → مدخل جاهز لـ propertyCoreSchema، أو قائمة إخفاقات مسببة */
export function buildCoreInputFromBulkRow(raw: BulkRawRow): BulkRowBuildResult {
  const failures: BulkRowFailure[] = [];

  const dealType = normalizeDealTypeLabel(raw.dealType);
  if (!dealType) failures.push({field: 'dealType', reason: 'UNKNOWN_DEAL_TYPE'});

  const propertyType = normalizePropertyTypeLabel(raw.propertyType);
  if (!propertyType) failures.push({field: 'propertyType', reason: 'UNKNOWN_PROPERTY_TYPE'});

  const wilaya = resolveWilayaInput(raw.wilaya);
  if (wilaya === null) failures.push({field: 'wilaya', reason: 'UNKNOWN_WILAYA'});

  // لا تفسير للبلدية بلا ولاية صالحة (نطاق القرار)
  let commune: number | null = null;
  if (wilaya !== null) {
    commune = resolveCommuneInput(wilaya, raw.commune);
    if (commune === null) failures.push({field: 'commune', reason: 'UNKNOWN_COMMUNE'});
  }

  const price = parseOptionalNumber(raw.price, 'price', failures);
  const secretMin = parseOptionalNumber(raw.secretMin, 'secretMin', failures);
  const area = parseOptionalNumber(raw.area, 'area', failures);
  const rooms = parseOptionalNumber(raw.rooms, 'rooms', failures);
  const floor = parseOptionalNumber(raw.floor, 'floor', failures);
  const floors = parseOptionalNumber(raw.floors, 'floors', failures);
  const bathrooms = parseOptionalNumber(raw.bathrooms, 'bathrooms', failures);
  const facades = parseOptionalNumber(raw.facades, 'facades', failures);

  let legalStatus: LegalStatusInput | undefined;
  const rawLegal = optionalText(raw.legalStatus);
  if (rawLegal) {
    const normalized = normalizeLegalStatusLabel(rawLegal);
    if (normalized) legalStatus = normalized;
    else failures.push({field: 'legalStatus', reason: 'UNKNOWN_LEGAL_STATUS'});
  }

  let condition: PropertyConditionInput | undefined;
  const rawCondition = optionalText(raw.condition);
  if (rawCondition) {
    const normalized = normalizeConditionLabel(rawCondition);
    if (normalized) condition = normalized;
    else failures.push({field: 'condition', reason: 'UNKNOWN_CONDITION'});
  }

  if (failures.length > 0) {
    return {ok: false, failures};
  }

  return {
    ok: true,
    input: {
      dealType,
      propertyType,
      wilaya,
      commune,
      neighborhood: optionalText(raw.neighborhood),
      title: raw.title,
      description: optionalText(raw.description),
      area,
      rooms,
      floor,
      floors,
      bathrooms,
      facades,
      legalStatus,
      condition,
      price,
      secretMin,
      images: raw.images
    }
  };
}

// ─── كشف التكرار (صفوف مُتخطّاة) ────────────────────────────────────────────

/** مفتاح تطبيع التكرار: (بلدية × عنوان مُطبَّع × سعر) — ثابت لنفس الإعلان */
export function listingDuplicateKey(communeId: number, title: string, askingPrice: number): string {
  return `${communeId}|${normalizeNeighborhood(title)}|${Math.round(askingPrice)}`;
}
