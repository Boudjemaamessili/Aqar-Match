/**
 * اختبارات لوحة التحكم — node:test (tsx --test).
 * الأهم: حارس انحدار أمني يضمن أن مسلسِل عقار اللوحة لا يُخرج أبداً
 * secretMin ولا ownerPhone الصريح ولا المعرفات الداخلية — حتى للمالك.
 */
import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import type {Prisma} from '@prisma/client';
import {toDashboardProperty, type DashboardPropertyRow} from './serializers';
import {emptyDashboardData} from './core';

function makeRow(overrides: Partial<DashboardPropertyRow> = {}): DashboardPropertyRow {
  const base: DashboardPropertyRow = {
    id: 'prop_1',
    sellerId: 'user_owner',
    transactionType: 'SALE',
    propertyType: 'APARTMENT',
    condition: 'GOOD',
    status: 'ACTIVE',
    source: 'MANUAL',
    accountType: 'INDIVIDUAL',
    legalStatus: 'NOTARIZED_DEED',
    ownerName: 'مالك تجريبي',
    ownerPhone: '+213612345678',
    wilayaCode: 16,
    communeId: 589,
    neighborhood: 'حيدرة',
    neighborhoodKey: 'حيدرة',
    address: 'شارع داخلي 12',
    titleAr: 'شقة F3 جميلة',
    titleFr: null,
    description: 'وصف',
    areaM2: 78,
    rooms: 3,
    bathrooms: 1,
    floor: 2,
    totalFloors: 5,
    facades: null,
    furnished: true,
    hasParking: null,
    hasElevator: null,
    hasGarden: null,
    seasonalFeatures: null,
    askingPrice: 12_500_000 as unknown as Prisma.Decimal, // Decimal زائف: المسلسِل يستدعي Number() فقط
    secretMin: 11_000_000 as unknown as Prisma.Decimal,
    currency: 'DZD',
    views: 42,
    createdAt: new Date('2026-07-10T10:00:00Z'),
    updatedAt: new Date('2026-07-12T10:00:00Z'),
    wilaya: {code: 16, nameAr: 'الجزائر', nameFr: 'Alger'},
    commune: {id: 589, nameAr: 'حيدرة', nameFr: 'Hydra'},
    images: [],
    _count: {matches: 3, images: 2}
  };
  return {...base, ...overrides};
}

describe('toDashboardProperty — الحد الأمني للوحة', () => {
  it('لا يُخرج أي حقل سري أو داخلي (حتى لمالك العقار نفسه)', () => {
    const view = toDashboardProperty(makeRow());
    const keys = Object.keys(view);
    for (const forbidden of ['secretMin', 'ownerPhone', 'sellerId', 'address', 'neighborhoodKey']) {
      assert.equal(keys.includes(forbidden), false, `الحقل الممنوع تسرّب: ${forbidden}`);
    }
    const serialized = JSON.stringify(view);
    assert.equal(serialized.includes('11000000'), false, 'قيمة secretMin تسرّبت كنص');
    assert.equal(serialized.includes('612345678'), false, 'الهاتف الصريح تسرّب');
    assert.equal(serialized.includes('شارع داخلي'), false, 'العنوان التفصيلي تسرّب');
  });

  it('يقنّع هاتف المالك ويبقي آخر رقمين للتأكيد', () => {
    const view = toDashboardProperty(makeRow());
    assert.match(view.ownerPhoneMasked ?? '', /•/);
    assert.ok(view.ownerPhoneMasked?.endsWith('78'));
    assert.equal(view.ownerPhoneMasked?.includes('1234'), false);
  });

  it('يحسب العدّادات والصورة الأولى من العلاقات', () => {
    const view = toDashboardProperty(
      makeRow({
        images: [
          {
            id: 'img_1',
            propertyId: 'prop_1',
            url: '/uploads/a.webp',
            mimeType: 'image/webp',
            width: 1600,
            height: 1200,
            sizeBytes: 50_000,
            isPrimary: true,
            sortOrder: 0,
            createdAt: new Date('2026-07-10T10:05:00Z')
          }
        ] as DashboardPropertyRow['images']
      })
    );
    assert.equal(view.primaryImageUrl, '/uploads/a.webp');
    assert.equal(view.imagesCount, 2);
    assert.equal(view.matchesCount, 3);
    assert.equal(view.views, 42);
    assert.equal(view.askingPrice, 12_500_000);
  });

  it('يتسامح مع العقود الناقصة (بلا هاتف/صور)', () => {
    const view = toDashboardProperty(makeRow({ownerPhone: null, images: []}));
    assert.equal(view.ownerPhoneMasked, null);
    assert.equal(view.primaryImageUrl, null);
  });
});

describe('emptyDashboardData — الحمولة الفارغة', () => {
  it('مصفوفات فارغة وعدّادات صفرية (عقد المرحلة 6)', () => {
    const empty = emptyDashboardData();
    assert.deepEqual(empty.properties, []);
    assert.deepEqual(empty.searches, []);
    assert.deepEqual(empty.matches, []);
    assert.deepEqual(empty.sellerMatches, []);
    assert.deepEqual(empty.summary, {
      propertiesCount: 0,
      searchesCount: 0,
      matchesCount: 0,
      pendingCount: 0
    });
  });
});
