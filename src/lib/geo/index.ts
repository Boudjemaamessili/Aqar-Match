/**
 * واجهة البيانات الجغرافية الموحّدة (ولايات + بلديات).
 * بيانات خالصة بلا اتصال بقاعدة البيانات — تصلح للواجهة (SSG) وللبذر معاً.
 */
import {COMMUNES, type CommuneRecord} from './communes';
import {ACTIVE_WILAYAS, getWilaya, isActiveWilaya} from './wilayas';

export {ACTIVE_WILAYAS, COMMUNES, getWilaya, isActiveWilaya};
export type {ActiveWilayaCode} from './wilayas';
export type {CommuneRecord};
export type {WilayaRecord} from './wilayas';

export const TOTAL_COMMUNES = COMMUNES.length;

const BY_WILAYA = new Map<number, CommuneRecord[]>();
const BY_ID = new Map<number, CommuneRecord>();
for (const commune of COMMUNES) {
  const list = BY_WILAYA.get(commune.wilayaCode);
  if (list) {
    list.push(commune);
  } else {
    BY_WILAYA.set(commune.wilayaCode, [commune]);
  }
  BY_ID.set(commune.id, commune);
}

/** كل بلديات ولاية (مرتّبة بالمعرف الرسمي) */
export function communesOfWilaya(wilayaCode: number): readonly CommuneRecord[] {
  return BY_WILAYA.get(wilayaCode) ?? [];
}

/** بلدية بمعرّفها الرسمي */
export function getCommune(id: number): CommuneRecord | undefined {
  return BY_ID.get(id);
}
