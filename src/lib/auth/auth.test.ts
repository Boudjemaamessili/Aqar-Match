/**
 * اختبارات الوحدات النقية للمصادقة — node:test (tsx --test)
 * هاتف + OTP + رموز جلسة + محدد المعدل. (الوحدات المعتمدة على DB تُختبر تكاملياً لاحقاً)
 */
import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import {generateOtpCode, getOtpPepper, hashOtpCode, verifyOtpHash} from './otp';
import {formatDzPhone, maskDzPhone, normalizeDzPhone} from './phone';
import {hitRateLimit, secondsUntilReset} from './rate-limit';
import {generateSessionToken, hashIp, hashSessionToken} from './tokens';

describe('تطبيع الهاتف الجزائري', () => {
  it('يقبل الصيغ المحلية والدولية المكافئة', () => {
    const expected = '+213612345678';
    assert.deepEqual(normalizeDzPhone('0612345678'), {ok: true, phone: expected});
    assert.deepEqual(normalizeDzPhone('612345678'), {ok: true, phone: expected});
    assert.deepEqual(normalizeDzPhone('+213612345678'), {ok: true, phone: expected});
    assert.deepEqual(normalizeDzPhone('00213612345678'), {ok: true, phone: expected});
    assert.deepEqual(normalizeDzPhone('213612345678'), {ok: true, phone: expected});
  });

  it('يتجاهل الفواصل البصرية (مسافات/نقاط/شرطات/أقواس)', () => {
    const expected = '+213550112233';
    assert.deepEqual(normalizeDzPhone('05 50 11 22 33'), {ok: true, phone: expected});
    assert.deepEqual(normalizeDzPhone('05.50.11.22.33'), {ok: true, phone: expected});
    assert.deepEqual(normalizeDzPhone('(05) 50-11-22-33'), {ok: true, phone: expected});
  });

  it('يقبل بادئات الموبايل 5/6/7 فقط', () => {
    assert.equal(normalizeDzPhone('0550112233').ok, true);
    assert.equal(normalizeDzPhone('0650112233').ok, true);
    assert.equal(normalizeDzPhone('0750112233').ok, true);
    // نواة من 9 أرقام تبدأ بغير 5/6/7 (ثابت/مشغّل خاص) — not_mobile
    const fixedCore = normalizeDzPhone('212345678');
    assert.equal(fixedCore.ok, false);
    if (!fixedCore.ok) assert.equal(fixedCore.reason, 'not_mobile');
    // خط ثابت جزائري بالصيغة المحلية (0 + 8 أرقام) — طول غير صالح
    const fixedLocal = normalizeDzPhone('021234567');
    assert.equal(fixedLocal.ok, false);
    if (!fixedLocal.ok) assert.equal(fixedLocal.reason, 'invalid_length');
  });

  it('يرفض: فارغ، حروف، طول خاطئ، أرقام أجنبية', () => {
    assert.deepEqual(normalizeDzPhone('   '), {ok: false, reason: 'empty'});
    assert.deepEqual(normalizeDzPhone('06abcde678'), {ok: false, reason: 'invalid_chars'});
    assert.deepEqual(normalizeDzPhone('06123'), {ok: false, reason: 'invalid_length'});
    // أجنبي: لا يبدأ بـ 213 ولا يطابق الطول المحلي — invalid_length
    const foreign = normalizeDzPhone('+33612345678');
    assert.equal(foreign.ok, false);
    if (!foreign.ok) assert.equal(foreign.reason, 'invalid_length');
  });

  it('التنسيق والإخفاء للعرض', () => {
    assert.equal(formatDzPhone('0612345678'), '+213 612 34 56 78');
    assert.equal(maskDzPhone('0612345678'), '+213 6•• •• •• 78');
    assert.equal(maskDzPhone('رقم تالف'), '•••');
  });
});

describe('OTP — توليد وتوقيع', () => {
  it('رمز من 6 أرقام دائماً (مع الأصفار البادئة)', () => {
    for (let i = 0; i < 200; i += 1) {
      const code = generateOtpCode();
      assert.match(code, /^\d{6}$/);
    }
  });

  it('التوقيع حتمي لنفس (هاتف، رمز، مفتاح)', () => {
    const a = hashOtpCode('+213612345678', '123456', 'pepper-1');
    const b = hashOtpCode('+213612345678', '123456', 'pepper-1');
    assert.equal(a, b);
    assert.match(a, /^[0-9a-f]{64}$/);
  });

  it('يتغير بتغيير الهاتف أو الرمز أو المفتاح (عزل ارتباط كامل)', () => {
    const base = hashOtpCode('+213612345678', '123456', 'pepper-1');
    assert.notEqual(hashOtpCode('+213612345679', '123456', 'pepper-1'), base);
    assert.notEqual(hashOtpCode('+213612345678', '123457', 'pepper-1'), base);
    assert.notEqual(hashOtpCode('+213612345678', '123456', 'pepper-2'), base);
  });

  it('verifyOtpHash: صحيح/خاطئ/اختلاف طول بلا استثناء', () => {
    const good = hashOtpCode('+213612345678', '999999', getOtpPepper());
    assert.equal(verifyOtpHash(good, hashOtpCode('+213612345678', '999999', getOtpPepper())), true);
    assert.equal(verifyOtpHash(good, hashOtpCode('+213612345678', '111111', getOtpPepper())), false);
    assert.equal(verifyOtpHash(good, 'abcd'), false);
    assert.equal(verifyOtpHash('', ''), false);
  });

  it('getOtpPepper يرجع مفتاح التطوير خارج الإنتاج', () => {
    assert.equal(typeof getOtpPepper(), 'string');
    assert.ok(getOtpPepper().length > 0);
  });
});

describe('رموز الجلسة', () => {
  it('الرمز base64url بطول 43 وفريد عملياً', () => {
    const a = generateSessionToken();
    const b = generateSessionToken();
    assert.match(a, /^[A-Za-z0-9_-]{43}$/);
    assert.notEqual(a, b);
  });

  it('البصمة 64 hex وحتمية وتختلف عن الرمز نفسه', () => {
    const token = 'sample-token-123';
    assert.equal(hashSessionToken(token), hashSessionToken(token));
    assert.match(hashSessionToken(token), /^[0-9a-f]{64}$/);
    assert.notEqual(hashSessionToken(token), token);
  });

  it('hashIp مربوط بالمفتاح ولا يكشف العنوان', () => {
    const h = hashIp('192.0.2.1', 'pepper');
    assert.match(h, /^[0-9a-f]{64}$/);
    assert.notEqual(hashIp('192.0.2.1', 'other'), h);
    assert.notEqual(hashIp('192.0.2.2', 'pepper'), h);
  });
});

describe('محدد المعدل (ذاكرة)', () => {
  it('يسمح حتى الحد ثم يحجب', () => {
    const now = 1_000_000;
    assert.deepEqual(hitRateLimit('k-block', 2, 60_000, now).allowed, true);
    assert.deepEqual(hitRateLimit('k-block', 2, 60_000, now).allowed, true);
    const blocked = hitRateLimit('k-block', 2, 60_000, now);
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.remaining, 0);
  });

  it('يعيد التصفير بعد انتهاء النافذة', () => {
    const t0 = 2_000_000;
    hitRateLimit('k-window', 1, 30_000, t0);
    assert.equal(hitRateLimit('k-window', 1, 30_000, t0 + 1).allowed, false);
    assert.equal(hitRateLimit('k-window', 1, 30_000, t0 + 30_001).allowed, true);
  });

  it('المفاتيح مستقلة و المتبقي يتناقص', () => {
    const t0 = 3_000_000;
    assert.equal(hitRateLimit('k-a', 3, 60_000, t0).remaining, 2);
    assert.equal(hitRateLimit('k-a', 3, 60_000, t0).remaining, 1);
    assert.equal(hitRateLimit('k-b', 3, 60_000, t0).remaining, 2);
  });

  it('secondsUntilReset لا يسلب أبداً', () => {
    const t0 = 4_000_000;
    const r = hitRateLimit('k-reset', 1, 10_000, t0);
    assert.equal(secondsUntilReset(r.resetAt, t0), 10);
    assert.equal(secondsUntilReset(r.resetAt, t0 + 20_000), 0);
  });
});
