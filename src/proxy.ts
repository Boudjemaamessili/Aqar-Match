import createMiddleware from 'next-intl/middleware';
import {NextResponse, type NextRequest} from 'next/server';
import {routing} from './i18n/routing';
import {SESSION_COOKIE} from './lib/auth/constants';

/**
 * Proxy (سابقاً middleware حتى Next.js 15):
 *   1) توجيه اللغة (next-intl) — ar بلا بادئة / fr تحت ‎/fr
 *   2) حارس مسارات محمية: بلا كوكي جلسة ⇒ تحويل إلى صفحة الدخول
 *      (فحص رخيص هنا؛ التحقق الحقيقي من الجلسة يتم server-side في الصفحة/الـ API)
 */
const intlMiddleware = createMiddleware(routing);

// ملاحظة: ‎/publish عام قصداً — النشر المجهول (UNMONITORED) مبدأ منتج (المرحلة 4)
const PROTECTED_PATHS = ['/account', '/dashboard', '/search', '/matches'] as const;

function stripLocalePrefix(pathname: string): string {
  const stripped = pathname.replace(/^\/(ar|fr)(?=\/|$)/, '');
  return stripped === '' ? '/' : stripped;
}

export default function proxy(request: NextRequest) {
  const {pathname} = request.nextUrl;
  const barePath = stripLocalePrefix(pathname);

  const isProtected = PROTECTED_PATHS.some(
    (p) => barePath === p || barePath.startsWith(`${p}/`)
  );
  if (!isProtected) {
    return intlMiddleware(request);
  }

  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  if (hasSessionCookie) {
    return intlMiddleware(request);
  }

  const locale = /^\/fr(?=\/|$)/.test(pathname) ? 'fr' : routing.defaultLocale;
  const loginPath = locale === routing.defaultLocale ? '/login' : `/${locale}/login`;
  const redirectUrl = new URL(loginPath, request.url);
  const next = `${pathname}${request.nextUrl.search}`;
  redirectUrl.searchParams.set('next', next);
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  // تجاهل: واجهات API الداخلية، أصول Next، الملفات ذات الامتداد
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
};
