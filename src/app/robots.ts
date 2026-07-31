import type {MetadataRoute} from 'next';
import {SITE_URL} from '@/lib/seo/site';

/**
 * /robots.txt — السماحية العامة مع منع الزحف على:
 *   - /api (نقاط داخلية بلا قيمة فهرسة)
 *   - الصفحات الخاصة/noindex (حزام احتياطي فوق ميتا noindex)
 *   - /login (صفحة إجرائية)
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/account',
        '/dashboard',
        '/matches',
        '/search',
        '/properties/',
        '/login',
        '/fr/account',
        '/fr/dashboard',
        '/fr/matches',
        '/fr/search',
        '/fr/properties/',
        '/fr/login'
      ]
    },
    sitemap: `${SITE_URL}/sitemap.xml`
  };
}
