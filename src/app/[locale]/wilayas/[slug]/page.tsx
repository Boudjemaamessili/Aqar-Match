import type {Metadata} from 'next';
import {hasLocale} from 'next-intl';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  CircleDollarSign,
  HelpCircle,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal
} from 'lucide-react';
import {Link} from '@/i18n/navigation';
import {routing} from '@/i18n/routing';
import {toAppLocale, type AppLocale} from '@/i18n/locale';
import {ACTIVE_WILAYAS, communesOfWilaya} from '@/lib/geo';
import {PROPERTY_TYPE_RULES, type DealType} from '@/lib/matching';
import {buildPageMetadata} from '@/lib/seo/metadata';
import {breadcrumbJsonLd, faqJsonLd} from '@/lib/seo/jsonld';
import {buildWilayaFaqs, getWilayaSeoContent} from '@/lib/seo/wilaya-content';
import {JsonLd} from '@/components/seo/json-ld';

/**
 * صفحة هبوط الولاية (SEO) — SSG كامل: 7 ولايات × لغتين = 14 صفحة ثابتة.
 * محتوى منسّق فريد لكل ولاية (لا duplicate content) + FAQPage + BreadcrumbList
 * + canonical/hreflang ثنائي. بلا قاعدة بيانات إطلاقاً (وحدة geo النقية تكفي).
 */

type Props = {
  params: Promise<{locale: string; slug: string}>;
};

export function generateStaticParams(): {locale: string; slug: string}[] {
  return routing.locales.flatMap((locale) =>
    ACTIVE_WILAYAS.map((w) => ({locale, slug: w.slug}))
  );
}

function findActiveWilaya(slug: string) {
  for (const w of ACTIVE_WILAYAS) {
    if (w.slug === slug) return w;
  }
  return undefined;
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale: rawLocale, slug} = await params;
  const wilaya = findActiveWilaya(slug);
  if (!wilaya) return {};
  const locale = toAppLocale(rawLocale);
  const t = await getTranslations('wilayaPage');
  const name = locale === 'ar' ? wilaya.nameAr : wilaya.nameFr;
  const communes = communesOfWilaya(wilaya.code).length;
  return buildPageMetadata({
    locale,
    path: `/wilayas/${slug}`,
    title: t('metaTitle', {name}),
    description: t('metaDescription', {name, communes})
  });
}

const DEAL_LABEL_KEYS: Record<DealType, 'dealSaleLabel' | 'dealRentLabel' | 'dealSeasonalLabel'> = {
  SALE: 'dealSaleLabel',
  RENT: 'dealRentLabel',
  SEASONAL_RENT: 'dealSeasonalLabel'
};

export default async function WilayaPage({params}: Props) {
  const {locale: rawLocale, slug} = await params;
  if (!hasLocale(routing.locales, rawLocale)) {
    notFound();
  }
  const locale: AppLocale = rawLocale;
  setRequestLocale(locale);

  const wilaya = findActiveWilaya(slug);
  const content = wilaya ? getWilayaSeoContent(wilaya.code) : undefined;
  if (!wilaya || !content) {
    notFound();
  }

  const t = await getTranslations('wilayaPage');
  const tSeo = await getTranslations('seo');
  const tHow = await getTranslations('home.how');
  const tTypes = await getTranslations('publish.types');
  const isAr = locale === 'ar';
  const name = isAr ? wilaya.nameAr : wilaya.nameFr;
  const communes = communesOfWilaya(wilaya.code);
  const faqs = buildWilayaFaqs(wilaya, communes.length, isAr ? 'ar' : 'fr');
  const otherWilayas = ACTIVE_WILAYAS.filter((w) => w.code !== wilaya.code);

  const breadcrumbLd = breadcrumbJsonLd([
    {name: tSeo('breadcrumbHome'), path: '/', locale},
    {name: tSeo('breadcrumbWilayas'), path: '/#wilayas', locale},
    {name, path: `/wilayas/${wilaya.slug}`, locale}
  ]);
  const faqLd = faqJsonLd(faqs.map((f) => ({question: f.question, answer: f.answer})));

  return (
    <>
      <JsonLd data={breadcrumbLd} />
      <JsonLd data={faqLd} />

      {/* ─── البطل ─── */}
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 end-1/4 size-96 rounded-full bg-gold-500/15 blur-3xl"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-4 py-1.5 text-sm font-semibold text-gold-300">
            <MapPin className="size-4" aria-hidden="true" />
            {t('heroBadge')}
          </span>
          <h1 className="mt-5 text-3xl font-extrabold leading-snug sm:text-5xl sm:leading-tight">
            {t('heroTitle', {name})}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-navy-100/90">
            {isAr ? content.intro.ar : content.intro.fr}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/publish"
              className="rounded-xl bg-gold-500 px-6 py-3 font-bold text-navy-950 shadow-lg shadow-gold-500/20 transition-colors hover:bg-gold-400"
            >
              {t('ctaPublish')}
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-6 py-3 font-bold text-white transition-colors hover:bg-white/10"
            >
              <Search className="size-4" aria-hidden="true" />
              {t('ctaSearch')}
            </Link>
          </div>
        </div>
      </section>

      {/* ─── السوق بأرقام ─── */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <h2 className="sr-only">{t('factsTitle')}</h2>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {icon: MapPin, value: String(communes.length), label: t('factCommunes')},
              {icon: Building2, value: '7', label: t('factTypes')},
              {icon: SlidersHorizontal, value: '3', label: t('factDeals')},
              {icon: CircleDollarSign, value: t('factFeeValue'), label: t('factFee')}
            ].map((fact) => (
              <div key={fact.label} className="rounded-2xl border border-border bg-background p-4">
                <dt className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                  <fact.icon className="size-4 text-gold-600" aria-hidden="true" />
                  {fact.label}
                </dt>
                <dd className="mt-2 text-3xl font-black text-navy-900">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ─── الأنواع المتاحة لكل معاملة ─── */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:py-16">
        <h2 className="text-2xl font-extrabold text-navy-900 sm:text-3xl">
          {t('typesCoveredTitle', {name})}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
          {t('typesCoveredDesc')}
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {(Object.keys(PROPERTY_TYPE_RULES) as readonly DealType[]).map((dealType) => (
            <div key={dealType} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h3 className="inline-flex rounded-full bg-navy-900 px-3 py-1 text-xs font-extrabold text-gold-300">
                {t(DEAL_LABEL_KEYS[dealType])}
              </h3>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {PROPERTY_TYPE_RULES[dealType].map((propertyType) => (
                  <li
                    key={propertyType}
                    className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-navy-800"
                  >
                    {tTypes(`property.${propertyType}`)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ─── كيف تعمل ─── */}
      <section className="bg-muted/60">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:py-16">
          <h2 className="text-2xl font-extrabold text-navy-900 sm:text-3xl">{t('howTitle', {name})}</h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {([1, 2, 3, 4] as const).map((n) => (
              <li key={n} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <span
                  aria-hidden="true"
                  className="text-3xl font-black text-navy-100"
                >
                  {n}
                </span>
                <h3 className="mt-2 font-bold text-navy-900">{tHow(`step${n}Title`)}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{tHow(`step${n}Desc`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── البلديات ─── */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:py-16">
        <h2 className="text-2xl font-extrabold text-navy-900 sm:text-3xl">
          {t('communesTitle', {name})}
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          {t('communesSubtitle', {count: communes.length})}
        </p>
        <ul className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {communes.map((commune) => (
            <li
              key={commune.id}
              className="rounded-xl border border-border bg-card px-4 py-3"
            >
              <p className="text-sm font-extrabold text-navy-900">
                {isAr ? commune.nameAr : commune.nameFr}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
                {t('dairaLabel')} {isAr ? commune.dairaAr : commune.dairaFr}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* ─── الأسئلة الشائعة ─── */}
      <section className="bg-muted/60">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:py-16">
          <h2 className="flex items-center gap-2 text-2xl font-extrabold text-navy-900 sm:text-3xl">
            <HelpCircle className="size-6 text-gold-600" aria-hidden="true" />
            {t('faqTitle', {name})}
          </h2>
          <div className="mt-8 space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <summary className="cursor-pointer list-none font-extrabold text-navy-900 marker:hidden">
                  <span className="inline-flex w-full items-center justify-between gap-3">
                    {faq.question}
                    <span
                      aria-hidden="true"
                      className="text-xl font-black text-gold-600 transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ولايات أخرى + CTA ─── */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:py-16">
        <h2 className="text-xl font-extrabold text-navy-900">{t('otherWilayasTitle')}</h2>
        <ul className="mt-5 flex flex-wrap gap-2">
          {otherWilayas.map((w) => (
            <li key={w.code}>
              <Link
                href={`/wilayas/${w.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-bold text-navy-900 transition-colors hover:border-gold-500 hover:bg-gold-50"
              >
                <MapPin className="size-3.5 text-gold-600" aria-hidden="true" />
                {isAr ? w.nameAr : w.nameFr}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-12 rounded-3xl bg-navy-900 p-8 text-white sm:p-10">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-extrabold">{t('ctaTitle', {name})}</h2>
              <p className="mt-2 max-w-xl text-sm leading-7 text-navy-100">{t('ctaDesc')}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/publish"
                className="inline-flex items-center gap-2 rounded-xl bg-gold-500 px-6 py-3 font-extrabold text-navy-950 transition-colors hover:bg-gold-400"
              >
                {t('ctaPublish')}
                <ArrowLeft className="size-4 rtl:rotate-0 ltr:rotate-180" aria-hidden="true" />
              </Link>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 px-4 py-3 text-xs font-bold text-navy-200">
                <ShieldCheck className="size-4 text-gold-400" aria-hidden="true" />
                {t('factFee')}: {t('factFeeValue')}
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
