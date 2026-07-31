import {clsx, type ClassValue} from 'clsx';
import {twMerge} from 'tailwind-merge';

/** دمج أصناف Tailwind مع حل التعارضات */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * تنسيق مبلغ بالدينار الجزائري حسب اللغة.
 * مثال: 10000 ← "10.000 دج" (ar-DZ) / "10 000 DA" (fr-DZ)
 */
export function formatDzd(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', {
    style: 'currency',
    currency: 'DZD',
    maximumFractionDigits: 0
  }).format(amount);
}
