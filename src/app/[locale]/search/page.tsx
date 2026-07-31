import type {Metadata} from 'next';
import {getTranslations} from 'next-intl/server';
import {SearchView} from '@/components/views/search';

/**
 * بحث المشتري — محمية (proxy + التحقق في الـ API نفسه).
 * ديناميكية وnoindex: محتوى شخصي لا يُفهرس.
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('search');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    robots: {index: false, follow: false}
  };
}

export default function SearchPage() {
  return <SearchView />;
}
