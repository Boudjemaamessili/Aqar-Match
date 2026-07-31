/**
 * خدمة نشر العقارات — المنطق المشترك بين النشر الفردي والاستيراد الجماعي
 * (مصدر واحد: لا انحراف سلوكي بين المسارين، ولا تكرار منطق).
 *
 *   - resolvePublishIdentity: بمن يُربط الإعلان؟ (جلسة ⇐ حساب ⇐ مجهول)
 *   - createPropertyRecord:   ترجمة حقول العقد لأعمدة Prisma + صور متداخلة
 *
 * secretMin يمر هنا لأنه server-only — ولا تُرجع هذه الوحدة شيئاً يحمله
 * (الردود العامة تُبنى حصراً عبر serializers.ts).
 */
import {Prisma, type Property, type User} from '@prisma/client';
import {prisma} from '@/lib/prisma';
import {normalizeNeighborhood} from '@/lib/matching';
import type {AccountTypeInput} from './constants';
import type {PropertyCoreInput} from './schemas';

/** هوية النشر المحسومة: مالك الحساب المرتبط أو نشر مجهول */
export interface PublishIdentity {
  readonly sellerId: string | null;
  readonly status: 'ACTIVE' | 'UNMONITORED';
  readonly linkedUser: User | null;
}

/**
 * ترتيب الحسم (حسب المواصفة):
 *   1) جلسة نشطة           → الإعلان لصاحب الجلسة (ACTIVE)
 *   2) userPhone لحساب قائم → ربط بذلك الحساب (ACTIVE)
 *   3) غير ذلك              → نشر مجهول (UNMONITORED) وبيانات المالك على الإعلان
 * ملاحظة أمنية موثقة: الربط برقم هاتف بلا OTP يعني نظرياً إمكان إلصاق إعلان
 * بحساب غيرك؛ لا يكشف أي معلومة (الإعلان بياناته معروفة للناشر أصلاً) ويظهر
 * للضحية في لوحته — تُشدَّد لاحقاً بإشعار/مطالبة OTP (مرحلة 5/8).
 */
export async function resolvePublishIdentity(input: {
  readonly sessionUser: User | null;
  readonly userPhoneNormalized: string | null;
}): Promise<PublishIdentity> {
  if (input.sessionUser) {
    return {sellerId: input.sessionUser.id, status: 'ACTIVE', linkedUser: input.sessionUser};
  }
  if (input.userPhoneNormalized) {
    const found = await prisma.user.findUnique({
      where: {phone: input.userPhoneNormalized, deletedAt: null}
    });
    if (found) {
      return {sellerId: found.id, status: 'ACTIVE', linkedUser: found};
    }
  }
  return {sellerId: null, status: 'UNMONITORED', linkedUser: null};
}

export interface CreatePropertyExtras {
  readonly ownerName: string;
  /// الصيغة الدولية المُطبَّعة +213XXXXXXXXX (مصدرها normalizeDzPhone)
  readonly ownerPhone: string;
  readonly accountType: AccountTypeInput;
  readonly source: 'MANUAL' | 'BULK_IMPORT';
  readonly identity: PublishIdentity;
}

/** إنشاء العقار مع صوره في كتابة واحدة متداخلة (اتساق مضمون، بلا استعلام زائد) */
export async function createPropertyRecord(
  core: PropertyCoreInput,
  extras: CreatePropertyExtras
): Promise<Property> {
  const neighborhoodKey =
    core.neighborhood && core.neighborhood.trim().length > 0
      ? normalizeNeighborhood(core.neighborhood)
      : null;

  const data: Prisma.PropertyCreateInput = {
    transactionType: core.dealType,
    propertyType: core.propertyType,
    condition: core.condition ?? 'GOOD',
    status: extras.identity.status,
    source: extras.source,
    accountType: extras.accountType,
    legalStatus: core.legalStatus ?? null,
    ownerName: extras.ownerName,
    ownerPhone: extras.ownerPhone,
    ...(extras.identity.sellerId
      ? {seller: {connect: {id: extras.identity.sellerId}}}
      : {}),
    wilaya: {connect: {code: core.wilaya}},
    commune: {connect: {id: core.commune}},
    neighborhood: core.neighborhood ?? null,
    neighborhoodKey,
    titleAr: core.title,
    description: core.description ?? null,
    areaM2: core.area ?? null,
    rooms: core.rooms ?? null,
    bathrooms: core.bathrooms ?? null,
    floor: core.floor ?? null,
    totalFloors: core.floors ?? null,
    facades: core.facades ?? null,
    furnished: core.furnished ?? null,
    hasParking: core.hasParking ?? null,
    hasElevator: core.hasElevator ?? null,
    hasGarden: core.hasGarden ?? null,
    // مزايا الموسمي تُخزَّن لموسمي فقط — حماية من بيانات يتيمة المعنى
    seasonalFeatures:
      core.dealType === 'SEASONAL_RENT' && core.seasonalFeatures
        ? (core.seasonalFeatures as Prisma.InputJsonValue)
        : Prisma.JsonNull,
    askingPrice: core.price,
    secretMin: core.secretMin,
    images: {
      create: core.images.map((image, index) => ({
        url: image.url,
        mimeType: image.mimeType,
        width: image.width,
        height: image.height,
        sizeBytes: image.sizeBytes,
        isPrimary: index === 0,
        sortOrder: index
      }))
    }
  };

  return prisma.property.create({data});
}
