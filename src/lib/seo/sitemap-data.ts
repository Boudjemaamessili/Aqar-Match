/**
 * بيانات Sitemap — بنّاء نقي (مختبَر وحداتياً) يجمع كل الروابط العامة
 * القابلة للفهرسة مع بدائل اللغتين. الصفحات الخاصة (account/dashboard/
 * matches/search/properties) لا تدخل هنا إطلاقاً — إنها noindex أصلاً.
 */
import {ACTIVE_WILAYAS} from '@/lib/geo';
import {listBlogPosts} from '@/lib/blog/posts';
import type {AppLocale} from '@/i18n/locale';
import {absoluteUrl, DEFAULT_LOCALE} from './site';

export interface SitemapEntry {
  readonly url: string;
  readonly lastModified: Date;
  readonly changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  readonly priority: number;
  readonly alternates: {readonly languages: Record<string, string>};
}

const OTHER_LOCALE: AppLocale = 'fr';

function entry(locale: AppLocale, path: string, priority: number, changeFrequency: SitemapEntry['changeFrequency'], lastModified: Date): SitemapEntry {
  return {
    url: absoluteUrl(path, locale),
    lastModified,
    changeFrequency,
    priority,
    alternates: {
      languages: {
        ar: absoluteUrl(path, 'ar'),
        fr: absoluteUrl(path, 'fr'),
        'x-default': absoluteUrl(path, DEFAULT_LOCALE)
      }
    }
  };
}

/** كلا اللغتين لمسار واحد */
function bothLocales(path: string, priority: number, changeFrequency: SitemapEntry['changeFrequency'], lastModified: Date): readonly SitemapEntry[] {
  return [
    entry('ar', path, priority, changeFrequency, lastModified),
    entry(OTHER_LOCALE, path, priority, changeFrequency, lastModified)
  ];
}

/**
 * الترتيب: الصفحة الرئيسية ← صفحات الولايات السبع ← المدونة والمقالات ← النشر.
 * (login مستبعد عمداً: صفحة إجرائية لا قيمة فهرسة لها)
 */
export function buildSitemapEntries(now: Date = new Date()): readonly SitemapEntry[] {
  return [
    ...bothLocales('/', 1.0, 'daily', now),
    ...ACTIVE_WILAYAS.flatMap((w) => bothLocales(`/wilayas/${w.slug}`, 0.9, 'weekly', now)),
    ...bothLocales('/blog', 0.8, 'weekly', now),
    ...listBlogPosts().flatMap((post) =>
      bothLocales(`/blog/${post.slug}`, 0.7, 'monthly', new Date(post.updatedAt))
    ),
    ...bothLocales('/publish', 0.8, 'monthly', now)
  ];
}
