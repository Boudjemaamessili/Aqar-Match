'use client';

/**
 * نموذج الدخول OTP — آلة حالة واضحة:
 *   phone (رقم+اسم+دور) → otp (رمز+عدّاد إعادة) → نجاح+تحويل.
 * كل أكواد أخطاء الخادم تُعرض مترجمة عبر auth.errors.
 */
import {useEffect, useRef, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useRouter as useRawRouter} from 'next/navigation';
import {Loader2, LogIn, Phone, RotateCcw, ShieldCheck, UserRound, Waypoints} from 'lucide-react';
import {useRouter} from '@/i18n/navigation';
import {REGISTERABLE_ROLES, OTP_CODE_LENGTH, type RegisterableRole} from '@/lib/auth/constants';

type Step = 'phone' | 'otp' | 'done';

interface RequestOtpData {
  readonly expiresInSeconds: number;
  readonly cooldownSeconds: number;
  readonly mock: boolean;
  readonly devCode?: string;
}

interface VerifyOtpData {
  readonly isNew: boolean;
}

interface ApiFail {
  readonly code: string;
  readonly details?: unknown;
}

const KNOWN_ERROR_CODES = [
  'INVALID_PHONE',
  'INVALID_JSON',
  'VALIDATION_ERROR',
  'RATE_LIMITED',
  'OTP_EXPIRED',
  'OTP_INVALID',
  'OTP_TOO_MANY',
  'NAME_REQUIRED',
  'OTP_PROVIDER_NOT_CONFIGURED',
  'ACCOUNT_DISABLED',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'CSRF_ORIGIN_MISMATCH',
  'INTERNAL'
] as const;
type KnownErrorCode = (typeof KNOWN_ERROR_CODES)[number];

function parseError(payload: unknown): ApiFail {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'ok' in payload &&
    (payload as {ok: unknown}).ok === false &&
    'error' in payload
  ) {
    const err = (payload as {error: {code?: unknown; details?: unknown}}).error;
    return {
      code: typeof err.code === 'string' ? err.code : 'INTERNAL',
      details: err.details
    };
  }
  return {code: 'INTERNAL'};
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw parseError(payload);
  }
  if (typeof payload === 'object' && payload !== null && (payload as {ok?: unknown}).ok === true) {
    return (payload as {data: T}).data;
  }
  throw {code: 'INTERNAL'} satisfies ApiFail;
}

export function LoginForm({next}: {readonly next: string | null}) {
  const t = useTranslations('auth.login');
  const tErrors = useTranslations('auth.errors');
  const tRoles = useTranslations('auth.roles');
  const locale = useLocale();
  const router = useRouter();
  const rawRouter = useRawRouter();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<RegisterableRole>('both');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [errorCode, setErrorCode] = useState<KnownErrorCode | null>(null);
  const [welcome, setWelcome] = useState<'new' | 'back' | null>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (step === 'otp') codeInputRef.current?.focus();
  }, [step]);

  function translateError(code: string): string {
    return KNOWN_ERROR_CODES.includes(code as KnownErrorCode)
      ? tErrors(code as KnownErrorCode)
      : tErrors('INTERNAL');
  }

  function handleError(err: unknown): void {
    const fail = err as ApiFail;
    setErrorCode(
      KNOWN_ERROR_CODES.includes(fail.code as KnownErrorCode) ? (fail.code as KnownErrorCode) : 'INTERNAL'
    );
  }

  async function submitPhone(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrorCode(null);
    try {
      const data = await postJson<RequestOtpData>('/api/auth/request-otp', {phone, locale});
      setDevCode(data.devCode ?? null);
      setCooldown(data.cooldownSeconds);
      setCode('');
      setStep('otp');
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }

  async function resend(): Promise<void> {
    if (busy || cooldown > 0) return;
    setBusy(true);
    setErrorCode(null);
    try {
      const data = await postJson<RequestOtpData>('/api/auth/request-otp', {phone, locale});
      setDevCode(data.devCode ?? null);
      setCooldown(data.cooldownSeconds);
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrorCode(null);
    try {
      const data = await postJson<VerifyOtpData>('/api/auth/verify-otp', {
        phone,
        code,
        name: name.trim() || undefined,
        role,
        locale
      });
      setWelcome(data.isNew ? 'new' : 'back');
      setStep('done');
      // نبّه قليلاً ثم حوّل — تجربة إنسانية بلا تشتيت
      setTimeout(() => {
        if (next) {
          rawRouter.push(next);
        } else {
          router.push('/account');
        }
        rawRouter.refresh();
      }, 700);
    } catch (err) {
      handleError(err);
      setBusy(false);
    }
  }

  const inputClass =
    'w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-navy-900 outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30';
  const primaryButtonClass =
    'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy-900 px-6 py-3.5 font-bold text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      {step !== 'otp' ? (
        <form onSubmit={submitPhone} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="phone" className="flex items-center gap-2 text-sm font-bold text-navy-900">
              <Phone className="size-4 text-gold-600" aria-hidden="true" />
              {t('phoneLabel')}
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              dir="ltr"
              inputMode="tel"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('phonePlaceholder')}
              className={`${inputClass} text-left`}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="name" className="flex items-center gap-2 text-sm font-bold text-navy-900">
              <UserRound className="size-4 text-gold-600" aria-hidden="true" />
              {t('nameLabel')}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              className={inputClass}
            />
            <p className="text-xs leading-6 text-muted-foreground">{t('nameHint')}</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="role" className="flex items-center gap-2 text-sm font-bold text-navy-900">
              <Waypoints className="size-4 text-gold-600" aria-hidden="true" />
              {t('roleLabel')}
            </label>
            <select
              id="role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value as RegisterableRole)}
              className={inputClass}
            >
              {REGISTERABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {tRoles(r)}
                </option>
              ))}
            </select>
          </div>

          {errorCode ? (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
              {translateError(errorCode)}
            </p>
          ) : null}

          <button type="submit" disabled={busy || phone.trim().length < 9} className={primaryButtonClass}>
            {busy ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <LogIn className="size-5" aria-hidden="true" />}
            {busy ? t('sending') : t('submit')}
          </button>

          <p className="flex items-start gap-2 text-xs leading-6 text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-gold-600" aria-hidden="true" />
            {t('secureNote')}
          </p>
        </form>
      ) : (
        <form onSubmit={submitCode} className="space-y-5">
          <div className="space-y-1 text-center">
            <h2 className="text-lg font-extrabold text-navy-900">{t('otpTitle')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('otpSentTo', {phone})}
            </p>
          </div>

          {devCode ? (
            <p dir="ltr" className="rounded-lg border border-gold-300 bg-gold-50 px-3 py-2 text-center font-mono text-sm font-bold text-gold-800">
              {t('devCodeHint', {code: devCode})}
            </p>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="otp" className="sr-only">
              {t('otpLabel')}
            </label>
            <input
              ref={codeInputRef}
              id="otp"
              name="otp"
              type="text"
              dir="ltr"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, OTP_CODE_LENGTH))}
              placeholder="••••••"
              className={`${inputClass} text-center font-mono text-2xl tracking-[0.6em]`}
            />
          </div>

          {errorCode ? (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">
              {translateError(errorCode)}
            </p>
          ) : null}

          <button type="submit" disabled={busy || code.length !== OTP_CODE_LENGTH} className={primaryButtonClass}>
            {busy ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : null}
            {busy ? t('verifying') : t('verify')}
          </button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={resend}
              disabled={busy || cooldown > 0}
              className="inline-flex items-center gap-1.5 font-semibold text-navy-700 transition-colors hover:text-gold-700 disabled:cursor-not-allowed disabled:text-muted-foreground"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              {cooldown > 0 ? t('resendIn', {seconds: cooldown}) : t('resend')}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('phone');
                setCode('');
                setErrorCode(null);
              }}
              className="font-semibold text-muted-foreground transition-colors hover:text-navy-900"
            >
              {t('changeNumber')}
            </button>
          </div>
        </form>
      )}

      {step === 'done' && welcome ? (
        <div className="mt-4 rounded-xl bg-navy-900 px-4 py-3 text-center font-bold text-gold-300" role="status">
          {welcome === 'new' ? t('welcomeNew') : t('welcomeBack')}
        </div>
      ) : null}
    </div>
  );
}
