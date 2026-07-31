/**
 * اختبارات طبقة SEO النقية — node:test (tsx --test).
 * روابط/hreflang + sitemap + JSON-LD + محتوى الولايات والمدونة + metadata.
 * بلا أي اعتماد على قاعدة أو Next — مدخلاتها كلها وحدات نقية.
 */
import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import {ACTIVE_WILAYAS} from '@/lib/geo';
import {getBlogPost, listBlogPosts, readingTimeMinutes} from '@/lib/blog/posts';
import {
  articleJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  organizationWithIdJsonLd,
  webSiteJsonLd
} from './jsonld';
import {buildPageMetadata, DEFAULT_OG_IMAGE} from './metadata';
import {buildSitemapEntries} from './sitemap-data';
import {absoluteUrl, languagesFor, localePath, ogLocale, SITE_URL} from './site';
import {allWilayaSeoContents, buildWilayaFaqs, getWilayaSeoContent} from './wilaya-content';

describe('site.ts — الصراحة اللغوية للروابط', () => {
  it('العربية بلا بادئة والفرنسية ببادئة', () => {
    assert.equal(localePath('/blog', 'ar'), '/blog');
    assert.equal(localePath('/blog', 'fr'), '/fr/blog');
    assert.equal(localePath('/', 'fr') === '/fr' || localePath('/', 'fr') === '/fr/', true);
    assert.equal(absoluteUrl('/blog', 'fr'), `${SITE_URL}/fr/blog`);
  });

  it('languagesFor تبني hreflang ثنائياً + x-default للعربية', () => {
    const langs = languagesFor('/wilayas/oran');
    assert.equal(langs['ar'], '/wilayas/oran');
    assert.equal(langs['fr'], '/fr/wilayas/oran');
    assert.equal(langs['x-default'], '/wilayas/oran');
  });

  it('ogLocale يعطي صيغ OpenGraph الصحيحة', () => {
    assert.equal(ogLocale('ar'), 'ar_DZ');
    assert.equal(ogLocale('fr'), 'fr_DZ');
  });
});

describe('sitemap-data — شجرة الفهرسة العامة', () => {
  const entries = buildSitemapEntries(new Date('2026-07-30T00:00:00Z'));

  it('العدد = لغتان × (رئيسية + 7 ولايات + مدونة + مقالات + نشر)', () => {
    const posts = listBlogPosts().length;
    assert.equal(entries.length, 2 * (1 + ACTIVE_WILAYAS.length + 1 + posts + 1));
  });

  it('كل الروابط مطلقة وبأولوية معقولة وبدائل اللغتين حاضرة', () => {
    for (const entry of entries) {
      assert.ok(entry.url.startsWith(SITE_URL), `رابط غير مطلق: ${entry.url}`);
      assert.ok(entry.priority >= 0 && entry.priority <= 1, `أولوية خارج النطاق: ${entry.url}`);
      assert.ok(entry.alternates.languages['ar']?.startsWith(SITE_URL));
      assert.ok(entry.alternates.languages['fr']?.startsWith(`${SITE_URL}/fr`));
      assert.equal(entry.alternates.languages['x-default'], entry.alternates.languages['ar']);
    }
  });

  it('الرئيسية أولاً وبأولوية قصوى، ولا مسارات خاصة إطلاقاً', () => {
    const first = entries[0];
    assert.ok(first);
    assert.equal(first.priority, 1.0);
    for (const entry of entries) {
      for (const privatePath of ['/account', '/dashboard', '/matches', '/search', '/properties/', '/login', '/api/']) {
        assert.equal(entry.url.includes(privatePath), false, `مسار خاص تسرّب للـ sitemap: ${entry.url}`);
      }
    }
  });
});

describe('jsonld — بنى Schema.org صالحة', () => {
  it('Breadcrumb بتسلسل مواقع صحيح', () => {
    const ld = breadcrumbJsonLd([
      {name: 'الرئيسية', path: '/', locale: 'ar'},
      {name: 'المدونة', path: '/blog', locale: 'ar'}
    ]);
    const items = ld['itemListElement'] as readonly {position: number; item: string}[];
    assert.deepEqual(items.map((i) => i.position), [1, 2]);
    assert.ok(items[1]?.item.startsWith(SITE_URL));
    assert.equal(ld['@type'], 'BreadcrumbList');
  });

  it('FAQPage بعدد الأسئلة + Article بكل الحقول الإلزامية', () => {
    const faq = faqJsonLd([{question: 'س؟', answer: 'ج.'}]);
    assert.equal((faq['mainEntity'] as unknown[]).length, 1);

    const article = articleJsonLd({
      headline: 'عنوان',
      description: 'وصف',
      path: '/blog/x',
      locale: 'ar',
      datePublished: '2026-07-12T09:00:00.000Z',
      dateModified: '2026-07-12T09:00:00.000Z',
      coverAbsoluteUrl: `${SITE_URL}/x.jpg`,
      section: 'أدلة',
      keywords: ['أ', 'ب']
    });
    assert.equal(article['@type'], 'Article');
    for (const key of ['headline', 'datePublished', 'dateModified', 'author', 'publisher', 'image']) {
      assert.ok(key in article, `حقل ناقص في Article: ${key}`);
    }
  });

  it('المؤسسة بمعرف @id ثابت ولا undefined في أي تسلسل', () => {
    const org = organizationWithIdJsonLd();
    assert.equal(org['@id'], `${SITE_URL}/#organization`);
    const all = [org, webSiteJsonLd('fr')];
    for (const ld of all) {
      assert.equal(JSON.stringify(ld).includes('undefined'), false, 'undefined في JSON-LD');
    }
  });
});

describe('wilaya-content — تغطية الولايات السبع كاملة', () => {
  it('كل ولاية نشطة لها افتتاحية عربية وفرنسية غنية', () => {
    const contents = allWilayaSeoContents();
    for (const w of ACTIVE_WILAYAS) {
      const found = getWilayaSeoContent(w.code);
      assert.ok(found, `ولاية بلا محتوى SEO: ${w.code}`);
      assert.ok(found.intro.ar.length >= 200, `افتتاحية عربية قصيرة لـ ${w.slug}`);
      assert.ok(found.intro.fr.length >= 200, `افتتاحية فرنسية قصيرة لـ ${w.slug}`);
    }
    assert.equal(contents.length, ACTIVE_WILAYAS.length);
  });

  it('الأسئلة الشائعة ثلاثة ومحلّية بالاسم وعدد البلديات', () => {
    const ar = buildWilayaFaqs({nameAr: 'وهران', nameFr: 'Oran'}, 26, 'ar');
    const fr = buildWilayaFaqs({nameAr: 'وهران', nameFr: 'Oran'}, 26, 'fr');
    assert.equal(ar.length, 3);
    assert.equal(fr.length, 3);
    assert.ok(ar.every((f) => f.answer.includes('وهران') || f.question.includes('وهران')));
    assert.ok(ar[1]?.answer.includes('26'), 'عدد البلديات غائب عن إجابة التغطية');
    assert.ok(fr.every((f) => f.question.includes('Oran') || f.answer.includes('Oran')));
  });
});

describe('blog/posts — سلامة المحتوى التحريري', () => {
  it('سلاجات فريدة وحقل عربي وفرنسي كاملان لكل مقال', () => {
    const posts = listBlogPosts();
    const slugs = new Set(posts.map((p) => p.slug));
    assert.equal(slugs.size, posts.length);
    for (const post of posts) {
      for (const locale of ['ar', 'fr'] as const) {
        const c = post[locale];
        assert.ok(c.title.length >= 10, `title قصير (${post.slug}/${locale})`);
        assert.ok(c.excerpt.length >= 80, `excerpt قصير (${post.slug}/${locale})`);
        assert.ok(c.seoTitle.length >= 30, `seoTitle قصير (${post.slug}/${locale})`);
        assert.ok(c.seoDescription.length >= 50 && c.seoDescription.length <= 165, `seoDescription خارج النطاق (${post.slug}/${locale})`);
        assert.ok(c.blocks.length >= 6, `متن ضحل (${post.slug}/${locale})`);
        assert.ok(c.tags.length >= 2);
        assert.ok(readingTimeMinutes(post, locale) >= 1);
      }
    }
  });

  it('الترتيب تنازلي بالنشر والوصول بالسلاج يعمل', () => {
    const posts = listBlogPosts();
    for (let i = 1; i < posts.length; i += 1) {
      assert.ok(
        (posts[i - 1]?.publishedAt ?? '') >= (posts[i]?.publishedAt ?? ''),
        'الترتيب ليس تنازلياً'
      );
    }
    const first = posts[0];
    assert.ok(first);
    assert.equal(getBlogPost(first.slug)?.slug, first.slug);
    assert.equal(getBlogPost('missing-slug-404'), undefined);
  });
});

describe('metadata — مساعد الصفحات الموحّد', () => {
  it('canonical حسب اللغة + hreflang + OG افتراضي', () => {
    const ar = buildPageMetadata({locale: 'ar', path: '/wilayas/alger', title: 'أ', description: 'ب'});
    const fr = buildPageMetadata({locale: 'fr', path: '/wilayas/alger', title: 'c', description: 'd'});
    assert.equal(ar.alternates?.canonical, '/wilayas/alger');
    assert.equal(fr.alternates?.canonical, '/fr/wilayas/alger');
    const languages = ar.alternates?.languages as unknown as Record<string, string>;
    assert.equal(languages['x-default'], '/wilayas/alger');
    const openGraph = ar.openGraph as unknown as {images: readonly {url: string}[]};
    assert.equal(openGraph.images[0]?.url, DEFAULT_OG_IMAGE);
  });

  it('فهرسة افتراضية true وقابلة للعكس صراحة', () => {
    const indexed = buildPageMetadata({locale: 'ar', path: '/blog', title: 'أ', description: 'ب'});
    const blocked = buildPageMetadata({locale: 'ar', path: '/blog', title: 'أ', description: 'ب', index: false});
    assert.deepEqual(indexed.robots, {index: true, follow: true});
    assert.deepEqual(blocked.robots, {index: false, follow: false});
  });
});
