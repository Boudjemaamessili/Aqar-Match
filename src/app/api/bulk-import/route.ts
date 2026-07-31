/**
 * POST /api/bulk-import — الاستيراد الجماعي للوكالات (حتى 100 عقار دفعة واحدة).
 *
 * صلاحية الوكالة إلزامية: عكس النشر الفردي العام، فتح هذا المسار للمجهولين
 * كان سيحوّله لباب إغراق جماعي — لذا requireRole(['agency']) صريح.
 *
 * التدفق لكل صف (معزول الفشل — صف فاسد لا يُسقط الدفعة):
 *   تطبيع التسميات (بيع/SALE + ولاية/بلدية بأي تسمية) ⇐ Zod صارم (نفس
 *   مخطط النشر الفردي) ⇐ كشف تكرار (نفس بلدية+عنوان+سعر لنفس البائع ⇐ skipped)
 *   ⇐ إنشاء. الأخطاء تُجمع برقم الصف (1-based كما تراها الوكالة في جدولها).
 *
 * استعلام التكرار جماعي واحد قبل الحلقة (بلا N+1).
 */
import type {NextRequest} from 'next/server';
import {
  ApiError,
  assertSameOrigin,
  ok,
  parseJsonBody,
  withApi
} from '@/lib/api/http';
import {logAudit} from '@/lib/audit';
import {requireRole, requireUser} from '@/lib/auth/guards';
import {normalizeDzPhone} from '@/lib/auth/phone';
import {hitRateLimit, secondsUntilReset} from '@/lib/auth/rate-limit';
import {prisma} from '@/lib/prisma';
import {BULK_RATE_LIMIT_PER_USER} from '@/lib/properties/constants';
import {buildCoreInputFromBulkRow, listingDuplicateKey} from '@/lib/properties/normalize';
import {bulkImportSchema, propertyCoreSchema} from '@/lib/properties/schemas';
import {createPropertyRecord} from '@/lib/properties/service';

export const runtime = 'nodejs';

interface RowError {
  readonly row: number;
  readonly field: string | null;
  readonly reason: string;
}

/** هل رمز الرسالة أحد رموزنا المُعرَّفة (custom) أم رسالة Zod داخلية؟ */
const KNOWN_ISSUE_TOKENS = new Set([
  'INVALID_WILAYA',
  'INVALID_COMMUNE',
  'COMMUNE_WILAYA_MISMATCH',
  'TYPE_NOT_ALLOWED',
  'SECRET_MIN_BELOW_FLOOR',
  'PRICE_BELOW_SECRET_MIN',
  'TOO_MANY_IMAGES',
  'INVALID_IMAGE_URL'
]);

export const POST = withApi(async (request: NextRequest) => {
  assertSameOrigin(request);

  // 1) وكالة مُصادَقة فقط
  const {user} = await requireUser(request);
  requireRole(user, ['agency']);

  // 2) محدد معدل: 5 دفعات/ساعة لكل وكالة
  const rate = hitRateLimit(`bulk:user:${user.id}`, BULK_RATE_LIMIT_PER_USER.limit, BULK_RATE_LIMIT_PER_USER.windowMs);
  if (!rate.allowed) {
    throw new ApiError(429, 'RATE_LIMITED', 'بلغت حد الاستيراد المؤقت — أعد المحاولة لاحقاً', {
      retryAfterSeconds: secondsUntilReset(rate.resetAt)
    });
  }

  // 3) شكل الجسم العام (بنية الصفوف — التحقق العميق لكل صف داخل الحلقة)
  const body = await parseJsonBody(request, bulkImportSchema);

  // 4) هوية المالك: من الجسم أو من حساب الوكالة نفسه
  const ownerName = body.ownerName ?? user.name;
  if (!ownerName) {
    throw new ApiError(400, 'NAME_REQUIRED', 'اسم المالك مطلوب — أرسل ownerName أو أكمل اسم حسابك');
  }
  const ownerPhoneRaw = body.ownerPhone ?? user.phone;
  const ownerPhone = normalizeDzPhone(ownerPhoneRaw);
  if (!ownerPhone.ok) {
    throw new ApiError(400, 'INVALID_PHONE', `هاتف المالك غير صالح (${ownerPhone.reason})`);
  }
  const accountType = body.accountType ?? 'AGENCY';

  // 5) مصيدة التكرار مسبقة التحميل: استعلام جماعي واحد بعناوين الدفعة
  const titles = [...new Set(body.rows.map((r) => r.title.trim()).filter((t) => t.length > 0))];
  const existing = titles.length
    ? await prisma.property.findMany({
        where: {sellerId: user.id, titleAr: {in: titles}},
        select: {communeId: true, titleAr: true, askingPrice: true}
      })
    : [];
  const duplicateKeys = new Set(
    existing.map((p) => listingDuplicateKey(p.communeId, p.titleAr, Number(p.askingPrice)))
  );

  // 6) المعالجة صفاً صفاً — عزل كامل للإخفاقات
  const errors: RowError[] = [];
  const skippedRows: RowError[] = [];
  const createdIds: string[] = [];
  let success = 0;

  for (const [index, row] of body.rows.entries()) {
    const rowNumber = index + 1;

    const built = buildCoreInputFromBulkRow(row);
    if (!built.ok) {
      for (const failure of built.failures) {
        errors.push({row: rowNumber, field: failure.field, reason: failure.reason});
      }
      continue;
    }

    const parsed = propertyCoreSchema.safeParse(built.input);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push({
          row: rowNumber,
          field: issue.path.join('.') || null,
          reason: KNOWN_ISSUE_TOKENS.has(issue.message) ? issue.message : 'VALIDATION_ERROR'
        });
      }
      continue;
    }

    const dupKey = listingDuplicateKey(parsed.data.commune, parsed.data.title, parsed.data.price);
    if (duplicateKeys.has(dupKey)) {
      skippedRows.push({row: rowNumber, field: 'title', reason: 'DUPLICATE_LISTING'});
      continue;
    }

    try {
      const property = await createPropertyRecord(parsed.data, {
        ownerName,
        ownerPhone: ownerPhone.phone,
        accountType,
        source: 'BULK_IMPORT',
        identity: {sellerId: user.id, status: 'ACTIVE', linkedUser: user}
      });
      duplicateKeys.add(dupKey); // تكرار داخل الدفعة نفسها يُتخطَّى أيضاً
      createdIds.push(property.id);
      success += 1;
    } catch (error) {
      console.error('[bulk-import] فشل إنشاء صف', rowNumber, error);
      errors.push({row: rowNumber, field: null, reason: 'INTERNAL'});
    }
  }

  await logAudit({
    actorId: user.id,
    action: 'property.bulk_import',
    entity: 'property',
    metadata: {total: body.rows.length, success, skipped: skippedRows.length, failed: errors.length}
  });

  return ok({
    total: body.rows.length,
    success,
    skipped: skippedRows.length,
    failed: errors.length,
    errors,
    skippedRows,
    ids: createdIds
  });
});
