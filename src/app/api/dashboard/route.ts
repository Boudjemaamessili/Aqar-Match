/**
 * GET /api/dashboard?phone=...+213XXXXXXXXX — لوحة تحكم المستخدم.
 *
 * العقد (المرحلة 6):
 *   - يجد المستخدم برقم الهاتف ويعيد properties + searches + matches.
 *   - لا مستخدم / لا رقم / رقم غير صالح ⇒ مصفوفات فارغة (ok:true).
 *
 * التشديد الأمني (قرار معتمد من المالك في مراجعة المرحلة 6):
 *   الرقم وحده ليس تصريحاً. بلا جلسة نشطة ⇒ مصفوفات فارغة (لا تسريب ولا
 *   تعداد أرقام)، وجلسة لا يطابق هاتفها الرقم المطلوب ⇒ 403 FORBIDDEN.
 *   بما أن الهاتف مفتاح فريد، فتحقق المطابقة يجعل المستخدم «موجوداً» حتماً.
 */
import type {NextRequest} from 'next/server';
import {ApiError, getClientIp, ok, withApi} from '@/lib/api/http';
import {normalizeDzPhone} from '@/lib/auth/phone';
import {hitRateLimit, secondsUntilReset} from '@/lib/auth/rate-limit';
import {getSessionUserOrNull} from '@/lib/auth/session';
import {DASHBOARD_READ_RATE_LIMIT} from '@/lib/dashboard/constants';
import {emptyDashboardData, getDashboardData} from '@/lib/dashboard/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withApi(async (request: NextRequest) => {
  // دفاع إضافي ضد تعداد الأرقام: سقف قراءات لكل IP قبل أي معالجة
  const byIp = hitRateLimit(
    `dashboard:read:ip:${getClientIp(request)}`,
    DASHBOARD_READ_RATE_LIMIT.limit,
    DASHBOARD_READ_RATE_LIMIT.windowMs
  );
  if (!byIp.allowed) {
    throw new ApiError(429, 'RATE_LIMITED', 'طلبات كثيرة من هذا العنوان — أعد المحاولة بعد قليل', {
      retryAfterSeconds: secondsUntilReset(byIp.resetAt)
    });
  }

  const rawPhone = new URL(request.url).searchParams.get('phone');
  if (!rawPhone) {
    return ok(emptyDashboardData());
  }
  const normalized = normalizeDzPhone(rawPhone);
  if (!normalized.ok) {
    return ok(emptyDashboardData());
  }

  const session = await getSessionUserOrNull();
  // بلا جلسة: لا بيانات إطلاقاً (الرقم وحده لا يفتح لوحة أحد)
  if (!session) {
    return ok(emptyDashboardData());
  }
  // جلسة نشطة لرقم آخر: محاولة عبور حسابات — رفض صريح
  if (session.user.phone !== normalized.phone) {
    throw new ApiError(403, 'FORBIDDEN', 'لا يمكن عرض لوحة حساب آخر');
  }

  return ok(await getDashboardData(session.user));
});
