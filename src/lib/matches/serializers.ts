/**
 * مسلسِلات المطابقة — الحد الأمني الأهم في المنصة كلها.
 *
 * ⛔ محظورات صارمة هنا:
 *   - secretMin: لا يخرج نحو أي مدخل تسلسلي (toMatchableProperty تستهلكه
 *     داخل الخادم للمحرك فقط — لا تُستعمل في أي استجابة).
 *   - ownerPhone / sellerId / هاتف المشتري: يُكشف حصراً عبر toContactReveal
 *     بعد CONTACT_REVEALED ولطرفي المطابقة فقط.
 *   - maxBudget: سرّية متماثلة! البائع لا يرى ميزانية المشتري أبداً
 *     (منطق التفاوض الأعمى ثنائي الاتجاه).
 *   - internalScore وتفصيل النقاط: server-only — العميل يرى displayedScore فقط.
 */
import type {Commune, Match, Property, PropertyImage, SearchRequest, Wilaya} from '@prisma/client';
import type {EligibleStatus, MatchableProperty} from '@/lib/matching';

// ─── إلى المحرك (داخلي فقط) ─────────────────────────────────────────────────

type PropertyForEngine = Property & {readonly _count: {readonly images: number}};

/** Prisma → مفردات المحرك: ACTIVE→active · UNMONITORED→unmonitored */
function toEligibleStatus(status: Property['status']): EligibleStatus {
  if (status === 'ACTIVE') return 'active';
  if (status === 'UNMONITORED') return 'unmonitored';
  // يفترض وصول الحالات المؤهلة فقط عبر SQL؛ أي شيء آخر خارج المطابقة
  return 'unmonitored';
}

/** يبني مدخل المحرك — يمر بـ secretMin لأن المحرك server-only حصراً */
export function toMatchableProperty(property: PropertyForEngine): MatchableProperty {
  return {
    id: property.id,
    dealType: property.transactionType,
    propertyType: property.propertyType,
    status: toEligibleStatus(property.status),
    wilayaCode: property.wilayaCode,
    communeId: property.communeId,
    neighborhood: property.neighborhood,
    askingPrice: Number(property.askingPrice),
    secretMin: Number(property.secretMin),
    areaM2: property.areaM2,
    rooms: property.rooms,
    bathrooms: property.bathrooms,
    floor: property.floor,
    totalFloors: property.totalFloors,
    furnished: property.furnished,
    hasParking: property.hasParking,
    hasElevator: property.hasElevator,
    hasGarden: property.hasGarden,
    description: property.description,
    imagesCount: property._count.images
  };
}

/** يبني مدخل بحث المحرك من طلب مخزَّن (الحقول الرقمية العشرية → number) */
export function toEngineSearch(search: SearchRequest): import('@/lib/matching').SearchQuery {
  return {
    dealType: search.transactionType,
    propertyType: search.propertyType,
    wilayaCode: search.wilayaCode,
    communeId: search.communeId,
    neighborhoods: search.neighborhoods,
    maxBudget: Number(search.maxBudget),
    minAreaM2: search.minAreaM2,
    minRooms: search.minRooms,
    minBathrooms: search.minBathrooms
  };
}

// ─── أدوات إخفاء عامة ────────────────────────────────────────────────────────

/** يقنّع اسم شخص للعرض قبل كشف التواصل: «محمد بن عيسى» → «م. بن عيسى» */
export function maskPersonName(name: string | null | undefined): string {
  const trimmed = name?.trim() ?? '';
  if (trimmed.length === 0) return '•';
  const parts = trimmed.split(/\s+/);
  const first = parts[0] ?? '';
  if (parts.length === 1) return `${first.charAt(0)}.`;
  return `${first.charAt(0)}. ${parts.slice(1).join(' ')}`;
}

// ─── عرض المشتري (مطابقاته الكاملة) ─────────────────────────────────────────

type PropertyForBuyerView = Property & {
  readonly wilaya: Pick<Wilaya, 'code' | 'nameAr' | 'nameFr'>;
  readonly commune: Pick<Commune, 'id' | 'nameAr' | 'nameFr'>;
  readonly images: readonly PropertyImage[];
};

export interface PublicPropertyCard {
  readonly id: string;
  readonly transactionType: Property['transactionType'];
  readonly propertyType: Property['propertyType'];
  readonly condition: Property['condition'];
  readonly status: Property['status'];
  readonly accountType: Property['accountType'];
  readonly legalStatus: Property['legalStatus'];
  readonly wilaya: {readonly code: number; readonly nameAr: string; readonly nameFr: string};
  readonly commune: {readonly id: number; readonly nameAr: string; readonly nameFr: string};
  readonly neighborhood: string | null;
  readonly titleAr: string;
  readonly description: string | null;
  readonly areaM2: number | null;
  readonly rooms: number | null;
  readonly bathrooms: number | null;
  readonly floor: number | null;
  readonly totalFloors: number | null;
  readonly facades: number | null;
  readonly furnished: boolean | null;
  readonly hasParking: boolean | null;
  readonly hasElevator: boolean | null;
  readonly hasGarden: boolean | null;
  readonly askingPrice: number;
  readonly currency: string;
  readonly primaryImageUrl: string | null;
  readonly imagesCount: number;
  readonly createdAt: string;
}

/** بطاقة عقار آمنة للمشتري — بلا سِرّية ولا تواصل ولا معرفات داخلية */
export function toPublicPropertyCard(property: PropertyForBuyerView): PublicPropertyCard {
  return {
    id: property.id,
    transactionType: property.transactionType,
    propertyType: property.propertyType,
    condition: property.condition,
    status: property.status,
    accountType: property.accountType,
    legalStatus: property.legalStatus,
    wilaya: {
      code: property.wilaya.code,
      nameAr: property.wilaya.nameAr,
      nameFr: property.wilaya.nameFr
    },
    commune: {
      id: property.commune.id,
      nameAr: property.commune.nameAr,
      nameFr: property.commune.nameFr
    },
    neighborhood: property.neighborhood,
    titleAr: property.titleAr,
    description: property.description,
    areaM2: property.areaM2,
    rooms: property.rooms,
    bathrooms: property.bathrooms,
    floor: property.floor,
    totalFloors: property.totalFloors,
    facades: property.facades,
    furnished: property.furnished,
    hasParking: property.hasParking,
    hasElevator: property.hasElevator,
    hasGarden: property.hasGarden,
    askingPrice: Number(property.askingPrice),
    currency: property.currency,
    primaryImageUrl: property.images[0]?.url ?? null,
    imagesCount: property.images.length,
    createdAt: property.createdAt.toISOString()
  };
}

export type MatchStatusString = Match['status'];

export interface BuyerMatchView {
  readonly id: string;
  readonly status: MatchStatusString;
  readonly displayedScore: number;
  readonly respondBy: string | null;
  readonly sellerAgreedAt: string | null;
  readonly revealedAt: string | null;
  readonly cancelledAt: string | null;
  readonly cancelReason: string | null;
  readonly property: PublicPropertyCard;
  readonly createdAt: string;
}

/** مطابقة كما يراها المشتري — درجة عرض فقط، وبطاقة عقار عامة */
export function toBuyerMatchView(match: Match & {readonly property: PropertyForBuyerView}): BuyerMatchView {
  return {
    id: match.id,
    status: match.status,
    displayedScore: match.displayedScore,
    respondBy: match.status === 'SELLER_NOTIFIED' ? match.respondBy.toISOString() : null,
    sellerAgreedAt: match.sellerAgreedAt?.toISOString() ?? null,
    revealedAt: match.revealedAt?.toISOString() ?? null,
    cancelledAt: match.cancelledAt?.toISOString() ?? null,
    cancelReason: match.cancelReason,
    property: toPublicPropertyCard(match.property),
    createdAt: match.createdAt.toISOString()
  };
}

// ─── عرض البائع (بروفة المشتري بلا ميزانية ولا تواصل) ────────────────────────

export interface SellerMatchView {
  readonly id: string;
  readonly status: MatchStatusString;
  readonly displayedScore: number;
  /// رسم البائع نفسه — ملك له
  readonly feeSeller: number;
  readonly respondBy: string | null;
  readonly sellerAgreedAt: string | null;
  readonly revealedAt: string | null;
  /// اسم مقنَّع فقط قبل الكشف (مثال: «م. بن عيسى»)
  readonly buyerMaskedName: string;
  readonly property: {
    readonly id: string;
    readonly titleAr: string;
    readonly transactionType: Property['transactionType'];
    readonly propertyType: Property['propertyType'];
    readonly askingPrice: number;
    readonly primaryImageUrl: string | null;
  };
  readonly searchSummary: {
    readonly wilayaCode: number;
    readonly communeId: number | null;
    readonly neighborhoodsCount: number;
    readonly minAreaM2: number | null;
    readonly minRooms: number | null;
    readonly minBathrooms: number | null;
  };
  readonly createdAt: string;
}

type MatchForSellerView = Match & {
  readonly property: Property & {readonly images: readonly PropertyImage[]};
  readonly searchRequest: SearchRequest;
};

/** مطابقة كما يراها البائع — بلا maxBudget ولا هوية مشترٍ صريحة */
export function toSellerMatchView(match: MatchForSellerView, buyerName: string | null): SellerMatchView {
  return {
    id: match.id,
    status: match.status,
    displayedScore: match.displayedScore,
    feeSeller: Number(match.feeSeller),
    respondBy: match.status === 'SELLER_NOTIFIED' ? match.respondBy.toISOString() : null,
    sellerAgreedAt: match.sellerAgreedAt?.toISOString() ?? null,
    revealedAt: match.revealedAt?.toISOString() ?? null,
    buyerMaskedName: maskPersonName(buyerName),
    property: {
      id: match.property.id,
      titleAr: match.property.titleAr,
      transactionType: match.property.transactionType,
      propertyType: match.property.propertyType,
      askingPrice: Number(match.property.askingPrice),
      primaryImageUrl: match.property.images[0]?.url ?? null
    },
    searchSummary: {
      wilayaCode: match.searchRequest.wilayaCode,
      communeId: match.searchRequest.communeId,
      neighborhoodsCount: match.searchRequest.neighborhoods.length,
      minAreaM2: match.searchRequest.minAreaM2,
      minRooms: match.searchRequest.minRooms,
      minBathrooms: match.searchRequest.minBathrooms
    },
    createdAt: match.createdAt.toISOString()
  };
}

// ─── كشف التواصل (بعد CONTACT_REVEALED فقط) ─────────────────────────────────

export interface ContactRevealData {
  readonly name: string | null;
  readonly phone: string;
}

export interface ContactRevealResponse {
  readonly matchId: string;
  readonly revealedAt: string;
  /// الطرف المقابل للمستدعي (بائع⇐مشتري أو مشترٍ⇐مالك)
  readonly counterparty: ContactRevealData;
}

export function toContactReveal(
  matchId: string,
  revealedAt: Date,
  counterparty: ContactRevealData
): ContactRevealResponse {
  return {matchId, revealedAt: revealedAt.toISOString(), counterparty};
}

// ─── عرض طلب البحث (لصاحبه) ──────────────────────────────────────────────────

export interface PublicSearchRequest {
  readonly id: string;
  readonly status: SearchRequest['status'];
  readonly transactionType: SearchRequest['transactionType'];
  readonly propertyType: SearchRequest['propertyType'];
  readonly wilayaCode: number;
  readonly communeId: number | null;
  readonly neighborhoods: readonly string[];
  readonly maxBudget: number;
  readonly minAreaM2: number | null;
  readonly minRooms: number | null;
  readonly minBathrooms: number | null;
  readonly matchesCount: number;
  readonly awaitingCount: number;
  readonly createdAt: string;
}

/** طلب بحث كما يراه صاحبه (الموازنة ملكه — تظهر له فقط) */
export function toPublicSearchRequest(
  search: SearchRequest & {readonly _count: {readonly matches: number}},
  awaitingCount: number
): PublicSearchRequest {
  return {
    id: search.id,
    status: search.status,
    transactionType: search.transactionType,
    propertyType: search.propertyType,
    wilayaCode: search.wilayaCode,
    communeId: search.communeId,
    neighborhoods: search.neighborhoods,
    maxBudget: Number(search.maxBudget),
    minAreaM2: search.minAreaM2,
    minRooms: search.minRooms,
    minBathrooms: search.minBathrooms,
    matchesCount: search._count.matches,
    awaitingCount,
    createdAt: search.createdAt.toISOString()
  };
}
