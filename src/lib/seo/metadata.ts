/**
 * مساعد بناء Metadata موحّد لصفحات SEO — نقي وقابل للاختبار.
 * يضمن: canonical صحيح بلغة الصفحة + hreflang ثنائي + OG/twitter مكتملين.
 */
import type {Metadata} from 'next';
import type {AppLocale} from '@/i18n/locale';
import {BRAND} from '@/lib/constants';
import {languagesFor, localePath, ogLocale, absoluteUrl} from './site';

export const DEFAULT_OG_IMAGE = '/og-cover.jpg';

export interface PageMetadataInput {
  readonly locale: AppLocale;
  /// مسار الصفحة المنطقي بلا بادئة لغة ('/wilayas/alger')
  readonly path: string;
  readonly title: string;
  readonly description: string;
  /// null = القيمة الافتراضية للمنصة
  readonly ogImagePath?: string;
  readonly index?: boolean;
}

export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const canonical = localePath(input.path, input.locale);
  const ogImage = input.ogImagePath ?? DEFAULT_OG_IMAGE;
  const index = input.index ?? true;
  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical,
      languages: languagesFor(input.path)
    },
    robots: index ? {index: true, follow: true} : {index: false, follow: false},
    openGraph: {
      type: 'website',
      siteName: BRAND.name,
      title: input.title,
      description: input.description,
      url: absoluteUrl(input.path, input.locale),
      locale: ogLocale(input.locale),
      images: [{url: ogImage, width: 1200, height: 630, alt: BRAND.name}]
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
      images: [ogImage]
    }
  };
}
