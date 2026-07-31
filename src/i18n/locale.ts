/** أدوات لغة خفيفة مشتركة (خادم فقط — بلا اعتماديات عميل) */
import {hasLocale} from 'next-intl';
import {routing} from './routing';

export type AppLocale = (typeof routing.locales)[number];

/** ✅ تضييق آمن من string خام إلى لغة التطبيق (مع رجوع للافتراضية) */
export function toAppLocale(value: string | null | undefined): AppLocale {
  return hasLocale(routing.locales, value) ? value : routing.defaultLocale;
}

/** مسار محلّي صريح لاستخدام redirect/روابط الخام (الافتراضية بلا بادئة) */
export function localizedPath(pathname: string, locale: AppLocale): string {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  return `${prefix}${pathname}`;
}
