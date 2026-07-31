import {useLocale, useTranslations} from 'next-intl';
import {MapPin, Newspaper, ShieldCheck, Timer, XCircle} from 'lucide-react';
import {Link} from '@/i18n/navigation';
import {LogoMark} from '@/components/brand/logo';
import {ACTIVE_WILAYAS} from '@/lib/geo';

/** بند ثقة في التذييل */
function TrustItem({icon, text}: {icon: React.ReactNode; text: string}) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-navy-200">
      <span className="mt-0.5 shrink-0 text-gold-400">{icon}</span>
      <span>{text}</span>
    </li>
  );
}

export function SiteFooter() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-lg font-extrabold">{tCommon('brand')}</span>
          </div>
          <p className="max-w-sm text-sm leading-7 text-navy-200">{t('tagline')}</p>
        </div>

        <nav aria-label={t('platformTitle')} className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gold-400">
            {t('platformTitle')}
          </h2>
          <ul className="space-y-2.5 text-sm">
            {(['how', 'engine', 'fees', 'wilayas'] as const).map((key) => (
              <li key={key}>
                <a
                  href={`#${key}`}
                  className="text-navy-200 transition-colors hover:text-white"
                >
                  {tNav(key)}
                </a>
              </li>
            ))}
            <li>
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-navy-200 transition-colors hover:text-white"
              >
                <Newspaper className="size-3.5 text-gold-400" aria-hidden="true" />
                {t('blogLabel')}
              </Link>
            </li>
          </ul>
        </nav>

        {/* عمود الولايات — ربط داخلي لصفحات الهبوط من كل صفحات الموقع */}
        <nav aria-label={t('wilayasTitle')} className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gold-400">
            {t('wilayasTitle')}
          </h2>
          <ul className="space-y-2.5 text-sm">
            {ACTIVE_WILAYAS.map((w) => (
              <li key={w.code}>
                <Link
                  href={`/wilayas/${w.slug}`}
                  className="inline-flex items-center gap-1.5 text-navy-200 transition-colors hover:text-white"
                >
                  <MapPin className="size-3.5 text-gold-400" aria-hidden="true" />
                  {locale === 'ar' ? w.nameAr : w.nameFr}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gold-400">
            {t('trustTitle')}
          </h2>
          <ul className="space-y-3">
            <TrustItem
              icon={<ShieldCheck className="size-4" aria-hidden="true" />}
              text={t('trustPrivacy')}
            />
            <TrustItem
              icon={<Timer className="size-4" aria-hidden="true" />}
              text={t('trustEscalation')}
            />
            <TrustItem
              icon={<XCircle className="size-4" aria-hidden="true" />}
              text={t('trustCancel')}
            />
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-navy-300 sm:flex-row">
          <p>
            © {year} {tCommon('brand')} — {t('rights')}
          </p>
          <p>{t('madeIn')} 🇩🇿</p>
        </div>
      </div>
    </footer>
  );
}
