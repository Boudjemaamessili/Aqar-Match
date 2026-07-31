/**
 * اختبارات كنس ملفات الرفع اليتيمة — node:test (pure، بلا قاعدة بيانات).
 * تثبت قواعد الأمان: لا حذف إلا لملفاتنا اليتيمة المتجاوزة لمهلة السماح.
 */
import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import {ORPHAN_GRACE_MS, planOrphanSweep, type UploadFileEntry} from './orphans';

const VALID_A = '3f8a2c1e-1111-4222-8333-aabbccddeeff.webp';
const VALID_B = '3f8a2c1e-4444-4555-8666-001122334455.webp';
const VALID_C = '07654321-abcd-4def-9abc-0123456789ab.webp';

const NOW = 1_800_000_000_000; // زمن حتمي ثابت

function file(name: string, ageMs: number): UploadFileEntry {
  return {name, modifiedAtMs: NOW - ageMs};
}

describe('خطة كنس الملفات اليتيمة', () => {
  it('تحذف اليتيم المتجاوز للمهلة وتحتفظ بالمُشار إليه والحديث', () => {
    const plan = planOrphanSweep(
      [
        file(VALID_A, ORPHAN_GRACE_MS + 1000), // يتيم قديم ← يُحذف
        file(VALID_B, 1000), // يتيم حديث ← يُبقى (نشر جارٍ محتمل)
        file(VALID_C, ORPHAN_GRACE_MS + 1000) // مُشار إليه ← يُبقى رغم قدمه
      ],
      new Set([`/uploads/${VALID_C}`]),
      NOW
    );
    assert.deepEqual([...plan.deletable], [VALID_A]);
    assert.deepEqual([...plan.keptRecent], [VALID_B]);
    assert.equal(plan.referencedCount, 1);
    assert.equal(plan.scanned, 3);
    assert.deepEqual([...plan.foreignIgnored], []);
  });

  it('لا تمسّ أي ملف لا يطابق نمط تسمية المنصة (أمان أولاً)', () => {
    const foreign = ['.gitkeep', 'notes.txt', 'evil.php', 'UPPER.webp', '3f8a2c1e.webp', `${VALID_A}.bak`];
    const plan = planOrphanSweep(
      foreign.map((name) => file(name, ORPHAN_GRACE_MS * 10)),
      new Set(),
      NOW
    );
    assert.deepEqual([...plan.deletable], []);
    assert.deepEqual([...plan.foreignIgnored].sort(), foreign.sort());
    assert.equal(plan.scanned, 0);
  });

  it('حدّ المهلة دقيق: دونها يُبقى وعندها يُحذف', () => {
    const plan = planOrphanSweep(
      [file(VALID_A, ORPHAN_GRACE_MS - 1), file(VALID_B, ORPHAN_GRACE_MS + 1)],
      new Set(),
      NOW
    );
    assert.deepEqual([...plan.keptRecent], [VALID_A]);
    assert.deepEqual([...plan.deletable], [VALID_B]);
  });

  it('مجلد فارغ = لا شيء', () => {
    const plan = planOrphanSweep([], new Set(['/uploads/x.webp']), NOW);
    assert.equal(plan.scanned, 0);
    assert.equal(plan.deletable.length, 0);
  });
});
