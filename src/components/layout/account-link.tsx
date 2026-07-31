'use client';

/**
 * جزيرة عميلة صغيرة في الترويسة الساكنة:
 * تجلب /api/auth/me عند التحميل وتعرض «دخول» أو «حسابي (+الاسم)».
 * تحافظ على SSG للتخطيط الكامل — الجلسة تُكشف بعد hydration.
 */
import {useEffect, useState} from 'react';
import {UserRound} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';

interface MeResponse {
  readonly ok: boolean;
  readonly data?: {readonly user?: {readonly name: string | null}};
}

type State = 'loading' | 'anon' | 'user';

export function AccountLink() {
  const t = useTranslations('auth.header');
  const [state, setState] = useState<State>('loading');
  const [firstName, setFirstName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch('/api/auth/me', {cache: 'no-store'});
        if (!cancelled && response.ok) {
          const payload = (await response.json()) as MeResponse;
          const name = payload.data?.user?.name?.trim().split(/\s+/)[0];
          setFirstName(name ?? null);
          setState('user');
          return;
        }
      } catch {
        // شبكة متعثرة = مجهول مؤقتاً
      }
      if (!cancelled) setState('anon');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const baseClass =
    'inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-3.5 py-1.5 text-sm font-bold text-white transition-colors hover:bg-navy-800';

  if (state === 'loading') {
    return <span aria-hidden="true" className="h-8 w-20 animate-pulse rounded-full bg-muted" />;
  }

  if (state === 'user') {
    return (
      <Link href="/account" className={baseClass}>
        <UserRound className="size-4" aria-hidden="true" />
        <span className="max-w-24 truncate">{firstName ?? t('myAccount')}</span>
      </Link>
    );
  }

  return (
    <Link href="/login" className={baseClass}>
      <UserRound className="size-4" aria-hidden="true" />
      {t('login')}
    </Link>
  );
}
