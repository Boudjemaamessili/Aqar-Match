import '@fontsource-variable/inter';
import '@fontsource-variable/cairo';
import '@/styles/globals.css';

import type {Metadata, Viewport} from 'next';
import {hasLocale, NextIntlClientProvider} from 'next-intl';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {SiteFooter} from '@/components/layout/site-footer';
import {SiteHeader} from '@/components/layout/site-header';
import {routing} from '@/i18n/routing';
import {BRAND} from '@/lib/constants';
import {DEFAULT_OG_IMAGE} from '@/lib/seo/metadata';

type Props = {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
};

/** توليد لغتين ساكنتين: / (ar) و /fr */
export function generateStaticParams(): {locale: string}[] {
  return routing.locales.map((locale) => ({locale}));
}

export const viewport: Viewport = {
  themeColor: BRAND.color,
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale} = await params;
  // الترجمات تُقرأ من سياق الطلب تلقائياً (Proxy التابع لـ next-intl)
  const t = await getTranslations('metadata');

  return {
    metadataBase: new URL(APP_URL),
    title: {
      default: t('title'),
      template: `%s | ${BRAND.name}`
    },
    description: t('description'),
    applicationName: BRAND.name,
    alternates: {
      canonical: '/',
      languages: {
        ar: '/',
        fr: '/fr',
        'x-default': '/'
      }
    },
    openGraph: {
      type: 'website',
      siteName: BRAND.name,
      title: t('title'),
      description: t('description'),
      locale: locale === 'ar' ? 'ar_DZ' : 'fr_DZ',
      images: [{url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: BRAND.name}]
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: [DEFAULT_OG_IMAGE]
    }
  };
}

export default async function LocaleLayout({children, params}: Props) {
  const {locale} = await params;

  // تحقق صارم من اللغة — أي لغة غير مدعومة = 404
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col bg-background text-foreground antialiased">
        <NextIntlClientProvider>
          <SiteHeader />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
