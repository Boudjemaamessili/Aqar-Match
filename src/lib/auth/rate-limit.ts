/**
 * محدِّد معدل في الذاكرة (token bucket ثابت النافذة) — نقي وقابل للحقن الزمني.
 *
 * صالح لخادم واحد (تطوير/إقلاع أولي). عند التوسع الأفقي: استبدله
 * بمخزن مشترك (Redis) بنفس الواجهة — لا تغيّر نقاط الاستدعاء.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const SWEEP_INTERVAL_MS = 60_000;
let lastSweep = Date.now();

export interface RateLimitOutcome {
  readonly allowed: boolean;
  readonly remaining: number;
  /** متى تُصفَّر النافذة (ms epoch) */
  readonly resetAt: number;
}

/** كنس كسول للمفاتيح المنتهية — يمنع تضخّم الذاكرة */
function sweep(now: number): void {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * ضربة واحدة: مسموح إن لم يتجاوز limit داخل windowMs.
 * `now` قابل للحقن في الاختبارات لزمن حتمي.
 */
export function hitRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now()
): RateLimitOutcome {
  sweep(now);
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const fresh: Bucket = {count: 1, resetAt: now + windowMs};
    buckets.set(key, fresh);
    return {allowed: true, remaining: limit - 1, resetAt: fresh.resetAt};
  }
  if (existing.count >= limit) {
    return {allowed: false, remaining: 0, resetAt: existing.resetAt};
  }
  existing.count += 1;
  return {allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt};
}

/** ثوانٍ متبقية حتى التصفير — لرسائل 429 */
export function secondsUntilReset(resetAt: number, now: number = Date.now()): number {
  return Math.max(0, Math.ceil((resetAt - now) / 1000));
}
