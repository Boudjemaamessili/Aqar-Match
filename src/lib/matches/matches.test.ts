/**
 * اختبارات منطق البحث والمطابقة النقي — node:test (tsx --test)
 * آلة الحالات + مخطط البحث + إخفاء الأسماء + ترجمة حالة العقار للمحرك.
 */
import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import {RESPONSE_DEADLINE_HOURS, computeRespondBy} from '@/lib/matching';
import {
  matchesInboxQuerySchema,
  notificationsMarkReadSchema,
  searchCreateSchema
} from './schemas';
import {maskPersonName} from './serializers';
import {
  canTransition,
  checkAgreeEligibility,
  isCancellable,
  isOverdue,
  isTerminal,
  type MatchFlowStatus
} from './transitions';

const ALL_STATUSES: readonly MatchFlowStatus[] = [
  'SELLER_NOTIFIED',
  'SELLER_AGREED',
  'BUYER_PAID',
  'CONTACT_REVEALED',
  'EXPIRED',
  'CANCELLED'
];

describe('آلة حالات المطابقة الصارمة', () => {
  it('تسمح بالسلسلة النظامية فقط', () => {
    assert.equal(canTransition('SELLER_NOTIFIED', 'SELLER_AGREED'), true);
    assert.equal(canTransition('SELLER_AGREED', 'BUYER_PAID'), true);
    assert.equal(canTransition('BUYER_PAID', 'CONTACT_REVEALED'), true);
  });

  it('ترفض أي قفزة أو رجوع', () => {
    assert.equal(canTransition('SELLER_NOTIFIED', 'CONTACT_REVEALED'), false);
    assert.equal(canTransition('SELLER_NOTIFIED', 'BUYER_PAID'), false);
    assert.equal(canTransition('BUYER_PAID', 'SELLER_AGREED'), false);
    assert.equal(canTransition('CONTACT_REVEALED', 'CANCELLED'), false);
    assert.equal(canTransition('EXPIRED', 'SELLER_NOTIFIED'), false);
    assert.equal(canTransition('CANCELLED', 'SELLER_NOTIFIED'), false);
  });

  it('الحالات النهائية مغلقة تماماً', () => {
    assert.equal(isTerminal('CONTACT_REVEALED'), true);
    assert.equal(isTerminal('EXPIRED'), true);
    assert.equal(isTerminal('CANCELLED'), true);
    assert.equal(isTerminal('SELLER_NOTIFIED'), false);
    for (const terminal of ['CONTACT_REVEALED', 'EXPIRED', 'CANCELLED'] as const) {
      for (const target of ALL_STATUSES) {
        assert.equal(canTransition(terminal, target), false);
      }
    }
  });

  it('الإلغاء ممكن قبل الكشف فقط', () => {
    assert.equal(isCancellable('SELLER_NOTIFIED'), true);
    assert.equal(isCancellable('SELLER_AGREED'), true);
    assert.equal(isCancellable('BUYER_PAID'), false);
    assert.equal(isCancellable('CONTACT_REVEALED'), false);
    assert.equal(isCancellable('EXPIRED'), false);
    assert.equal(isCancellable('CANCELLED'), false);
  });

  it('مهلة الـ 48 ساعة تُحسب وتُفحص بدقة', () => {
    const base = new Date('2026-07-30T10:00:00Z');
    const respondBy = computeRespondBy(base);
    assert.equal(respondBy.getTime() - base.getTime(), RESPONSE_DEADLINE_HOURS * 3_600_000);

    const beforeDeadline = new Date(respondBy.getTime() - 1000);
    const afterDeadline = new Date(respondBy.getTime() + 1);
    assert.equal(isOverdue(respondBy, beforeDeadline), false);
    assert.equal(isOverdue(respondBy, afterDeadline), true);

    assert.equal(checkAgreeEligibility('SELLER_NOTIFIED', respondBy, beforeDeadline), 'ok');
    assert.equal(checkAgreeEligibility('SELLER_NOTIFIED', respondBy, afterDeadline), 'expired');
    assert.equal(checkAgreeEligibility('CONTACT_REVEALED', respondBy, beforeDeadline), 'not_awaiting_seller');
    assert.equal(checkAgreeEligibility('CANCELLED', respondBy, beforeDeadline), 'not_awaiting_seller');
  });
});

describe('مخطط طلب البحث', () => {
  const VALID = {
    dealType: 'SALE',
    propertyType: 'APARTMENT',
    wilaya: 16,
    commune: 589,
    neighborhoods: ['حيدرة العليا'],
    maxBudget: 25_000_000,
    minAreaM2: 80,
    minRooms: 3
  };

  it('يقبل طلباً سليماً (بلدية اختيارية)', () => {
    assert.equal(searchCreateSchema.safeParse(VALID).success, true);
    const noCommune = {...VALID} as Record<string, unknown>;
    delete noCommune.commune;
    assert.equal(searchCreateSchema.safeParse(noCommune).success, true);
  });

  it('يرفض نوعاً غير مسموح وميزانية دون الأرضية العلنية', () => {
    const badType = searchCreateSchema.safeParse({...VALID, propertyType: 'LAND', dealType: 'RENT'});
    assert.equal(badType.success, false);
    if (!badType.success) {
      assert.ok(badType.error.issues.some((i) => i.message === 'TYPE_NOT_ALLOWED'));
    }

    const lowBudget = searchCreateSchema.safeParse({...VALID, maxBudget: 1_000_000});
    assert.equal(lowBudget.success, false);
    if (!lowBudget.success) {
      assert.ok(lowBudget.error.issues.some((i) => i.message === 'BUDGET_BELOW_FLOOR'));
    }
    // الأرضية تتغير بنوع المعاملة: إيجار بـ 25.000 مقبول
    const rentOk = {...VALID, dealType: 'RENT', maxBudget: 25_000};
    assert.equal(searchCreateSchema.safeParse(rentOk).success, true);
  });

  it('يرفض بلدية خارج ولايتها وولاية غير نشطة', () => {
    const mismatch = searchCreateSchema.safeParse({...VALID, wilaya: 31});
    assert.equal(mismatch.success, false);
    if (!mismatch.success) {
      assert.ok(mismatch.error.issues.some((i) => i.message === 'COMMUNE_WILAYA_MISMATCH'));
    }
    assert.equal(searchCreateSchema.safeParse({...VALID, wilaya: 48}).success, false);
  });

  it('يحدّ الأحياء بخمسة ويصفّر الافتراضي', () => {
    const tooMany = searchCreateSchema.safeParse({...VALID, neighborhoods: ['1', '2', '3', '4', '5', '6']});
    assert.equal(tooMany.success, false);
    const noCommune: Record<string, unknown> = {...VALID};
    delete noCommune.commune;
    delete noCommune.neighborhoods;
    const parsed = searchCreateSchema.safeParse(noCommune);
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.deepEqual(parsed.data.neighborhoods, []);
    }
  });

  it('يرفض حقولاً غريبة وقيم ميزانية شاذة', () => {
    assert.equal(searchCreateSchema.safeParse({...VALID, sneaky: 1}).success, false);
    assert.equal(searchCreateSchema.safeParse({...VALID, maxBudget: 0}).success, false);
    assert.equal(searchCreateSchema.safeParse({...VALID, maxBudget: 10.5}).success, false);
  });
});

describe('إخفاء هوية الأطراف قبل الكشف', () => {
  it('يقنّع الاسم الأول ويبقي الباقي', () => {
    assert.equal(maskPersonName('محمد بن عيسى'), 'م. بن عيسى');
    assert.equal(maskPersonName('سمية'), 'س.');
    assert.equal(maskPersonName('  '),'•');
    assert.equal(maskPersonName(null), '•');
    assert.equal(maskPersonName('Jean-Pierre Dupont'), 'J. Dupont');
  });
});

describe('مخططات المرحلة 8: معاملات الاستعلام وتمييز الإشعارات', () => {
  it('معامل role: افتراضي buyer، يقبل seller فقط ويرفض ما عداه بصرامة', () => {
    assert.equal(matchesInboxQuerySchema.parse({}).role, 'buyer');
    assert.equal(matchesInboxQuerySchema.parse({role: 'seller'}).role, 'seller');
    assert.equal(matchesInboxQuerySchema.safeParse({role: 'admin'}).success, false);
    assert.equal(matchesInboxQuerySchema.safeParse({role: 'BUYER'}).success, false);
    assert.equal(matchesInboxQuerySchema.safeParse({role: 'buyer', sneaky: '1'}).success, false);
  });

  it('تمييز الإشعارات: جسم فارغ أو معرفات حتى السقف، ويرفض الغريب والفائض', () => {
    assert.equal(notificationsMarkReadSchema.parse({}).ids, undefined);
    assert.deepEqual(notificationsMarkReadSchema.parse({ids: ['a1', 'b2']}).ids, ['a1', 'b2']);
    assert.equal(notificationsMarkReadSchema.parse({ids: []}).ids?.length, 0);
    assert.equal(notificationsMarkReadSchema.safeParse({ids: Array(51).fill('x')}).success, false);
    assert.equal(notificationsMarkReadSchema.safeParse({ids: ['']}).success, false);
    assert.equal(notificationsMarkReadSchema.safeParse({all: true}).success, false);
  });
});
