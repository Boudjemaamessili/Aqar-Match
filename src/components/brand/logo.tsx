import {cn} from '@/lib/utils';

/**
 * علامة عقار Match: سقف منزل يحتضن مفتاحاً —
 * المطابقة (السقف) وكشف التواصل (المفتاح) في أيقونة واحدة.
 */
export function LogoMark({className}: {className?: string}) {
  return (
    <svg viewBox="0 0 48 48" className={cn('size-9', className)} aria-hidden="true">
      <rect width="48" height="48" rx="12" className="fill-navy-900" />
      <path
        d="M11 26.5 24 14.5 37 26.5"
        fill="none"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-gold-500"
      />
      <circle
        cx="24"
        cy="27.5"
        r="4"
        fill="none"
        strokeWidth="2.6"
        className="stroke-gold-500"
      />
      <path
        d="M24 31.5v5.5m0-3h3.25"
        fill="none"
        strokeWidth="2.4"
        strokeLinecap="round"
        className="stroke-gold-500"
      />
    </svg>
  );
}
