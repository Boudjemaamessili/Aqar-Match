/**
 * عقد الـ API الموحّد لعقار Match:
 *   نجاح: { ok: true, data }
 *   فشل:  { ok: false, error: { code, message, details? } }
 *
 * كل الأكواد (code) مفاتيح ترجمة في messages/*.json تحت auth.errors
 * وكيانات أخرى قادمة — الواجهة تعرض رسالة مترجمة ولا تعتمد النص الخام.
 */
import {NextResponse} from 'next/server';
import {ZodError, type ZodType} from 'zod';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** استجابة نجاح قياسية + Cache-Control: no-store (مسارات حسّاسة) */
export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  const response = NextResponse.json({ok: true, data}, init);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export function fail(error: ApiError): NextResponse {
  const response = NextResponse.json(
    {
      ok: false,
      error: {code: error.code, message: error.message, details: error.details}
    },
    {status: error.status}
  );
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

/**
 * كشف نوّسط (duck-typing) لأخطاء Prisma المعروفة بلا استيراد صنفها
 * (يبقي الوحدات النقية المختبَرة بعيدة عن محرّك قاعدة البيانات).
 * ⚠ لا نعيد حقول الخطأ (meta/target) للعميل أبداً — أسماء الأعمدة بنية داخلية.
 */
function prismaKnownErrorCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) return null;
  const {name, code} = error as {name?: unknown; code?: unknown};
  if (name === 'PrismaClientKnownRequestError' && typeof code === 'string') return code;
  return null;
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof ZodError) {
    return new ApiError(400, 'VALIDATION_ERROR', 'مدخلات غير صالحة', {
      issues: error.issues.map((i) => ({path: i.path.join('.'), message: i.message, code: i.code}))
    });
  }
  const prismaCode = prismaKnownErrorCode(error);
  if (prismaCode !== null) {
    // يُسجَّل داخلياً بالكامل؛ العميل يتلقى رسالة عامة فقط
    console.error(`[api] خطأ Prisma معروف (${prismaCode}):`, error);
    if (prismaCode === 'P2002') {
      // تعارض قيد فريد (ازدواج سباق/إعادة إرسال) — 409 بلا ذكر للحقل
      return new ApiError(409, 'CONFLICT', 'الطلب يتعارض مع بيانات موجودة — أعد المحاولة');
    }
    if (prismaCode === 'P2025') {
      return new ApiError(404, 'NOT_FOUND', 'العنصر المطلوب غير موجود');
    }
    return new ApiError(500, 'INTERNAL', 'خطأ داخلي غير متوقع');
  }
  return new ApiError(500, 'INTERNAL', 'خطأ داخلي غير متوقع');
}

/**
 * غلاف معالجات الـ API: ZodError → 400 مفصّل · ApiError → حالته ·
 * غير المعروف → 500 عام (يُسجَّل خادمياً ولا يتسرب للعميل).
 */
export function withApi<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error: unknown) {
      const apiError = toApiError(error);
      if (apiError.code === 'INTERNAL') {
        console.error('[api] خطأ غير متوقع:', error);
      }
      return fail(apiError);
    }
  };
}

/** قراءة وتحقق جسم JSON في خطوة واحدة */
export async function parseJsonBody<S extends ZodType>(
  request: Request,
  schema: S
): Promise<ReturnType<S['parse']>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiError(400, 'INVALID_JSON', 'جسم الطلب ليس JSON صالحاً');
  }
  return schema.parse(raw) as ReturnType<S['parse']>;
}

/**
 * حماية CSRF عملية لمسارات POST المعتمدة على الكوكي:
 * إن وُجد Origin يجب أن يطابق Host. (SameSite=Lax يكمّلها).
 */
export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get('origin');
  if (!origin) return; // طلبات same-origin من fetch الأولي قد تحذفه — SameSite يحمينا
  const host = request.headers.get('host');
  try {
    if (new URL(origin).host !== host) {
      throw new ApiError(403, 'CSRF_ORIGIN_MISMATCH', 'مصدر الطلب لا يطابق المضيف');
    }
  } catch {
    throw new ApiError(403, 'CSRF_ORIGIN_MISMATCH', 'مصدر الطلب لا يطابق المضيف');
  }
}

/** عنوان IP الحقيقي من الترويسات (خلف بروكسي) */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip')?.trim() ?? 'unknown';
}

export function getUserAgent(request: Request): string | null {
  return request.headers.get('user-agent')?.slice(0, 300) ?? null;
}
