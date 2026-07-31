import type {Metadata} from 'next';
import {hasLocale} from 'next-intl';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {ArrowLeft, Calendar, Clock, MapPin, Tag} from 'lucide-react';
import {Link} from '@/i18n/navigation';
import {routing} from '@/i18n/routing';
import {toAppLocale, type AppLocale} from '@/i18n/locale';
import {getWilaya} from '@/lib/geo';
import {getBlogPost, listBlogPosts, readingTimeMinutes, type BlogBlock} from '@/lib/blog/posts';
import {buildPageMetadata} from '@/lib/seo/metadata';
import {articleJsonLd, breadcrumbJsonLd, organizationWithIdJsonLd} from '@/lib/seo/jsonld';
import {absoluteUrl} from '@/lib/seo/site';
import {JsonLd} from '@/components/seo/json-ld';

/**
 * صفحة المقال (SEO) — SSG لكل مقال × لغة.
 * Article JSON-LD كامل (ناشر بمُعرّف، تاريخا نشر/تحديث، غلاف) + Breadcrumb
 * + ربط ترويجي بصفحة الولاية عند وجود wilayaCode.
 */

type Props = {
  params: Promise<{locale: string; slug: string}>;
};

export function generateStaticParams(): {locale: string; slug: string}[] {
  return routing.locales.flatMap((locale) =>
    listBlogPosts().map((post) => ({locale, slug: post.slug}))
  );
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale: rawLocale, slug} = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  const locale = toAppLocale(rawLocale);
  const content = post[locale];
  return buildPageMetadata({
    locale,
    path: `/blog/${post.slug}`,
    title: content.seoTitle,
    description: content.seoDescription,
    ogImagePath: post.coverImageUrl ?? undefined
  });
}

function Block({block}: {readonly block: BlogBlock}) {
  switch (block.type) {
    case 'h2':
      return <h2 className="mt-10 text-2xl font-extrabold text-navy-900">{block.text}</h2>;
    case 'h3':
      return <h3 className="mt-8 text-xl font-extrabold text-navy-900">{block.text}</h3>;
    case 'list':
      return (
        <ul className="mt-4 space-y-2.5">
          {block.items.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-base leading-7 text-navy-800">
              <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-gold-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case 'quote':
      return (
        <blockquote className="mt-6 rounded-2xl border-s-4 border-gold-500 bg-gold-50 px-5 py-4 text-base font-bold leading-8 text-gold-900">
          {block.text}
        </blockquote>
      );
    case 'p':
      return <p className="mt-4 text-base leading-8 text-navy-800">{block.text}</p>;
  }
}

export default async function BlogPostPage({params}: Props) {
  const {locale: rawLocale, slug} = await params;
  if (!hasLocale(routing.locales, rawLocale)) {
    notFound();
  }
  const locale: AppLocale = rawLocale;
  setRequestLocale(locale);

  const post = getBlogPost(slug);
  if (!post) {
    notFound();
  }

  const t = await getTranslations('blog');
  const tSeo = await getTranslations('seo');
  const content = post[locale];
  const isAr = locale === 'ar';
  const dateFmt = new Intl.DateTimeFormat(isAr ? 'ar-DZ' : 'fr-DZ', {dateStyle: 'long'});
  const wilaya = post.wilayaCode !== null ? getWilaya(post.wilayaCode) : undefined;

  const breadcrumbLd = breadcrumbJsonLd([
    {name: tSeo('breadcrumbHome'), path: '/', locale},
    {name: tSeo('breadcrumbBlog'), path: '/blog', locale},
    {name: content.title, path: `/blog/${post.slug}`, locale}
  ]);
  const articleLd = articleJsonLd({
    headline: content.seoTitle,
    description: content.seoDescription,
    path: `/blog/${post.slug}`,
    locale,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    coverAbsoluteUrl: post.coverImageUrl
      ? absoluteUrl(post.coverImageUrl, locale)
      : null,
    section: content.category,
    keywords: content.tags
  });

  return (
    <>
      <JsonLd data={organizationWithIdJsonLd()} />
      <JsonLd data={breadcrumbLd} />
      <JsonLd data={articleLd} />

      <article className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-navy-900"
        >
          <ArrowLeft className="size-4 ltr:rotate-180 rtl:rotate-0" aria-hidden="true" />
          {t('backToBlog')}
        </Link>

        <header className="mt-6">
          <span className="inline-flex rounded-full bg-navy-900 px-3 py-1 text-xs font-extrabold text-gold-300">
            {content.category}
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-snug text-navy-900 sm:text-4xl sm:leading-snug">
            {content.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3.5" aria-hidden="true" />
              {t('publishedOn', {date: dateFmt.format(new Date(post.publishedAt))})}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden="true" />
              {t('minRead', {minutes: readingTimeMinutes(post, locale)})}
            </span>
            {wilaya ? (
              <Link
                href={`/wilayas/${wilaya.slug}`}
                className="inline-flex items-center gap-1 text-gold-700 transition-colors hover:text-gold-600"
              >
                <MapPin className="size-3.5" aria-hidden="true" />
                {isAr ? wilaya.nameAr : wilaya.nameFr}
              </Link>
            ) : null}
          </div>
        </header>

        {post.coverImageUrl ? (
          <div className="mt-8 overflow-hidden rounded-3xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element -- غلاف محلي ثابت */}
            <img
              src={post.coverImageUrl}
              alt={t('coverAlt', {title: content.title})}
              className="aspect-16/9 w-full object-cover"
              loading="eager"
            />
          </div>
        ) : null}

        <div className="mt-8">
          {content.blocks.map((block, index) => (
            <Block key={index} block={block} />
          ))}
        </div>

        <footer className="mt-12 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground">
              <Tag className="size-3.5" aria-hidden="true" />
              {t('tagsLabel')}:
            </span>
            {content.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-3 py-1 text-[11px] font-bold text-navy-800"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/publish"
              className="rounded-2xl bg-navy-900 p-5 text-white transition-colors hover:bg-navy-800"
            >
              <p className="text-sm font-bold text-navy-200">{t('ctaTitle')}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 font-extrabold text-gold-400">
                {t('ctaPublish')}
                <ArrowLeft className="size-4 ltr:rotate-180 rtl:rotate-0" aria-hidden="true" />
              </p>
            </Link>
            <Link
              href="/search"
              className="rounded-2xl border border-border bg-card p-5 transition-colors hover:bg-muted"
            >
              <p className="text-sm font-bold text-muted-foreground">{t('ctaTitle')}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 font-extrabold text-navy-900">
                {t('ctaSearch')}
                <ArrowLeft className="size-4 ltr:rotate-180 rtl:rotate-0" aria-hidden="true" />
              </p>
            </Link>
          </div>
        </footer>
      </article>
    </>
  );
}
