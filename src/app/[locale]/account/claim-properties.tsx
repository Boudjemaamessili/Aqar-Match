'use client';

/**
 * زر المطالبة بالإعلانات المجهولة (التصعيد) — إجراء حسّاس بتأكيد بخطوتين.
 * يربط إعلانات الناشر المجهول التي تحمل رقم هاتفه (المُتحقَّق منه عبر OTP)
 * بحسابه ويرقّيها إلى ACTIVE فتصبح قابلة للرد على المطابقات.
 */
import {useState} from 'react';
import {AlertTriangle, CheckCircle2, Link2, Loader2} from 'lucide-react';
import {useTranslations} from 'next-intl';

type ClaimState =
  | {readonly kind: 'idle'}
  | {readonly kind: 'confirm'}
  | {readonly kind: 'busy'}
  | {readonly kind: 'done'; readonly claimed: number}
  | {readonly kind: 'error'; readonly code: string};

const KNOWN_ERROR_CODES = new Set([
  'UNAUTHENTICATED',
  'RATE_LIMITED',
  'CSRF_ORIGIN_MISMATCH',
  'INVALID_JSON',
  'VALIDATION_ERROR',
  'CONFLICT',
  'NOT_FOUND',
  'INTERNAL'
]);

function readErrorCode(payload: unknown): string {
  if (typeof payload === 'object' && payload !== null && (payload as {ok?: unknown}).ok === false) {
    const code = (payload as {error?: {code?: unknown}}).error?.code;
    if (typeof code === 'string' && KNOWN_ERROR_CODES.has(code)) return code;
  }
  return 'INTERNAL';
}

export function ClaimPropertiesButton() {
  const t = useTranslations('auth.account');
  const tErrors = useTranslations('auth.errors');
  const [state, setState] = useState<ClaimState>({kind: 'idle'});

  async function claim(): Promise<void> {
    setState({kind: 'busy'});
    try {
      const response = await fetch('/api/properties/claim-mine', {method: 'POST'});
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setState({kind: 'error', code: readErrorCode(payload)});
        return;
      }
      const claimed = (payload as {data: {claimed: number}}).data.claimed;
      setState({kind: 'done', claimed});
    } catch {
      setState({kind: 'error', code: 'INTERNAL'});
    }
  }

  // رسالة النتيجة النهائية (نجاح أو خطأ) مع إمكانية إعادة المحاولة عند الخطأ
  if (state.kind === 'done') {
    return (
      <p className="flex items-start gap-2 rounded-xl bg-gold-50 px-4 py-3 text-sm font-bold text-navy-900">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-gold-600" aria-hidden="true" />
        {state.claimed > 0 ? t('claimDone', {count: state.claimed}) : t('claimNone')}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {state.kind === 'confirm' || state.kind === 'busy' ? (
        <div className="rounded-xl border border-gold-300 bg-gold-50 p-4">
          <p className="flex items-start gap-2 text-sm font-bold leading-6 text-navy-900">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-gold-700" aria-hidden="true" />
            {t('claimConfirm')}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => void claim()}
              disabled={state.kind === 'busy'}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-extrabold text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {state.kind === 'busy' ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Link2 className="size-4" aria-hidden="true" />
              )}
              {state.kind === 'busy' ? t('claiming') : t('claimYes')}
            </button>
            <button
              type="button"
              onClick={() => setState({kind: 'idle'})}
              disabled={state.kind === 'busy'}
              className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-navy-900 transition-colors hover:bg-muted disabled:opacity-60"
            >
              {t('claimNo')}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setState({kind: 'confirm'})}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gold-500 bg-gold-50 px-4 py-3 text-sm font-extrabold text-navy-900 transition-colors hover:bg-gold-100"
        >
          <Link2 className="size-4 text-gold-700" aria-hidden="true" />
          {t('claimButton')}
        </button>
      )}

      {state.kind === 'error' ? (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
          {tErrors(state.code as 'INTERNAL')}
        </p>
      ) : null}
    </div>
  );
}
