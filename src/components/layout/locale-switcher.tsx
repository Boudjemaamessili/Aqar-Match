'use client';

import {useLocale, useTranslations} from 'next-intl';
import {Languages} from 'lucide-react';
import {Link, usePathname} from '@/i18n/navigation';

/**
 * مبدّل اللغة — يحافظ على نفس المسار (AR بلا بادئة / FR تحت ‎/fr).
 */
export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('common');
  const other = locale === 'ar' ? 'fr' : 'ar';

  return (
    <Link
      href={pathname}
      locale={other}
      replace
      hrefLang={other}
      aria-label={t('switchLanguage')}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-semibold text-navy-800 shadow-sm transition-colors hover:border-gold-500 hover:text-navy-950"
    >
      <Languages className="size-4" aria-hidden="true" />
      <span>{t('otherLocaleName')}</span>
      <span className="text-xs font-bold text-muted-foreground" dir="ltr">
        {other === 'ar' ? 'AR' : 'FR'}
      </span>
    </Link>
  );
}
