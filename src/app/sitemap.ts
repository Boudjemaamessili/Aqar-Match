import type {MetadataRoute} from 'next';
import {buildSitemapEntries} from '@/lib/seo/sitemap-data';

/**
 * /sitemap.xml — مولَّد من مصدر البيانات الموحّد (نفس دوال الاختبارات).
 * كل إدخال يحمل hreflang كاملاً (ar/fr/x-default) ليقرأه غوغل مباشرة.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // MetadataRoute.Sitemap مصفوفة قابلة للتعديل؛ البنّاء يحمي ثوابته بـ readonly
  return [...buildSitemapEntries()];
}
