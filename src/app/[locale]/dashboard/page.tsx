import type {Metadata} from 'next';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {hasLocale} from 'next-intl';
import {notFound} from 'next/navigation';
import {DashboardView} from '@/components/views/dashboard';
import {routing} from '@/i18n/routing';
import {toPublicUser} from '@/lib/auth/serializers';
import {getSessionUserOrNull} from '@/lib/auth/session';

/**
 * لوحة التحكم — محمية (proxy يفحص الكوكي؛ هنا تحقق حقيقي من الجلسة).
 * الصفحة لا تعيد التوجيه: تمرّر المستخدم (أو null) للواجهة العميلة التي
 * تعرض بطاقة «يتطلب الدخول» — قرار المرحلة 6 المعتمد في المواصفة.
 * ديناميكية + noindex.
 */
export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{locale: string}>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dashboard');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    robots: {index: false, follow: false}
  };
}

export default async function DashboardPage({params}: Props) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const session = await getSessionUserOrNull();
  return <DashboardView initialUser={session ? toPublicUser(session.user) : null} />;
}
