import {defineRouting} from 'next-intl/routing';

/**
 * التوجيه الدولي:
 *  - ar لغة افتراضية بلا بادئة (/) — SEO أنظف للسوق الأساسي
 *  - fr ببادئة صريحة (/fr)
 */
export const routing = defineRouting({
  locales: ['ar', 'fr'],
  defaultLocale: 'ar',
  localePrefix: 'as-needed'
});
