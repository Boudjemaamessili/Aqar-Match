/**
 * الولايات السبع النشطة — بيانات منتقاة يدوياً (curated).
 * البلديات المرتبطة بها: src/lib/geo/communes.ts (مُولَّد)
 */
export interface WilayaRecord {
  /** الرقم الرسمي للولاية (1..58) */
  readonly code: number;
  readonly slug: string;
  readonly nameAr: string;
  readonly nameFr: string;
}

export const ACTIVE_WILAYAS = [
  {code: 16, slug: 'alger', nameAr: 'الجزائر', nameFr: 'Alger'},
  {code: 9, slug: 'blida', nameAr: 'البليدة', nameFr: 'Blida'},
  {code: 26, slug: 'medea', nameAr: 'المدية', nameFr: 'Médéa'},
  {code: 31, slug: 'oran', nameAr: 'وهران', nameFr: 'Oran'},
  {code: 19, slug: 'setif', nameAr: 'سطيف', nameFr: 'Sétif'},
  {code: 25, slug: 'constantine', nameAr: 'قسنطينة', nameFr: 'Constantine'},
  {code: 23, slug: 'annaba', nameAr: 'عنابة', nameFr: 'Annaba'}
] as const satisfies readonly WilayaRecord[];

export type ActiveWilayaCode = (typeof ACTIVE_WILAYAS)[number]['code'];

const BY_CODE = new Map<number, WilayaRecord>(ACTIVE_WILAYAS.map((w) => [w.code, w]));

export function getWilaya(code: number): WilayaRecord | undefined {
  return BY_CODE.get(code);
}

export function isActiveWilaya(code: number): boolean {
  return BY_CODE.has(code);
}
