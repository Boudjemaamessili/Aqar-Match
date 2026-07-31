import {routing} from '@/i18n/routing';
import messages from '../messages/ar.json';

/**
 * حقن أنواع next-intl: ترجمات مُتحقَّق منها (type-safe) ولغات مقيّدة.
 * المرجع هو ملف العربية؛ ملف الفرنسية يجب أن يطابقه بنيوياً.
 */
declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
