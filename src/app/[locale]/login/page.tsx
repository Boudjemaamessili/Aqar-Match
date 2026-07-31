import type {Metadata} from 'next';
import {redirect} from 'next/navigation';
import {getTranslations} from 'next-intl/server';
import {localizedPath, toAppLocale} from '@/i18n/locale';
import {getSessionUserOrNull} from '@/lib/auth/session';
import {LogoMark} from '@/components/brand/logo';
import {LoginForm} from './login-form';

/**
 * صفحة الدخول — ديناميكية (تقرأ searchParams وتتحقق من الجلسة)،
 * ولا تُفهرس (noindex) لأنها مسار تطبيق لا محتوى.
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.login');
  return {
    title: t('metaTitle'),
    robots: {index: false, follow: false}
  };
}

type Props = {
  params: Promise<{locale: string}>;
  searchParams: Promise<{next?: string | string[]}>;
};

export default async function LoginPage({params, searchParams}: Props) {
  const [{locale: rawLocale}, sp] = await Promise.all([params, searchParams]);
  const locale = toAppLocale(rawLocale);

  // داخل أصلاً؟ ← مباشرة إلى الحساب
  const existing = await getSessionUserOrNull();
  if (existing) {
    redirect(localizedPath('/account', locale));
  }

  // next: مسار داخلي فقط (منع open-redirect)
  const rawNext = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  const next = rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : null;

  const t = await getTranslations('auth.login');

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-12 sm:py-16">
      <LogoMark className="size-14" />
      <h1 className="mt-4 text-2xl font-extrabold text-navy-900">{t('title')}</h1>
      <p className="mt-2 text-center text-sm leading-7 text-muted-foreground">{t('subtitle')}</p>
      <div className="mt-8 w-full">
        <LoginForm next={next} />
      </div>
    </div>
  );
}
