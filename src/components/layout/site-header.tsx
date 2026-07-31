import {useTranslations} from 'next-intl';
import {Plus} from 'lucide-react';
import {Link} from '@/i18n/navigation';
import {LogoMark} from '@/components/brand/logo';
import {AccountLink} from './account-link';
import {LocaleSwitcher} from './locale-switcher';

/** أقسام الصفحة الرئيسية — روابط داخلية (لا مسارات مستقبلية) */
const SECTIONS = [
  {anchor: 'how', key: 'how'},
  {anchor: 'engine', key: 'engine'},
  {anchor: 'fees', key: 'fees'},
  {anchor: 'wilayas', key: 'wilayas'}
] as const;

export function SiteHeader() {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-[60] focus:rounded-lg focus:bg-gold-500 focus:px-4 focus:py-2 focus:font-bold focus:text-navy-950"
      >
        {t('common.skipToContent')}
      </a>

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-extrabold text-navy-900 transition-opacity hover:opacity-90"
        >
          <LogoMark />
          <span className="text-lg leading-none">{t('common.brand')}</span>
        </Link>

        <nav aria-label={t('nav.ariaLabel')} className="hidden items-center gap-1 md:flex">
          {SECTIONS.map((s) => (
            <a
              key={s.key}
              href={`#${s.anchor}`}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-navy-900"
            >
              {t(`nav.${s.key}`)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/publish"
            className="inline-flex items-center gap-1.5 rounded-full bg-gold-500 px-3.5 py-1.5 text-sm font-extrabold text-navy-950 transition-colors hover:bg-gold-400"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t('nav.publishCta')}
          </Link>
          <AccountLink />
          <LocaleSwitcher />
        </div>
      </div>

      {/* تنقّل الموبايل: شريط تمرير أفقي بلا قائمة منسدلة */}
      <nav
        aria-label={t('nav.ariaLabel')}
        className="flex gap-1 overflow-x-auto border-t border-border/60 px-3 py-2 md:hidden"
      >
        {SECTIONS.map((s) => (
          <a
            key={s.key}
            href={`#${s.anchor}`}
            className="shrink-0 rounded-full bg-muted px-3.5 py-1.5 text-sm font-semibold text-navy-800 transition-colors hover:bg-gold-100"
          >
            {t(`nav.${s.key}`)}
          </a>
        ))}
      </nav>
    </header>
  );
}
