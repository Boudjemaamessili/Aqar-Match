import {hasLocale} from 'next-intl';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {
  Building2,
  Check,
  CircleDollarSign,
  Filter,
  Handshake,
  MapPin,
  PhoneCall,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Wallet
} from 'lucide-react';
import {routing} from '@/i18n/routing';
import {Link} from '@/i18n/navigation';
import {LiveStatsBand} from '@/components/home/live-stats';
import {JsonLd} from '@/components/seo/json-ld';
import {organizationWithIdJsonLd, webSiteJsonLd} from '@/lib/seo/jsonld';
import {ACTIVE_WILAYAS, communesOfWilaya, TOTAL_COMMUNES} from '@/lib/geo';
import {formatDzd} from '@/lib/utils';

type Props = {
  params: Promise<{locale: string}>;
};

/** خطوات «كيف تعمل» مع أيقوناتها */
const HOW_STEPS = [
  {icon: Building2, n: 1},
  {icon: Search, n: 2},
  {icon: SlidersHorizontal, n: 3},
  {icon: PhoneCall, n: 4}
] as const;

/** طبقات محرك المطابقة */
const ENGINE_LAYERS = [
  {icon: Filter, n: 1},
  {icon: MapPin, n: 2},
  {icon: CircleDollarSign, n: 3},
  {icon: Sparkles, n: 4}
] as const;

export default async function HomePage({params}: Props) {
  const {locale} = await params;
  // حارس أنواع: يضيّق اللغة إلى «ar | fr» ويحمي من أي وصول غير متوقع
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  // اللغة تُقرأ من سياق الطلب تلقائياً
  const t = await getTranslations();
  const isAr = locale === 'ar';

  const heroStats = [
    {value: String(ACTIVE_WILAYAS.length), label: t('home.hero.statsWilayas')},
    {value: String(TOTAL_COMMUNES), label: t('home.hero.statsCommunes')},
    {value: '4', label: t('home.hero.statsLayers')},
    {value: formatDzd(0, locale), label: t('home.hero.statsBuyerFee')}
  ];

  return (
    <>
      {/* Graph معرفات المنصة: Organization#id مرجعه schema المقالات وWebSite */}
      <JsonLd data={organizationWithIdJsonLd()} />
      <JsonLd data={webSiteJsonLd(locale)} />

      {/* ─── البطل ─── */}
      <section className="relative overflow-hidden bg-navy-950 text-white">
        {/* هالة ذهبية زخرفية */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 start-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-gold-500/15 blur-3xl rtl:translate-x-1/2"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-4 py-1.5 text-sm font-semibold text-gold-300">
              <ShieldCheck className="size-4" aria-hidden="true" />
              {t('home.hero.badge')}
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.25] sm:text-5xl sm:leading-[1.2]">
              {t('home.hero.title')}{' '}
              <span className="text-gold-400">{t('home.hero.titleAccent')}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-navy-100/90 sm:text-lg">
              {t('home.hero.subtitle')}
            </p>
            {/* إجراءات البطل: زر النشر أبرز عنصر تحويلي في الصفحة كلها */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/publish"
                className="inline-flex items-center gap-2 rounded-xl bg-gold-500 px-6 py-3 font-extrabold text-navy-950 shadow-lg shadow-gold-500/20 transition-colors hover:bg-gold-400"
              >
                <Plus className="size-5" aria-hidden="true" />
                {t('home.hero.ctaPublish')}
              </Link>
              <Link
                href="/search"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-6 py-3 font-bold text-white transition-colors hover:bg-white/10"
              >
                <Search className="size-5" aria-hidden="true" />
                {t('home.hero.ctaSearch')}
              </Link>
              <a
                href="#how"
                className="px-2 py-3 text-sm font-semibold text-navy-200 underline-offset-4 transition-colors hover:text-gold-300 hover:underline"
              >
                {t('home.hero.ctaHow')}
              </a>
              <a
                href="#fees"
                className="px-2 py-3 text-sm font-semibold text-navy-200 underline-offset-4 transition-colors hover:text-gold-300 hover:underline"
              >
                {t('home.hero.ctaFees')}
              </a>
            </div>
          </div>

          <dl className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-4">
            {heroStats.map((s) => (
              <div key={s.label} className="bg-navy-950/80 px-5 py-4">
                <dt className="order-2 mt-1 text-xs font-medium text-navy-200 sm:text-sm">
                  {s.label}
                </dt>
                <dd className="text-2xl font-extrabold text-gold-400">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ─── كيف تعمل ─── */}
      <section id="how" className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold text-navy-900">{t('home.how.title')}</h2>
          <p className="mt-3 text-muted-foreground">{t('home.how.subtitle')}</p>
        </div>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_STEPS.map(({icon: Icon, n}) => (
            <li
              key={n}
              className="relative rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <span
                aria-hidden="true"
                className="absolute end-5 top-5 text-4xl font-black text-navy-100"
              >
                {n}
              </span>
              <span className="inline-flex size-12 items-center justify-center rounded-xl bg-navy-900 text-gold-400">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-navy-900">
                {t(`home.how.step${n}Title`)}
              </h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {t(`home.how.step${n}Desc`)}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* ─── محرك المطابقة ─── */}
      <section id="engine" className="bg-muted/60">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
          <div className="grid items-start gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-extrabold text-navy-900">{t('home.engine.title')}</h2>
              <p className="mt-3 text-muted-foreground">{t('home.engine.subtitle')}</p>
              <p className="mt-6 inline-flex items-start gap-2 rounded-xl border border-gold-300 bg-gold-50 px-4 py-3 text-sm font-semibold text-gold-800">
                <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {t('home.engine.note')}
              </p>
            </div>
            <ul className="space-y-4">
              {ENGINE_LAYERS.map(({icon: Icon, n}) => (
                <li
                  key={n}
                  className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
                >
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold-500/15 text-gold-700">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-bold text-navy-900">
                      {t(`home.engine.layer${n}Name`)}
                    </h3>
                    <p className="mt-1 text-sm leading-7 text-muted-foreground">
                      {t(`home.engine.layer${n}Desc`)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── الرسوم ─── */}
      <section id="fees" className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold text-navy-900">{t('home.fees.title')}</h2>
          <p className="mt-3 text-muted-foreground">{t('home.fees.subtitle')}</p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {/* البائع */}
          <div className="rounded-2xl bg-navy-900 p-7 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-gold-500 text-navy-950">
                <Wallet className="size-5" aria-hidden="true" />
              </span>
              <h3 className="text-xl font-extrabold">{t('home.fees.sellerTitle')}</h3>
            </div>
            <ul className="mt-6 space-y-4 text-sm leading-7 text-navy-100">
              {([1, 2, 3] as const).map((n) => (
                <li key={n} className="flex items-start gap-2.5">
                  <Check className="mt-1 size-4 shrink-0 text-gold-400" aria-hidden="true" />
                  <span>
                    {n === 1
                      ? t('home.fees.sellerPoint1', {
                          min: formatDzd(10_000, locale),
                          max: formatDzd(100_000, locale)
                        })
                      : t(`home.fees.sellerPoint${n}`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* المشتري */}
          <div className="rounded-2xl border-2 border-gold-500 bg-card p-7 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-gold-500/15 text-gold-700">
                <Handshake className="size-5" aria-hidden="true" />
              </span>
              <h3 className="text-xl font-extrabold text-navy-900">{t('home.fees.buyerTitle')}</h3>
            </div>
            <p className="mt-6 text-5xl font-black text-gold-600">
              {t('home.fees.buyerFree')}
            </p>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              {t('home.fees.buyerDesc')}
            </p>
          </div>
        </div>

        <p className="mt-6 flex items-start gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-navy-400" aria-hidden="true" />
          {t('home.fees.note')}
        </p>
      </section>

      {/* ─── مؤشرات المنصة الحية (تُرطَّب عميلياً، تُسقط نفسها عند الفشل) ─── */}
      <LiveStatsBand />

      {/* ─── الولايات ─── */}
      <section id="wilayas" className="bg-navy-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-extrabold">{t('home.wilayas.title')}</h2>
            <p className="mt-3 text-navy-200">{t('home.wilayas.subtitle')}</p>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ACTIVE_WILAYAS.map((w) => {
              const count = communesOfWilaya(w.code).length;
              return (
                <li key={w.code}>
                  <Link
                    href={`/wilayas/${w.slug}`}
                    className="block h-full rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-gold-500/60 hover:bg-white/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-extrabold">
                        {isAr ? w.nameAr : w.nameFr}
                      </h3>
                      <span className="shrink-0 rounded-full bg-gold-500/15 px-2.5 py-1 text-xs font-bold text-gold-300">
                        {t('home.wilayas.communesCount', {count})}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-navy-300">{isAr ? w.nameFr : w.nameAr}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </>
  );
}
