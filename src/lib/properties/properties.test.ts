/**
 * اختبارات الوحدات النقية لنشر العقارات — node:test (tsx --test)
 * التطبيع (تسميات/ولايات/بلديات/أرقام) + مخططات Zod (القواعد المشتركة)
 * + مفتاح كشف التكرار. المسارات المعتمدة على DB تُختبر تكاملياً لاحقاً.
 */
import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import {SECRET_MIN_ABSOLUTE_FLOOR} from '@/lib/matching';
import {UPLOAD_MAX_BYTES} from '@/lib/uploads/constants';
import {
  buildCoreInputFromBulkRow,
  listingDuplicateKey,
  normalizeConditionLabel,
  normalizeDealTypeLabel,
  normalizeLegalStatusLabel,
  normalizePropertyTypeLabel,
  parseAmountNumber,
  resolveCommuneInput,
  resolveWilayaInput
} from './normalize';
import {imageInputSchema, propertyCoreSchema, propertyCreateSchema} from './schemas';

// مدخل نواة صالح يُبنى عليه في اختبارات الرفض (قاعدة DRY)
const VALID_CORE = {
  dealType: 'SALE',
  propertyType: 'APARTMENT',
  wilaya: 16,
  commune: 589, // حيدرة — الجزائر
  title: 'شقة F3 راقية بحيدرة',
  neighborhood: 'حيدرة العليا',
  area: 85,
  rooms: 3,
  bathrooms: 1,
  price: 25_000_000,
  secretMin: 22_000_000,
  images: []
} as const;

describe('تطبيع تسميات الاستيراد الجماعي', () => {
  it('يطبّع أنواع المعاملات عربي/فرنسي/إنجليزي', () => {
    assert.equal(normalizeDealTypeLabel('بيع'), 'SALE');
    assert.equal(normalizeDealTypeLabel('vente'), 'SALE');
    assert.equal(normalizeDealTypeLabel('إيجار'), 'RENT');
    assert.equal(normalizeDealTypeLabel('كراء'), 'RENT');
    assert.equal(normalizeDealTypeLabel('Location'), 'RENT');
    assert.equal(normalizeDealTypeLabel('إيجار موسمي'), 'SEASONAL_RENT');
    assert.equal(normalizeDealTypeLabel('كراء موسمي'), 'SEASONAL_RENT');
    assert.equal(normalizeDealTypeLabel('Location Saisonnière'), 'SEASONAL_RENT');
    assert.equal(normalizeDealTypeLabel('موسمي'), 'SEASONAL_RENT');
  });

  it('لا يلتبس بين «كراء» و«كراء موسمي» (مطابقة تامة لا بادئات)', () => {
    assert.equal(normalizeDealTypeLabel('كراء'), 'RENT');
    assert.equal(normalizeDealTypeLabel('كراء موسمي'), 'SEASONAL_RENT');
  });

  it('يطبّع أنواع العقارات بكل الألبسة', () => {
    assert.equal(normalizePropertyTypeLabel('شقة'), 'APARTMENT');
    assert.equal(normalizePropertyTypeLabel('Appartement'), 'APARTMENT');
    assert.equal(normalizePropertyTypeLabel('منزل'), 'HOUSE');
    assert.equal(normalizePropertyTypeLabel('maison'), 'HOUSE');
    assert.equal(normalizePropertyTypeLabel('فيلا'), 'VILLA');
    assert.equal(normalizePropertyTypeLabel('أرض'), 'LAND');
    assert.equal(normalizePropertyTypeLabel('قطعة أرض'), 'LAND');
    assert.equal(normalizePropertyTypeLabel('terrain'), 'LAND');
    assert.equal(normalizePropertyTypeLabel('محل تجاري'), 'COMMERCIAL');
    assert.equal(normalizePropertyTypeLabel('مكتب'), 'OFFICE');
    assert.equal(normalizePropertyTypeLabel('Bureau'), 'OFFICE');
    assert.equal(normalizePropertyTypeLabel('ستوديو'), 'STUDIO');
    assert.equal(normalizePropertyTypeLabel('استوديو'), 'STUDIO');
  });

  it('يرفض التسميات المجهولة برزانه (null لا تخمين)', () => {
    assert.equal(normalizeDealTypeLabel('رهن'), null);
    assert.equal(normalizePropertyTypeLabel('قصر'), null);
    assert.equal(normalizePropertyTypeLabel(''), null);
  });

  it('يطبّع الوضعية القانونية وحالة العقار', () => {
    assert.equal(normalizeLegalStatusLabel('عقد موثق'), 'NOTARIZED_DEED');
    assert.equal(normalizeLegalStatusLabel('دفتر عقاري'), 'LAND_TITLE');
    assert.equal(normalizeLegalStatusLabel('وعد بالبيع'), 'PROMISE_OF_SALE');
    assert.equal(normalizeLegalStatusLabel('عرفي'), 'PRIVATE_AGREEMENT');
    assert.equal(normalizeLegalStatusLabel('غير معروف'), null);
    assert.equal(normalizeConditionLabel('جديد'), 'NEW');
    assert.equal(normalizeConditionLabel('قيد الإنجاز'), 'UNDER_CONSTRUCTION');
    assert.equal(normalizeConditionLabel('rénové'), 'RENOVATED');
  });
});

describe('تفسير الأرقام والجغرافيا من الجداول', () => {
  it('يفهم فواصل الآلاف والفاصلة الفرنسية', () => {
    assert.equal(parseAmountNumber('12 000 000'), 12_000_000);
    assert.equal(parseAmountNumber('120,5'), 120.5);
    assert.equal(parseAmountNumber(16), 16);
    assert.equal(parseAmountNumber('abc'), null);
    assert.equal(parseAmountNumber(''), null);
  });

  it('يحسم الولاية برقمها أو اسمها أو slug', () => {
    assert.equal(resolveWilayaInput(16), 16);
    assert.equal(resolveWilayaInput('16'), 16);
    assert.equal(resolveWilayaInput('09'), 9);
    assert.equal(resolveWilayaInput('الجزائر'), 16);
    assert.equal(resolveWilayaInput('Oran'), 31);
    assert.equal(resolveWilayaInput('oran'), 31);
    assert.equal(resolveWilayaInput('setif'), 19);
    assert.equal(resolveWilayaInput('وهران'), 31);
  });

  it('يرفض ولايات خارج النطاق السبع', () => {
    assert.equal(resolveWilayaInput('باتنة'), null);
    assert.equal(resolveWilayaInput(48), null);
    assert.equal(resolveWilayaInput('99'), null);
  });

  it('يحسم البلدية بمعرفها أو اسمها داخل ولايتها', () => {
    assert.equal(resolveCommuneInput(16, 589), 589); // حيدرة
    assert.equal(resolveCommuneInput(16, '589'), 589);
    assert.equal(resolveCommuneInput(16, 'حيدرة'), 589);
    assert.equal(resolveCommuneInput(16, 'Hydra'), 589);
    assert.equal(resolveCommuneInput(16, 'بوزريعة'), 571);
    assert.equal(resolveCommuneInput(31, 'بئر الجير'), 1116);
  });

  it('يرفض بلدية صحيحة الاسم لكن في ولاية أخرى', () => {
    // حيدرة في الجزائر (16) — يجب أن تُرفض تحت وهران (31)
    assert.equal(resolveCommuneInput(31, 'حيدرة'), null);
    assert.equal(resolveCommuneInput(31, 589), null);
    assert.equal(resolveCommuneInput(16, 'بئر الجير'), null);
  });
});

describe('بناء مدخل النواة من صف خام', () => {
  const RAW_OK = {
    dealType: 'بيع',
    propertyType: 'شقة',
    wilaya: '16',
    commune: 'حيدرة',
    title: 'شقة F3 بحيدرة',
    area: '85',
    rooms: '3',
    price: '25 000 000',
    secretMin: '22 000 000',
    images: []
  };

  it('يبني مدخلاً نظيفاً من تسميات عربية خام', () => {
    const result = buildCoreInputFromBulkRow(RAW_OK);
    assert.equal(result.ok, true);
    if (result.ok) {
      const parsed = propertyCoreSchema.safeParse(result.input);
      assert.equal(parsed.success, true);
      if (parsed.success) {
        assert.equal(parsed.data.dealType, 'SALE');
        assert.equal(parsed.data.commune, 589);
        assert.equal(parsed.data.price, 25_000_000);
      }
    }
  });

  it('جمّع إخفاقات التسميات المجهولة بحقولها', () => {
    const result = buildCoreInputFromBulkRow({...RAW_OK, dealType: '???', commune: 'لايوجد'});
    assert.equal(result.ok, false);
    if (!result.ok) {
      const reasons = result.failures.map((f) => f.reason);
      assert.ok(reasons.includes('UNKNOWN_DEAL_TYPE'));
      assert.ok(reasons.includes('UNKNOWN_COMMUNE'));
    }
  });

  it('يبلّغ عن رقم غير قابل للتفسير بحقله', () => {
    const result = buildCoreInputFromBulkRow({...RAW_OK, price: 'اتصل بنا'});
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.deepEqual(result.failures, [{field: 'price', reason: 'INVALID_NUMBER'}]);
    }
  });
});

describe('مخطط النواة — قواعد العمل عبر matching.ts', () => {
  it('يقبل عقاراً سليماً كاملاً', () => {
    const parsed = propertyCoreSchema.safeParse(VALID_CORE);
    assert.equal(parsed.success, true);
  });

  it('يرفض secretMin تحت الحد المطلق للمعاملة', () => {
    const parsed = propertyCoreSchema.safeParse({...VALID_CORE, secretMin: 1_000_000});
    assert.equal(parsed.success, false);
    if (!parsed.success) {
      assert.ok(parsed.error.issues.some((i) => i.message === 'SECRET_MIN_BELOW_FLOOR'));
    }
  });

  it('يطبّق أرضية مختلفة لكل نوع معاملة', () => {
    const rentBase = {
      ...VALID_CORE,
      dealType: 'RENT',
      propertyType: 'APARTMENT',
      price: 80_000,
      secretMin: 60_000
    };
    assert.equal(propertyCoreSchema.safeParse(rentBase).success, true);
    // حد الإيجار 20.000 — بيع بـ 60.000 مرفوض لكن إيجار مقبول
    assert.equal(SECRET_MIN_ABSOLUTE_FLOOR.RENT, 20_000);
    const tooLow = propertyCoreSchema.safeParse({...rentBase, price: 30_000, secretMin: 10_000});
    assert.equal(tooLow.success, false);
  });

  it('يرفض سعراً مطلوباً دون السرّي', () => {
    const parsed = propertyCoreSchema.safeParse({...VALID_CORE, price: 20_000_000, secretMin: 22_000_000});
    assert.equal(parsed.success, false);
    if (!parsed.success) {
      assert.ok(parsed.error.issues.some((i) => i.message === 'PRICE_BELOW_SECRET_MIN'));
    }
  });

  it('يرفض نوع عقار غير مسموح لمعاملته (أرض للكراء الموسمي)', () => {
    const parsed = propertyCoreSchema.safeParse({
      ...VALID_CORE,
      dealType: 'SEASONAL_RENT',
      propertyType: 'LAND'
    });
    assert.equal(parsed.success, false);
    if (!parsed.success) {
      assert.ok(parsed.error.issues.some((i) => i.message === 'TYPE_NOT_ALLOWED'));
    }
  });

  it('يرفض بلدية خارج ولايتها (تناقض جغرافي)', () => {
    const parsed = propertyCoreSchema.safeParse({...VALID_CORE, wilaya: 31}); // 589 حيدرة ∉ وهران
    assert.equal(parsed.success, false);
    if (!parsed.success) {
      assert.ok(parsed.error.issues.some((i) => i.message === 'COMMUNE_WILAYA_MISMATCH'));
    }
  });

  it('يرفض ولاية غير نشطة وبلدية مجهولة', () => {
    assert.equal(propertyCoreSchema.safeParse({...VALID_CORE, wilaya: 48}).success, false);
    const unknownCommune = propertyCoreSchema.safeParse({...VALID_CORE, commune: 999999});
    assert.equal(unknownCommune.success, false);
    if (!unknownCommune.success) {
      assert.ok(unknownCommune.error.issues.some((i) => i.message === 'INVALID_COMMUNE'));
    }
  });

  it('يحدّ الصور بعشرٍ ويفرض نمط URL الخاص بنا فقط', () => {
    const image = {
      url: '/uploads/123e4567-e89b-42d3-a456-426614174000.webp',
      mimeType: 'image/webp',
      width: 1200,
      height: 900,
      sizeBytes: 100_000
    };
    assert.equal(imageInputSchema.safeParse(image).success, true);

    const foreign = imageInputSchema.safeParse({...image, url: 'https://evil.example/x.webp'});
    assert.equal(foreign.success, false);

    const traversal = imageInputSchema.safeParse({...image, url: '/uploads/../../etc/passwd'});
    assert.equal(traversal.success, false);

    const many = Array.from({length: 11}, () => image);
    const core = propertyCoreSchema.safeParse({...VALID_CORE, images: many});
    assert.equal(core.success, false);

    const overWeight = imageInputSchema.safeParse({...image, sizeBytes: UPLOAD_MAX_BYTES + 1});
    assert.equal(overWeight.success, false);
  });

  it('يفرض هيكل مزايا الموسمي بصرامة', () => {
    const badCapacity = propertyCoreSchema.safeParse({
      ...VALID_CORE,
      dealType: 'SEASONAL_RENT',
      propertyType: 'APARTMENT',
      price: 150_000,
      secretMin: 100_000,
      seasonalFeatures: {capacity: 0}
    });
    assert.equal(badCapacity.success, false);

    const okSeasonal = propertyCoreSchema.safeParse({
      ...VALID_CORE,
      dealType: 'SEASONAL_RENT',
      propertyType: 'APARTMENT',
      price: 150_000,
      secretMin: 100_000,
      seasonalFeatures: {capacity: 6, distanceToBeachM: 300, airConditioning: true, seaView: true}
    });
    assert.equal(okSeasonal.success, true);
  });

  it('مخطط النشر الفردي يشترط بيانات المالك ويرفض حقولاً غريبة', () => {
    const base = {
      ...VALID_CORE,
      accountType: 'INDIVIDUAL',
      ownerName: 'محمد بن عيسى',
      ownerPhone: '0550 11 22 33'
    };
    assert.equal(propertyCreateSchema.safeParse(base).success, true);
    assert.equal(propertyCreateSchema.safeParse({...base, ownerName: 'م'}).success, false);
    assert.equal(propertyCreateSchema.safeParse({...base, hackerField: 1}).success, false);
  });
});

describe('كشف تكرار الإعلانات', () => {
  it('يتجاهل اختلافات اللبوس في العنوان ويثبت على (بلدية، عنوان، سعر)', () => {
    const a = listingDuplicateKey(589, 'شقة F3 راقية', 25_000_000);
    const b = listingDuplicateKey(589, '  شقة   f3 راقية ', 25_000_000);
    assert.equal(a, b);
    assert.notEqual(a, listingDuplicateKey(589, 'شقة F3 راقية', 25_500_000));
    assert.notEqual(a, listingDuplicateKey(571, 'شقة F3 راقية', 25_000_000));
  });
});
