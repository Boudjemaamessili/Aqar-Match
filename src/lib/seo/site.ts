/**
 * أساس SEO الموحّد (نقي — client-safe): مصدر الحقيقة الوحيد للروابط المطلقة
 * وللغات البديلة (hreflang). كل صفحة SEO وsitemap يُشتق من هنا.
 *
 * العقد اللغوي (routing): ar بلا بادئة / · fr تحت ‎/fr · x-default ⇒ ar.
 */
import {BRAND} from '@/lib/constants';
import {routing} from '@/i18n/routing';
import type {AppLocale} from '@/i18n/locale';

export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://aqar-match.example'
).replace(/\/+$/, '');

export const DEFAULT_LOCALE: AppLocale = routing.defaultLocale;

/** مسار محلّي: (ar, '/blog') ⇒ '/blog' · (fr, '/blog') ⇒ '/fr/blog' */
export function localePath(pathname: string, locale: AppLocale): string {
  const clean = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return locale === DEFAULT_LOCALE ? clean : `/${locale}${clean === '/' ? '' : clean}`;
}

/** رابط مطلق جاهز لمحركات البحث */
export function absoluteUrl(pathname: string, locale: AppLocale): string {
  return `${SITE_URL}${localePath(pathname, locale)}`;
}

/** بدائل hreflang لمسار واحد — في Metadata.alternates.languages */
export function languagesFor(pathname: string): Record<string, string> {
  const entries = routing.locales.map((locale) => [
    locale,
    localePath(pathname, locale)
  ]);
  return {
    ...Object.fromEntries(entries),
    'x-default': localePath(pathname, DEFAULT_LOCALE)
  } as Record<string, string>;
}

/** لغة OpenGraph الصيغية (ar_DZ / fr_DZ) */
export function ogLocale(locale: AppLocale): string {
  return locale === 'ar' ? 'ar_DZ' : 'fr_DZ';
}

export {BRAND};
