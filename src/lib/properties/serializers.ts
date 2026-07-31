/**
 * مسلسِلات خروج العقارات — الحد الأمني الأهم في المرحلة 4.
 *
 * ⛔ قاعدة ذهبية: لا تُسنَد كائناً خاماً من Prisma للعميل أبداً.
 *    الحقول التالية ممنوعة هنا منعاً باتاً وتُنتَقى الحقول يدوياً فقط:
 *      - secretMin       (الحد الأدنى السري — جوهر النموذج التجاري)
 *      - ownerPhone      (يُكشف فقط بعد اكتمال المطابقة والدفع — يُقنَّع هنا)
 *      - sellerId        (معرف داخلي بلا معنى خارجي)
 */
import type {Commune, Prisma, Property, PropertyImage, Wilaya} from '@prisma/client';
import {maskDzPhone} from '@/lib/auth/phone';

type PropertyWithRelations = Property & {
  readonly wilaya: Pick<Wilaya, 'code' | 'nameAr' | 'nameFr'>;
  readonly commune: Pick<Commune, 'id' | 'nameAr' | 'nameFr'>;
  readonly images: readonly PropertyImage[];
};

export interface PublicPropertyImage {
  readonly url: string;
  readonly width: number;
  readonly height: number;
  readonly sizeBytes: number;
  readonly isPrimary: boolean;
  readonly sortOrder: number;
}

/** عنصر قائمة آمن للعرض الإداري — بلا أي حقل سري */
export interface PublicPropertyListItem {
  readonly id: string;
  readonly transactionType: Property['transactionType'];
  readonly propertyType: Property['propertyType'];
  readonly condition: Property['condition'];
  readonly status: Property['status'];
  readonly source: Property['source'];
  readonly accountType: Property['accountType'];
  readonly legalStatus: Property['legalStatus'];
  readonly wilaya: {readonly code: number; readonly nameAr: string; readonly nameFr: string};
  readonly commune: {readonly id: number; readonly nameAr: string; readonly nameFr: string};
  readonly neighborhood: string | null;
  readonly titleAr: string;
  readonly titleFr: string | null;
  readonly description: string | null;
  readonly areaM2: number | null;
  readonly rooms: number | null;
  readonly bathrooms: number | null;
  readonly floor: number | null;
  readonly totalFloors: number | null;
  readonly facades: number | null;
  readonly hasParking: boolean | null;
  readonly hasElevator: boolean | null;
  readonly furnished: boolean | null;
  readonly hasGarden: boolean | null;
  readonly seasonalFeatures: Prisma.JsonValue | null;
  readonly askingPrice: number;
  readonly currency: string;
  readonly views: number;
  readonly imagesCount: number;
  readonly images: readonly PublicPropertyImage[];
  readonly ownerName: string | null;
  /// مقنَّع دائماً (+213 6•• •• •• 78) — الصريح لا يغادر الخادم قبل كشف التواصل
  readonly ownerPhoneMasked: string | null;
  /// هل الإعلان مرتبط بحساب (مراقَب) أم مجهول (UNMONITORED)
  readonly linkedToAccount: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

function toPublicImage(image: PropertyImage): PublicPropertyImage {
  return {
    url: image.url,
    width: image.width,
    height: image.height,
    sizeBytes: image.sizeBytes,
    isPrimary: image.isPrimary,
    sortOrder: image.sortOrder
  };
}

export function toPublicPropertyListItem(property: PropertyWithRelations): PublicPropertyListItem {
  return {
    id: property.id,
    transactionType: property.transactionType,
    propertyType: property.propertyType,
    condition: property.condition,
    status: property.status,
    source: property.source,
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
    titleFr: property.titleFr,
    description: property.description,
    areaM2: property.areaM2,
    rooms: property.rooms,
    bathrooms: property.bathrooms,
    floor: property.floor,
    totalFloors: property.totalFloors,
    facades: property.facades,
    hasParking: property.hasParking,
    hasElevator: property.hasElevator,
    furnished: property.furnished,
    hasGarden: property.hasGarden,
    seasonalFeatures: property.seasonalFeatures,
    askingPrice: Number(property.askingPrice),
    currency: property.currency,
    views: property.views,
    imagesCount: property.images.length,
    images: property.images.map(toPublicImage),
    ownerName: property.ownerName,
    ownerPhoneMasked: property.ownerPhone ? maskDzPhone(property.ownerPhone) : null,
    linkedToAccount: property.sellerId !== null,
    createdAt: property.createdAt.toISOString(),
    updatedAt: property.updatedAt.toISOString()
  };
}

/** إيصال ما بعد النشر — يُعرض على الناشر نفسه (رسومه على إعلانه هو) */
export interface PublishReceipt {
  readonly id: string;
  readonly status: Property['status'];
  readonly fee: number;
  readonly currency: string;
  readonly askingPrice: number;
  readonly imagesCount: number;
  readonly publishedAt: string;
}

export function toPublishReceipt(
  property: Pick<Property, 'id' | 'status' | 'currency' | 'askingPrice' | 'createdAt'>,
  fee: number,
  imagesCount: number
): PublishReceipt {
  return {
    id: property.id,
    status: property.status,
    fee,
    currency: property.currency,
    askingPrice: Number(property.askingPrice),
    imagesCount,
    publishedAt: property.createdAt.toISOString()
  };
}
