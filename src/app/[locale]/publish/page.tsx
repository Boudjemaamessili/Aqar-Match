import type {Metadata} from 'next';
import {hasLocale} from 'next-intl';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {PublishView} from '@/components/views/publish';
import {routing} from '@/i18n/routing';

/**
 * صفحة نشر العقار — عامة (النشر المجهول مبدأ منتج من المرحلة 4).
 * المحتوى التفاعلي كله في جزيرة العميل PublishView؛ الغلاف ساكن (SSG).
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('publish');
  return {
    title: t('metaTitle'),
    description: t('metaDescription')
  };
}

type Props = {
  params: Promise<{locale: string}>;
};

export default async function PublishPage({params}: Props) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return <PublishView />;
}
