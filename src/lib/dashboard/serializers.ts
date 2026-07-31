/**
 * مسلسِل لوحة التحكم — عقارات المالك نفسه.
 *
 * ⛔ القاعدة الذهبية لا تُكسر هنا أبداً: secretMin لا يظهر لأحد —
 *    ولا حتى لصاحبه (مبدأ «لا يغادر الخادم» مطلق بلا استثناءات).
 *    ownerPhone يبقى مقنّعاً؛ الصريح يُكشف لطرفي المطابقة فقط عبر
 *    toContactReveal بعد CONTACT_REVEALED.
 *    sellerId معرف داخلي بلا معنى — لا يخرج.
 */
import type {Prisma} from '@prisma/client';
import {maskDzPhone} from '@/lib/auth/phone';

/** صف العقار مع علاقاته كما تجلبه خدمة اللوحة (استعلام واحد — لا N+1) */
export type DashboardPropertyRow = Prisma.PropertyGetPayload<{
  include: {
    wilaya: {select: {code: true; nameAr: true; nameFr: true}};
    commune: {select: {id: true; nameAr: true; nameFr: true}};
    images: true;
    _count: {select: {matches: true; images: true}};
  };
}>;

export interface DashboardProperty {
  readonly id: string;
  readonly transactionType: DashboardPropertyRow['transactionType'];
  readonly propertyType: DashboardPropertyRow['propertyType'];
  readonly condition: DashboardPropertyRow['condition'];
  readonly status: DashboardPropertyRow['status'];
  readonly accountType: DashboardPropertyRow['accountType'];
  readonly wilaya: {readonly code: number; readonly nameAr: string; readonly nameFr: string};
  readonly commune: {readonly id: number; readonly nameAr: string; readonly nameFr: string};
  readonly neighborhood: string | null;
  readonly titleAr: string;
  readonly areaM2: number | null;
  readonly rooms: number | null;
  readonly askingPrice: number;
  readonly currency: string;
  readonly views: number;
  readonly matchesCount: number;
  readonly imagesCount: number;
  readonly primaryImageUrl: string | null;
  /// مقنَّع دائماً (+213 6•• •• •• 78) — يسمح للمالك بتأكيد رقمه دون كشفه كاملاً
  readonly ownerPhoneMasked: string | null;
  readonly createdAt: string;
}

export function toDashboardProperty(row: DashboardPropertyRow): DashboardProperty {
  return {
    id: row.id,
    transactionType: row.transactionType,
    propertyType: row.propertyType,
    condition: row.condition,
    status: row.status,
    accountType: row.accountType,
    wilaya: {code: row.wilaya.code, nameAr: row.wilaya.nameAr, nameFr: row.wilaya.nameFr},
    commune: {id: row.commune.id, nameAr: row.commune.nameAr, nameFr: row.commune.nameFr},
    neighborhood: row.neighborhood,
    titleAr: row.titleAr,
    areaM2: row.areaM2,
    rooms: row.rooms,
    askingPrice: Number(row.askingPrice),
    currency: row.currency,
    views: row.views,
    matchesCount: row._count.matches,
    imagesCount: row._count.images,
    primaryImageUrl: row.images[0]?.url ?? null,
    ownerPhoneMasked: row.ownerPhone ? maskDzPhone(row.ownerPhone) : null,
    createdAt: row.createdAt.toISOString()
  };
}
