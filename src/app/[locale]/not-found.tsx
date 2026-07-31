import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';

/** 404 داخل سياق اللغة (يُستخدم أيضاً عند لغة غير صالحة) */
export default function NotFound() {
  const t = useTranslations('notFound');

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <span aria-hidden="true" className="text-6xl font-black text-gold-500">
        404
      </span>
      <h1 className="text-2xl font-extrabold text-navy-900">{t('title')}</h1>
      <p className="text-muted-foreground">{t('description')}</p>
      <Link
        href="/"
        className="mt-2 rounded-xl bg-navy-900 px-6 py-3 font-bold text-white transition-colors hover:bg-navy-800"
      >
        {t('backHome')}
      </Link>
    </div>
  );
}
