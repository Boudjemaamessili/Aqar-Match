import type {Metadata} from 'next';
import {hasLocale} from 'next-intl';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {ArrowLeft, Calendar, Clock, MapPin, Newspaper} from 'lucide-react';
import {Link} from '@/i18n/navigation';
import {routing} from '@/i18n/routing';
import {toAppLocale} from '@/i18n/locale';
import {getWilaya} from '@/lib/geo';
import {listBlogPosts, readingTimeMinutes} from '@/lib/blog/posts';
import {buildPageMetadata} from '@/lib/seo/metadata';
import {breadcrumbJsonLd} from '@/lib/seo/jsonld';
import {JsonLd} from '@/components/seo/json-ld';

/**
 * فهرس المدونة (SEO) — SSG بلغتين. محتوى تحريري منسّق في lib/blog/posts.
 */
export const dynamic = 'force-static';

type Props = {
  params: Promise<{locale: string}>;
};

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale: rawLocale} = await params;
  const locale = toAppLocale(rawLocale);
  const t = await getTranslations('blog');
  return buildPageMetadata({
    locale,
    path: '/blog',
    title: t('metaTitle'),
    description: t('metaDescription')
  });
}

export default async function BlogIndexPage({params}: Props) {
  const {locale: rawLocale} = await params;
  if (!hasLocale(routing.locales, rawLocale)) {
    notFound();
  }
  const locale = rawLocale;
  setRequestLocale(locale);

  const t = await getTranslations('blog');
  const tSeo = await getTranslations('seo');
  const posts = listBlogPosts();
  const dateFmt = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', {
    dateStyle: 'long'
  });

  const breadcrumbLd = breadcrumbJsonLd([
    {name: tSeo('breadcrumbHome'), path: '/', locale},
    {name: tSeo('breadcrumbBlog'), path: '/blog', locale}
  ]);

  return (
    <>
      <JsonLd data={breadcrumbLd} />

      <section className="bg-navy-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-4 py-1.5 text-sm font-semibold text-gold-300">
            <Newspaper className="size-4" aria-hidden="true" />
            {t('title')}
          </span>
          <h1 className="mt-5 text-3xl font-extrabold sm:text-4xl">{t('metaTitle')}</h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-navy-100/90">{t('subtitle')}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const content = post[locale];
            const wilaya = post.wilayaCode !== null ? getWilaya(post.wilayaCode) : undefined;
            return (
              <li key={post.slug}>
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
                  <Link href={`/blog/${post.slug}`} className="block">
                    <div className="relative aspect-16/10 bg-muted">
                      {post.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- أغلفة محلية ثابتة
                        <img
                          src={post.coverImageUrl}
                          alt={t('coverAlt', {title: content.title})}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <Newspaper className="size-8" aria-hidden="true" />
                        </div>
                      )}
                      <span className="absolute start-2 top-2 rounded-full bg-navy-900/90 px-3 py-1 text-[11px] font-extrabold text-gold-300">
                        {content.category}
                      </span>
                    </div>
                  </Link>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="size-3.5" aria-hidden="true" />
                        {t('publishedOn', {date: dateFmt.format(new Date(post.publishedAt))})}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5" aria-hidden="true" />
                        {t('minRead', {minutes: readingTimeMinutes(post, locale)})}
                      </span>
                      {wilaya ? (
                        <span className="inline-flex items-center gap-1 text-gold-700">
                          <MapPin className="size-3.5" aria-hidden="true" />
                          {locale === 'ar' ? wilaya.nameAr : wilaya.nameFr}
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-3 text-lg font-extrabold leading-7 text-navy-900 group-hover:text-navy-700">
                      <Link href={`/blog/${post.slug}`}>{content.title}</Link>
                    </h2>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm leading-7 text-muted-foreground">
                      {content.excerpt}
                    </p>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-extrabold text-gold-700 transition-colors hover:text-gold-600"
                    >
                      {t('readMore')}
                      <ArrowLeft className="size-4 rtl:rotate-0 ltr:rotate-180" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
