import type {Metadata} from 'next';
import {getTranslations} from 'next-intl/server';
import {MatchesView} from '@/components/views/matches';

/**
 * صندوق المطابقات — محمية (proxy + حراسة العضوية في كل نقطة API).
 * ديناميكية وnoindex.
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('match');
  return {
    title: t('metaTitle'),
    robots: {index: false, follow: false}
  };
}

export default function MatchesPage() {
  return <MatchesView />;
}
