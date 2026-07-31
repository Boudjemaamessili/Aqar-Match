'use client';

/**
 * LiveStatsBand — شريط «المنصة بالأرقام» في الصفحة الرئيسية (المرحلة 6).
 * جزيرة عميلة داخل صفحة SSG: تجلب /api/stats بعد الترطيب وتعرض مؤشرات حية.
 * تتحمل الفشل بصمت (الرئيسية لا تنكسر بسبب إحصائية)، وتوسم الأرقام
 * الاسترشادية بصراحة عندما isFallback (قاعدة فارغة في مرحلة MVP).
 */
import {useEffect, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {Building2, Clock, Database, Handshake, Info, Loader2, MapPin, ShieldCheck, Sparkles} from 'lucide-react';

interface StatsPayload {
  readonly totalProperties: number;
  readonly saleCount: number;
  readonly rentCount: number;
  readonly seasonalRentCount: number;
  readonly topWilaya: {
    readonly code: number;
    readonly nameAr: string;
    readonly nameFr: string;
    readonly basis: 'searches' | 'properties';
    readonly count: number;
  } | null;
  readonly matchRate: number | null;
  readonly averageMatchScore: number | null;
  readonly avgMatchDays: number | null;
  readonly dataPoints: number;
  readonly encryptedFields: number;
  readonly isFallback: boolean;
}

type FetchState = 'loading' | 'ready' | 'error';

export function LiveStatsBand() {
  const locale = useLocale();
  const t = useTranslations('stats');
  const [state, setState] = useState<FetchState>('loading');
  const [stats, setStats] = useState<StatsPayload | null>(null);

  // سلاسل Promise مباشرة في التأثير: setState في callbacks النظام الخارجي فقط
  // (قاعدة react-hooks/set-state-in-effect).
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/stats', {cache: 'no-store', signal: controller.signal})
      .then(async (response) => {
        const payload: unknown = await response.json().catch(() => null);
        if (
          response.ok &&
          typeof payload === 'object' &&
          payload !== null &&
          (payload as {ok?: unknown}).ok === true
        ) {
          setStats((payload as {data: StatsPayload}).data);
          setState('ready');
          return;
        }
        setState('error');
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') return;
        if (!controller.signal.aborted) setState('error');
      });
    return () => controller.abort();
  }, []);

  // الرئيسية صفحة تسويق: فشل المؤشرات ≠ فشل الصفحة
  if (state === 'error') return null;

  const numberFmt = new Intl.NumberFormat(locale === 'ar' ? 'ar-DZ' : 'fr-DZ');
  const na = '—';

  const cards = [
    {
      icon: Building2,
      label: t('labels.totalProperties'),
      value: state === 'ready' && stats ? numberFmt.format(stats.totalProperties) : null,
      sub:
        state === 'ready' && stats
          ? `${t('labels.sale')} ${numberFmt.format(stats.saleCount)} · ${t('labels.rent')} ${numberFmt.format(stats.rentCount)} · ${t('labels.seasonalRent')} ${numberFmt.format(stats.seasonalRentCount)}`
          : null
    },
    {
      icon: Handshake,
      label: t('labels.matchRate'),
      value: state === 'ready' && stats ? (stats.matchRate !== null ? `${numberFmt.format(stats.matchRate)}%` : na) : null,
      sub: null
    },
    {
      icon: MapPin,
      label: t('labels.topWilaya'),
      value:
        state === 'ready' && stats
          ? stats.topWilaya
            ? locale === 'ar'
              ? stats.topWilaya.nameAr
              : stats.topWilaya.nameFr
            : na
          : null,
      sub:
        state === 'ready' && stats?.topWilaya
          ? `${stats.topWilaya.basis === 'searches' ? t('topBasisSearches') : t('topBasisProperties')} · ${numberFmt.format(stats.topWilaya.count)} ${t('requestsUnit')}`
          : null
    },
    {
      icon: Sparkles,
      label: t('labels.averageScore'),
      value: state === 'ready' && stats ? (stats.averageMatchScore !== null ? numberFmt.format(stats.averageMatchScore) : na) : null,
      sub: state === 'ready' && stats?.averageMatchScore !== null && stats ? '/100' : null
    }
  ] as const;

  return (
    <section aria-label={t('liveTitle')} className="border-y border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2.5 text-2xl font-extrabold text-navy-900 sm:text-3xl">
              <span className="relative flex size-3" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-500 opacity-60" />
                <span className="relative inline-flex size-3 rounded-full bg-gold-500" />
              </span>
              {t('liveTitle')}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{t('liveSubtitle')}</p>
          </div>
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-border bg-background p-4 sm:p-5"
            >
              <dt className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground sm:text-xs">
                <card.icon className="size-4 shrink-0 text-gold-600" aria-hidden="true" />
                {card.label}
              </dt>
              <dd className="mt-2 min-h-9 text-2xl font-black text-navy-900 sm:text-3xl">
                {card.value === null ? (
                  <Loader2 className="size-6 animate-spin text-muted-foreground/50" aria-label={t('liveTitle')} />
                ) : (
                  <span dir="ltr">{card.value}</span>
                )}
              </dd>
              {card.sub ? (
                <dd className="mt-1 truncate text-[11px] font-semibold text-muted-foreground">
                  {card.sub}
                </dd>
              ) : null}
            </div>
          ))}
        </dl>

        {state === 'ready' && stats ? (
          <ul className="mt-5 flex flex-wrap items-center gap-2 text-xs font-bold text-navy-800">
            {stats.avgMatchDays !== null ? (
              <li className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
                <Clock className="size-3.5 text-gold-600" aria-hidden="true" />
                {t('labels.avgMatchDays')}: {numberFmt.format(stats.avgMatchDays)} {t('perDaySuffix')}
              </li>
            ) : null}
            <li className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
              <Database className="size-3.5 text-gold-600" aria-hidden="true" />
              {numberFmt.format(stats.dataPoints)} {t('labels.dataPoints')}
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
              <ShieldCheck className="size-3.5 text-gold-600" aria-hidden="true" />
              {numberFmt.format(stats.encryptedFields)} {t('labels.protectedFields')}
            </li>
            {stats.isFallback ? (
              <li className="inline-flex items-center gap-1.5 rounded-full bg-gold-50 px-3 py-1.5 text-gold-800">
                <Info className="size-3.5" aria-hidden="true" />
                {t('fallbackNote')}
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
