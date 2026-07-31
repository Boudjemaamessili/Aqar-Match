/**
 * منطق كنس ملفات الرفع اليتيمة — نقي 100% (بلا fs ولا Prisma) ليبقى قابلاً
 * للاختبار الحتمي. القرار يُتخذ هنا، والتنفيذ (قراءة المجلد/الحذف/الاستعلام)
 * في نقطة /api/uploads/sweep.
 *
 * اليتيم = ملف على القرص لا يشير إليه أي PropertyImage وتجاوز مهلة السماح
 * (صورة رُفعت ثم أُجهض نشرها). قاعدة الأمان: لا نحذف إلا ما يطابق نمط
 * تسميتنا الصارم (uuid.webp) — أي ملف غريب يُترك ويُبلَّغ عنه.
 */
import {PUBLIC_UPLOADS_PREFIX} from './constants';

/** مهلة السماح قبل اعتبار الملف اليتيم جاهزاً للحذف: 24 ساعة */
export const ORPHAN_GRACE_MS = 24 * 3_600_000;

/** نمط اسم ملف رفع صحّ مصدره منصتنا فقط — غير المطابق لا يُمسّ إطلاقاً */
const OWNED_FILE_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/;

export interface UploadFileEntry {
  readonly name: string;
  readonly modifiedAtMs: number;
}

export interface OrphanSweepPlan {
  /** ملفات تملكها المنصة بالكامل (مطابقة للنمط) */
  readonly scanned: number;
  /** كم ملفاً يشير إليه سجل صورة واحد على الأقل */
  readonly referencedCount: number;
  /** يتيمة وأقدم من مهلة السماح ← آمنة الحذف */
  readonly deletable: readonly string[];
  /** يتيمة لكنها حديثة (نشر جارٍ محتمل) — تُبقى لهذه الجولة */
  readonly keptRecent: readonly string[];
  /** ملفات لا تطابق نمطنا — لا تُحذف، تُرصد فقط */
  readonly foreignIgnored: readonly string[];
}

export function planOrphanSweep(
  files: readonly UploadFileEntry[],
  referencedUrls: ReadonlySet<string>,
  nowMs: number,
  graceMs: number = ORPHAN_GRACE_MS
): OrphanSweepPlan {
  const deletable: string[] = [];
  const keptRecent: string[] = [];
  const foreignIgnored: string[] = [];
  let referencedCount = 0;

  for (const file of files) {
    if (!OWNED_FILE_PATTERN.test(file.name)) {
      foreignIgnored.push(file.name);
      continue;
    }
    const url = `${PUBLIC_UPLOADS_PREFIX}${file.name}`;
    if (referencedUrls.has(url)) {
      referencedCount += 1;
      continue;
    }
    if (nowMs - file.modifiedAtMs < graceMs) {
      keptRecent.push(file.name);
    } else {
      deletable.push(file.name);
    }
  }

  return {
    scanned: deletable.length + keptRecent.length + referencedCount,
    referencedCount,
    deletable,
    keptRecent,
    foreignIgnored
  };
}
