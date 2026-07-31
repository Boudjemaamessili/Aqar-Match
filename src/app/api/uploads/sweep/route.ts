/**
 * POST /api/uploads/sweep — حذف ملفات الرفع اليتيمة (إداري فقط).
 *
 * اليتيم: ملف في public/uploads لا يشير إليه أي PropertyImage وتجاوز
 * مهلة 24 ساعة (رُفع ثم أُجهض نشر العقار). القرار نقي في
 * src/lib/uploads/orphans.ts — هنا التنفيذ فقط (قراءة/حذف/سجل).
 *
 * الأمان تدريجي: جلسة + دور admin + محدد معدل ضيق + لا يُحذف إلا ما
 * يطابق نمط تسمية المنصة + فشل ملف واحد لا يُسقط البقية.
 *
 * ★ نقطة تكامل مستقبلية — الجدولة:
 *   استدعِ هذه النقطة دورياً كما يُستدعى /api/matches/expire، مثال cron:
 *     30 3 * * *  curl -fsS -X POST -H "Cookie: <admin-session>" https://<host>/api/uploads/sweep
 *   (أو Vercel Cron / worker داخلي عند اعتماد صلاحية خدمة بدل كوكي admin).
 */
import {readdir, stat, unlink} from 'node:fs/promises';
import path from 'node:path';
import type {NextRequest} from 'next/server';
import {
  ApiError,
  assertSameOrigin,
  ok,
  withApi
} from '@/lib/api/http';
import {logAudit} from '@/lib/audit';
import {requireRole, requireUser} from '@/lib/auth/guards';
import {hitRateLimit, secondsUntilReset} from '@/lib/auth/rate-limit';
import {prisma} from '@/lib/prisma';
import {PUBLIC_UPLOADS_PREFIX} from '@/lib/uploads/constants';
import {planOrphanSweep, type UploadFileEntry} from '@/lib/uploads/orphans';

export const runtime = 'nodejs';

/** 10 جولات/ساعة للمدير الواحد — الكنس تشغيلي وليس تفاعلياً */
const SWEEP_RATE_LIMIT = {limit: 10, windowMs: 3_600_000} as const;

const uploadsDir = (): string => path.join(process.cwd(), 'public', 'uploads');

export const POST = withApi(async (request: NextRequest) => {
  assertSameOrigin(request);
  const {user} = await requireUser(request);
  requireRole(user, ['admin']);

  const rate = hitRateLimit(
    `uploads:sweep:${user.id}`,
    SWEEP_RATE_LIMIT.limit,
    SWEEP_RATE_LIMIT.windowMs
  );
  if (!rate.allowed) {
    throw new ApiError(429, 'RATE_LIMITED', 'جولات كنس كثيرة — أعد المحاولة لاحقاً', {
      retryAfterSeconds: secondsUntilReset(rate.resetAt)
    });
  }

  // 1) جرد المجلد (مجلد مفقود = لا شيء يُكنس)
  const dir = uploadsDir();
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    names = [];
  }
  const files: UploadFileEntry[] = (
    await Promise.all(
      names.map(async (name) => {
        try {
          const info = await stat(path.join(dir, name));
          return info.isFile() ? ({name, modifiedAtMs: info.mtimeMs} as const) : null;
        } catch {
          return null; // ملف اختفى بين الجرد والـ stat — يُتخطَّى بأمان
        }
      })
    )
  ).filter((f): f is UploadFileEntry => f !== null);

  // 2) المراجع من قاعدة البيانات: عمود url فقط (استعلام واحد بلا N+1)
  const referenced = await prisma.propertyImage.findMany({
    where: {url: {startsWith: PUBLIC_UPLOADS_PREFIX}},
    select: {url: true}
  });
  const referencedUrls = new Set(referenced.map((r) => r.url));

  // 3) الخطة نقية؛ الحذف هنا مع عزل فشل كل ملف
  const plan = planOrphanSweep(files, referencedUrls, Date.now());
  const deleted: string[] = [];
  let deleteFailures = 0;
  for (const name of plan.deletable) {
    try {
      await unlink(path.join(dir, name));
      deleted.push(name);
    } catch (error) {
      deleteFailures += 1;
      console.error(`[uploads/sweep] تعذّر حذف ${name}:`, error);
    }
  }

  await logAudit({
    actorId: user.id,
    action: 'uploads.sweep',
    entity: 'upload',
    metadata: {
      scanned: plan.scanned,
      deleted: deleted.length,
      keptRecent: plan.keptRecent.length,
      foreignIgnored: plan.foreignIgnored.length,
      deleteFailures
    }
  });

  return ok({
    scanned: plan.scanned,
    referencedCount: plan.referencedCount,
    deleted,
    deletedCount: deleted.length,
    keptRecent: plan.keptRecent.length,
    foreignIgnored: plan.foreignIgnored,
    deleteFailures
  });
});
