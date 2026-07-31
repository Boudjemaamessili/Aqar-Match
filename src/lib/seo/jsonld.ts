/**
 * بنّاءو Schema.org (JSON-LD) — دوال نقية تعيد كائنات عادية تُحقن كما هي
 * في <script type="application/ld+json">. لا أيّ حقول undefined: JSON.stringify
 * النهائي يجب أن يبقى صالحاً دائماً (مختبَر وحداتياً).
 */
import type {AppLocale} from '@/i18n/locale';
import {absoluteUrl, BRAND, ogLocale, SITE_URL} from './site';

/** كائن JSON-LD عام — نقيّد البنية الدنيا دون تبعية schema-dts */
export type JsonLdObject = Readonly<Record<string, unknown>>;

export interface JsonLdBreadcrumbItem {
  readonly name: string;
  /// مسار نسبي (ar) أو مبادّأ بلغة (فر) — يُحوَّل لمطلق داخلياً
  readonly path: string;
  readonly locale: AppLocale;
}

export function organizationJsonLd(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND.name,
    alternateName: BRAND.latinName,
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    areaServed: { '@type': 'Country', name: 'Algeria' }
  };
}

export function webSiteJsonLd(locale: AppLocale): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BRAND.name,
    url: absoluteUrl('/', locale),
    inLanguage: ogLocale(locale),
    publisher: {'@id': `${SITE_URL}/#organization`}
  };
}

/** نحذف @id المفقود تلقائياً: Organization مستقل مكتمل بذاته */
export function organizationWithIdJsonLd(): JsonLdObject {
  return {
    ...organizationJsonLd(),
    '@id': `${SITE_URL}/#organization`
  };
}

export function breadcrumbJsonLd(items: readonly JsonLdBreadcrumbItem[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path, item.locale)
    }))
  };
}

export interface JsonLdArticleInput {
  readonly headline: string;
  readonly description: string;
  readonly path: string;
  readonly locale: AppLocale;
  readonly datePublished: string;
  readonly dateModified: string;
  readonly coverAbsoluteUrl: string | null;
  readonly section: string;
  readonly keywords: readonly string[];
}

export function articleJsonLd(input: JsonLdArticleInput): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    description: input.description,
    mainEntityOfPage: absoluteUrl(input.path, input.locale),
    inLanguage: ogLocale(input.locale),
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    articleSection: input.section,
    keywords: input.keywords.join(', '),
    ...(input.coverAbsoluteUrl !== null ? {image: [input.coverAbsoluteUrl]} : {}),
    author: { '@type': 'Organization', name: BRAND.name, url: SITE_URL },
    publisher: {'@id': `${SITE_URL}/#organization`}
  };
}

export interface JsonLdFaqItem {
  readonly question: string;
  readonly answer: string;
}

export function faqJsonLd(items: readonly JsonLdFaqItem[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {'@type': 'Answer', text: item.answer}
    }))
  };
}
