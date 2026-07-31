'use client';

import {useState} from 'react';
import {Loader2, LogOut} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {useRouter} from '@/i18n/navigation';

export function LogoutButton() {
  const t = useTranslations('auth.account');
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout(): Promise<void> {
    if (busy) return;
    setBusy(true);
    try {
      await fetch('/api/auth/logout', {method: 'POST'});
    } finally {
      // حتى مع فشل الشبكة نعيد التوجيه — الكوكي المحلي سينتهي
      router.push('/');
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-navy-900 px-6 py-3 font-bold text-navy-900 transition-colors hover:bg-navy-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {busy ? (
        <Loader2 className="size-5 animate-spin" aria-hidden="true" />
      ) : (
        <LogOut className="size-5" aria-hidden="true" />
      )}
      {busy ? t('loggingOut') : t('logout')}
    </button>
  );
}
