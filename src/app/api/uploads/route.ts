/**
 * POST /api/uploads — رفع صورة عقار واحدة (FormData بحقل «file»).
 *
 * عام (النشر المجهول يحتاجه) لكنه محصّن:
 *   - نفس المصدر فقط (CSRF origin) + محدد معدل لكل IP
 *   - ≤ 5MB، أنواع صور فقط (jpeg/png/webp/avif — عبر الترويسة ثم المحتوى)
 *   - فكّ ترميز صارم بـ sharp: أي ملف غير صالح يُرفض (fail closed)
 *   - يُحفظ في public/uploads/ باسم UUID عشوائي بعد إعادة الترميز WebP
 *     (تجريد EXIF/GPS دفاعاً عن الخصوصية)
 *
 * يرجع: { ok: true, data: { url, width, height, sizeBytes, mimeType } }
 * الميتاداتا المرجعة تُخزَّن لاحقاً في PropertyImage عند إنشاء العقار.
 *
 * ملاحظة تشغيلية: ملفات النشر المُجهَض (orphans) تُكنَس عبر POST /api/uploads/sweep
 * (إدارية، مهلة 24 ساعة — أُنجزت في المرحلة 8 وجاهزة للجدولة الخارجية).
 */
import {randomUUID} from 'node:crypto';
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import type {NextRequest} from 'next/server';
import {
  ApiError,
  assertSameOrigin,
  getClientIp,
  ok,
  withApi
} from '@/lib/api/http';
import {hitRateLimit, secondsUntilReset} from '@/lib/auth/rate-limit';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  PUBLIC_UPLOADS_PREFIX,
  UPLOAD_MAX_BYTES
} from '@/lib/uploads/constants';
import {processUploadedImage} from '@/lib/uploads/image';

export const runtime = 'nodejs';

/** 15 رفعاً ناجحاً/فاشلاً لكل 10 دقائق لكل IP — كافٍ لعقار كامل الصور */
const UPLOAD_RATE_LIMIT = 15;
const UPLOAD_RATE_WINDOW_MS = 600_000;

const uploadsDir = (): string => path.join(process.cwd(), 'public', 'uploads');

export const POST = withApi(async (request: NextRequest) => {
  assertSameOrigin(request);

  const rate = hitRateLimit(`upload:ip:${getClientIp(request)}`, UPLOAD_RATE_LIMIT, UPLOAD_RATE_WINDOW_MS);
  if (!rate.allowed) {
    throw new ApiError(429, 'RATE_LIMITED', 'تم تجاوز حد رفع الصور — أعد المحاولة بعد قليل', {
      retryAfterSeconds: secondsUntilReset(rate.resetAt)
    });
  }

  // 1) قراءة الملف من FormData (ملف واحد لكل طلب — حسب العقد)
  let file: File | null = null;
  try {
    const form = await request.formData();
    const candidate = form.get('file');
    if (candidate instanceof File) file = candidate;
  } catch {
    throw new ApiError(400, 'INVALID_MULTIPART', 'تعذّرت قراءة بيانات النموذج (FormData)');
  }
  if (!file || file.size === 0) {
    throw new ApiError(400, 'NO_FILE', 'لم يُرفق أي ملف — أرسل الصورة في الحقل «file»');
  }
  if (file.size > UPLOAD_MAX_BYTES) {
    throw new ApiError(413, 'FILE_TOO_LARGE', 'الصورة أكبر من الحد الأقصى 5MB', {
      maxBytes: UPLOAD_MAX_BYTES,
      receivedBytes: file.size
    });
  }
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    throw new ApiError(415, 'UNSUPPORTED_IMAGE_TYPE', 'صيغة الصورة غير مدعومة — المقبول: JPEG, PNG, WebP, AVIF', {
      received: file.type,
      allowed: ALLOWED_IMAGE_MIME_TYPES
    });
  }

  // 2) تحويل لمخزن + إعادة فحص الحجم الحقيقي (لا نثق بترويسة الحجم)
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength === 0) {
    throw new ApiError(400, 'NO_FILE', 'الملف المرفق فارغ');
  }
  if (buffer.byteLength > UPLOAD_MAX_BYTES) {
    throw new ApiError(413, 'FILE_TOO_LARGE', 'الصورة أكبر من الحد الأقصى 5MB', {
      maxBytes: UPLOAD_MAX_BYTES
    });
  }

  // 3) التحقق الحقيقي بالمحتوى + الضغط — أي فشل = رفض
  let processed;
  try {
    processed = await processUploadedImage(buffer);
  } catch {
    throw new ApiError(422, 'INVALID_IMAGE_CONTENT', 'محتوى الملف ليس صورة صالحة أو تالف');
  }

  // 4) الحفظ باسم UUID عشوائي (لا يخمن ولا يتصادم)
  const filename = `${randomUUID()}.webp`;
  try {
    const dir = uploadsDir();
    await mkdir(dir, {recursive: true});
    await writeFile(path.join(dir, filename), processed.data);
  } catch (error) {
    console.error('[uploads] فشل حفظ الملف:', error);
    throw new ApiError(500, 'UPLOAD_STORE_FAILED', 'تعذّر حفظ الصورة — أعد المحاولة');
  }

  return ok({
    url: `${PUBLIC_UPLOADS_PREFIX}${filename}`,
    width: processed.width,
    height: processed.height,
    sizeBytes: processed.sizeBytes,
    mimeType: processed.mimeType
  });
});
