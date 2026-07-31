import type {Metadata} from 'next';
import {redirect} from 'next/navigation';
import {BadgeCheck, Handshake, Languages, LayoutDashboard, Phone, Search, UserRound, Waypoints} from 'lucide-react';
import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {localizedPath, toAppLocale} from '@/i18n/locale';
import {formatDzPhone} from '@/lib/auth/phone';
import {getSessionUserOrNull} from '@/lib/auth/session';
import {ClaimPropertiesButton} from './claim-properties';
import {LogoutButton} from './logout-button';

/**
 * حسابي — صفحة محمية (تحقق حقيقي من الجلسة هنا، وكوكي في proxy).
 * ديناميكية + noindex. لوحة التحكم الكاملة: المرحلة 6.
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.account');
  return {
    title: t('metaTitle'),
    robots: {index: false, follow: false}
  };
}

type Props = {
  params: Promise<{locale: string}>;
};

function InfoRow({icon, label, value}: {icon: React.ReactNode; label: string; value: React.ReactNode}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/70 py-3.5 last:border-0">
      <span className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-sm font-bold text-navy-900">{value}</span>
    </div>
  );
}

export default async function AccountPage({params}: Props) {
  const {locale: rawLocale} = await params;
  const locale = toAppLocale(rawLocale);
  const session = await getSessionUserOrNull();
  if (!session) {
    redirect(localizedPath('/login?next=/account', locale));
  }

  const {user} = session;
  const t = await getTranslations('auth.account');
  const tRoles = await getTranslations('auth.roles');
  const tSearch = await getTranslations('search');
  const tMatch = await getTranslations('match');
  const tDash = await getTranslations('dashboard');

  const memberSince = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', {
    dateStyle: 'long'
  }).format(user.createdAt);

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:py-16">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-navy-900 text-gold-400">
          <UserRound className="size-6" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">{user.name ?? t('title')}</h1>
          {user.isVerifiedAgency ? (
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-bold text-gold-700">
              <BadgeCheck className="size-4" aria-hidden="true" />
              {t('agencyVerified')}
            </p>
          ) : null}
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {t('profile')}
        </h2>
        <div className="mt-2">
          <InfoRow
            icon={<Phone className="size-4 text-gold-600" aria-hidden="true" />}
            label={t('phone')}
            value={<span dir="ltr">{formatDzPhone(user.phone)}</span>}
          />
          <InfoRow
            icon={<Waypoints className="size-4 text-gold-600" aria-hidden="true" />}
            label={t('role')}
            value={tRoles(user.role === 'admin' ? 'both' : user.role)}
          />
          <InfoRow
            icon={<Languages className="size-4 text-gold-600" aria-hidden="true" />}
            label={t('language')}
            value={user.preferredLocale === 'fr' ? t('frName') : t('arName')}
          />
          <InfoRow
            icon={<UserRound className="size-4 text-gold-600" aria-hidden="true" />}
            label={t('memberSince')}
            value={memberSince}
          />
        </div>
      </section>

      {/* المطالبة بالإعلانات المجهولة المنشورة برقم هذا الحساب (التصعيد) */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {t('claimTitle')}
        </h2>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">{t('claimDesc')}</p>
        <div className="mt-4">
          <ClaimPropertiesButton />
        </div>
      </section>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link
          href="/dashboard"
          className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 py-3.5 text-sm font-extrabold text-white transition-colors hover:bg-navy-800"
        >
          <LayoutDashboard className="size-4 text-gold-400" aria-hidden="true" />
          {tDash('metaTitle')}
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 py-3 text-sm font-extrabold text-white transition-colors hover:bg-navy-800"
        >
          <Search className="size-4" aria-hidden="true" />
          {tSearch('metaTitle')}
        </Link>
        <Link
          href="/matches"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-extrabold text-navy-900 transition-colors hover:bg-muted"
        >
          <Handshake className="size-4" aria-hidden="true" />
          {tMatch('title')}
        </Link>
      </div>

      <div className="mt-6">
        <LogoutButton />
      </div>
    </div>
  );
}
