'use client';

/**
 * SearchView — واجهة بحث المشتري (المرحلة 5).
 * نموذج واحد واضح (وليس معالجاً — حقول قليلة) ← POST /api/searches
 * ← بطاقات النتائج الفورية (أفضل 10 بتاتاً — المحرك يضمن).
 * ميزانية المشتري لا تظهر للبائع إطلاقاً (تفاوض أعمى متماثل).
 */
import {useCallback, useMemo, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {
  AlertTriangle,
  Bath,
  BedDouble,
  Check,
  Clock,
  Info,
  Loader2,
  Lock,
  MapPin,
  Ruler,
  Search,
  ShieldCheck,
  SlidersHorizontal
} from 'lucide-react';
import {Link} from '@/i18n/navigation';
import {ACTIVE_WILAYAS, communesOfWilaya} from '@/lib/geo';
import {PROPERTY_TYPE_RULES, type DealType, type PropertyType} from '@/lib/matching';
import {MAX_SEARCH_NEIGHBORHOODS} from '@/lib/matches/constants';
import {parseAmountNumber} from '@/lib/properties/normalize';
import {DEAL_TYPES} from '@/lib/properties/constants';

/** مفاتيح حالات المطابقة — تُقيد رسائل الترجمة بنيوياً */
export type MatchStatusKey =
  | 'SELLER_NOTIFIED'
  | 'SELLER_AGREED'
  | 'BUYER_PAID'
  | 'CONTACT_REVEALED'
  | 'EXPIRED'
  | 'CANCELLED';

// ─── الأنواع (مرآة استجابات الـ API) ────────────────────────────────────────

export interface BuyerMatchProperty {
  readonly id: string;
  readonly titleAr: string;
  readonly transactionType: DealType;
  readonly propertyType: PropertyType;
  readonly askingPrice: number;
  readonly currency: string;
  readonly primaryImageUrl: string | null;
  readonly areaM2: number | null;
  readonly rooms: number | null;
  readonly bathrooms: number | null;
  readonly neighborhood: string | null;
  readonly wilaya: {readonly code: number; readonly nameAr: string; readonly nameFr: string};
  readonly commune: {readonly id: number; readonly nameAr: string; readonly nameFr: string};
}

export interface BuyerMatchItem {
  readonly id: string;
  readonly status: string;
  readonly displayedScore: number;
  readonly property: BuyerMatchProperty;
}

interface SearchCreatedResponse {
  readonly search: {readonly id: string};
  readonly matchesCreated: number;
  readonly matches: readonly BuyerMatchItem[];
}

interface ApiFail {
  readonly code: string;
  readonly issueToken?: string;
}

const MATCH_ERROR_CODES = [
  'INVALID_JSON',
  'VALIDATION_ERROR',
  'RATE_LIMITED',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'CSRF_ORIGIN_MISMATCH',
  'CONFLICT',
  'NOT_FOUND',
  'TYPE_NOT_ALLOWED',
  'INVALID_WILAYA',
  'INVALID_COMMUNE',
  'COMMUNE_WILAYA_MISMATCH',
  'BUDGET_BELOW_FLOOR',
  'INTERNAL'
] as const;
type MatchErrorCode = (typeof MATCH_ERROR_CODES)[number];

function parseApiError(payload: unknown): ApiFail {
  if (typeof payload === 'object' && payload !== null && (payload as {ok?: unknown}).ok === false) {
    const error = (payload as {error?: {code?: unknown; details?: unknown}}).error;
    const code = typeof error?.code === 'string' ? error.code : 'INTERNAL';
    const details = error?.details as {issues?: Array<{message?: unknown}>} | undefined;
    const firstMessage = details?.issues?.[0]?.message;
    const issueToken =
      typeof firstMessage === 'string' && MATCH_ERROR_CODES.includes(firstMessage as MatchErrorCode)
        ? firstMessage
        : undefined;
    return {code, issueToken};
  }
  return {code: 'INTERNAL'};
}

const inputClass =
  'w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-navy-900 outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30';

export function localizedGeoName(
  locale: string,
  record: {readonly nameAr: string; readonly nameFr: string}
): string {
  return locale === 'ar' ? record.nameAr : record.nameFr;
}

/** بطاقة مطابقة (تُعاد استخدامها في صندوق المشتري أيضاً) */
export function BuyerMatchCard(props: {
  readonly match: BuyerMatchItem;
  readonly formatDzd: (v: number) => string;
  readonly locale: string;
  readonly actions?: React.ReactNode;
  readonly footer?: React.ReactNode;
}) {
  const tStatus = useTranslations('match.status');
  const tTypes = useTranslations('publish.types');
  const tSearch = useTranslations('search');
  const {match, formatDzd, locale} = props;
  const p = match.property;
  const statusKey = match.status as MatchStatusKey;

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-16/10 bg-muted">
        {p.primaryImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- صور داخلية مضغوطة، sizes متغيرة
          <img src={p.primaryImageUrl} alt={p.titleAr} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <MapPin className="size-8" aria-hidden="true" />
          </div>
        )}
        <span className="absolute end-2 top-2 rounded-full bg-navy-900/90 px-3 py-1 text-xs font-extrabold text-gold-300">
          {tSearch('scorePoints', {score: match.displayedScore})}
        </span>
        <span className="absolute start-2 top-2 rounded-full bg-card/95 px-2.5 py-1 text-[11px] font-bold text-navy-800">
          {tTypes(`deal.${p.transactionType}`)}
        </span>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h3 className="line-clamp-1 font-extrabold text-navy-900">{p.titleAr}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
            <MapPin className="size-3.5" aria-hidden="true" />
            {localizedGeoName(locale, p.wilaya)} — {localizedGeoName(locale, p.commune)}
            {p.neighborhood ? ` · ${p.neighborhood}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 text-xs font-bold text-navy-800">
          {p.areaM2 !== null ? (
            <span className="inline-flex items-center gap-1">
              <Ruler className="size-3.5 text-gold-600" aria-hidden="true" />
              {p.areaM2} م²
            </span>
          ) : null}
          {p.rooms !== null ? (
            <span className="inline-flex items-center gap-1">
              <BedDouble className="size-3.5 text-gold-600" aria-hidden="true" />
              {p.rooms}
            </span>
          ) : null}
          {p.bathrooms !== null ? (
            <span className="inline-flex items-center gap-1">
              <Bath className="size-3.5 text-gold-600" aria-hidden="true" />
              {p.bathrooms}
            </span>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border/70 pt-3">
          <p className="text-lg font-extrabold text-navy-900" dir="ltr">
            {formatDzd(p.askingPrice)}
          </p>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${
              match.status === 'CONTACT_REVEALED'
                ? 'bg-gold-100 text-gold-800'
                : match.status === 'SELLER_NOTIFIED'
                  ? 'bg-navy-100 text-navy-800'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {tStatus(statusKey)}
          </span>
        </div>

        {props.actions ? <div>{props.actions}</div> : null}
        {props.footer}
      </div>
    </article>
  );
}

export function SearchView() {
  const t = useTranslations('search');
  const tTypes = useTranslations('publish.types');
  const tErrors = useTranslations('match.errors');
  const locale = useLocale();

  const [dealType, setDealType] = useState<DealType>('SALE');
  const [propertyType, setPropertyType] = useState<PropertyType>('APARTMENT');
  const [wilaya, setWilaya] = useState<number>(16);
  const [commune, setCommune] = useState<number | null>(null);
  const [neighborhoods, setNeighborhoods] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [minArea, setMinArea] = useState('');
  const [minRooms, setMinRooms] = useState('');
  const [minBathrooms, setMinBathrooms] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorCode, setErrorCode] = useState<MatchErrorCode | null>(null);
  const [result, setResult] = useState<SearchCreatedResponse | null>(null);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale === 'ar' ? 'ar-DZ-u-nu-latn' : 'fr-DZ-u-nu-latn', {
        style: 'currency',
        currency: 'DZD',
        maximumFractionDigits: 0
      }),
    [locale]
  );
  const formatDzd = useCallback((v: number) => currencyFormatter.format(v), [currencyFormatter]);

  const allowedTypes = PROPERTY_TYPE_RULES[dealType];
  const communes = communesOfWilaya(wilaya);

  const budgetNumber = useMemo(() => {
    const parsed = maxBudget.trim() === '' ? null : parseAmountNumber(maxBudget);
    return parsed !== null && parsed > 0 ? Math.round(parsed) : null;
  }, [maxBudget]);

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (busy || budgetNumber === null) return;
    setBusy(true);
    setErrorCode(null);
    try {
      const neighborhoodsList = neighborhoods
        .split(/[،,;]/)
        .map((n) => n.trim())
        .filter((n) => n.length > 0)
        .slice(0, MAX_SEARCH_NEIGHBORHOODS);
      const payload = {
        dealType,
        propertyType,
        wilaya,
        commune: commune ?? undefined,
        neighborhoods: neighborhoodsList,
        maxBudget: budgetNumber,
        minAreaM2: minArea.trim() === '' ? undefined : (parseAmountNumber(minArea) ?? undefined),
        minRooms: minRooms.trim() === '' ? undefined : (parseAmountNumber(minRooms) ?? undefined),
        minBathrooms: minBathrooms.trim() === '' ? undefined : (parseAmountNumber(minBathrooms) ?? undefined)
      };
      const response = await fetch('/api/searches', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const fail = parseApiError(body);
        const token = fail.issueToken ?? fail.code;
        setErrorCode(MATCH_ERROR_CODES.includes(token as MatchErrorCode) ? (token as MatchErrorCode) : 'INTERNAL');
        return;
      }
      setResult((body as {data: SearchCreatedResponse}).data);
    } catch {
      setErrorCode('INTERNAL');
    } finally {
      setBusy(false);
    }
  }

  // ─── شاشة النتائج ────────────────────────────────────────────────────────
  if (result) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-navy-900">{t('resultsTitle')}</h1>
            <p className="mt-1 text-sm font-bold text-gold-700">{t('matchesFound', {count: result.matchesCreated})}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setResult(null)}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-navy-900 transition-colors hover:bg-muted"
            >
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              {t('adjustSearch')}
            </button>
            <Link
              href="/matches"
              className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-navy-800"
            >
              {t('viewInbox')}
            </Link>
          </div>
        </div>

        {result.matches.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-border bg-card p-10 text-center">
            <Info className="mx-auto size-10 text-gold-600" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-extrabold text-navy-900">{t('noMatchesTitle')}</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-muted-foreground">{t('noMatchesDesc')}</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {result.matches.map((match) => (
              <BuyerMatchCard
                key={match.id}
                match={match}
                formatDzd={formatDzd}
                locale={locale}
                footer={
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                    <Clock className="size-3.5" aria-hidden="true" />
                    {t('respondBy')}
                  </p>
                }
              />
            ))}
          </div>
        )}

        <p className="mt-8 flex items-start gap-2 text-xs leading-6 text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-gold-600" aria-hidden="true" />
          {t('feeZero')}
        </p>
      </section>
    );
  }

  // ─── نموذج البحث ─────────────────────────────────────────────────────────
  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold text-navy-900">{t('title')}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">{t('subtitle')}</p>
      </header>

      <form onSubmit={submit} className="mt-8 space-y-6 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        {/* المعاملة والنوع */}
        <div className="space-y-2">
          <span className="text-sm font-bold text-navy-900">{t('fields.dealType')}</span>
          <div className="flex flex-wrap gap-2">
            {DEAL_TYPES.map((deal) => (
              <button
                key={deal}
                type="button"
                aria-pressed={dealType === deal}
                onClick={() => {
                  setDealType(deal);
                  if (!PROPERTY_TYPE_RULES[deal].includes(propertyType)) {
                    setPropertyType(PROPERTY_TYPE_RULES[deal][0]!);
                  }
                }}
                className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors ${
                  dealType === deal
                    ? 'border-gold-500 bg-gold-50 text-navy-900 ring-2 ring-gold-500/30'
                    : 'border-border bg-card text-muted-foreground hover:border-gold-300 hover:text-navy-900'
                }`}
              >
                {tTypes(`deal.${deal}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-sm font-bold text-navy-900">{t('fields.propertyType')}</span>
          <div className="flex flex-wrap gap-2">
            {allowedTypes.map((type) => (
              <button
                key={type}
                type="button"
                aria-pressed={propertyType === type}
                onClick={() => setPropertyType(type)}
                className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors ${
                  propertyType === type
                    ? 'border-gold-500 bg-gold-50 text-navy-900 ring-2 ring-gold-500/30'
                    : 'border-border bg-card text-muted-foreground hover:border-gold-300 hover:text-navy-900'
                }`}
              >
                {tTypes(`property.${type}`)}
              </button>
            ))}
          </div>
        </div>

        {/* الموقع */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="s-wilaya" className="text-sm font-bold text-navy-900">
              {t('fields.wilaya')}
            </label>
            <select
              id="s-wilaya"
              className={inputClass}
              value={wilaya}
              onChange={(e) => {
                setWilaya(Number(e.target.value));
                setCommune(null);
              }}
            >
              {ACTIVE_WILAYAS.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.code} — {locale === 'ar' ? w.nameAr : w.nameFr}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="s-commune" className="text-sm font-bold text-navy-900">
              {t('fields.commune')}
            </label>
            <select
              id="s-commune"
              className={inputClass}
              value={commune ?? ''}
              onChange={(e) => setCommune(e.target.value === '' ? null : Number(e.target.value))}
            >
              <option value="">{t('fields.allCommunes')}</option>
              {communes.map((c) => (
                <option key={c.id} value={c.id}>
                  {locale === 'ar' ? c.nameAr : c.nameFr}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="s-neighborhoods" className="text-sm font-bold text-navy-900">
            {t('fields.neighborhoods')}
          </label>
          <input
            id="s-neighborhoods"
            className={inputClass}
            value={neighborhoods}
            placeholder={t('fields.neighborhoodsPlaceholder')}
            onChange={(e) => setNeighborhoods(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">{t('fields.neighborhoodsHint')}</p>
        </div>

        {/* الميزانية */}
        <div className="space-y-2">
          <label htmlFor="s-budget" className="text-sm font-bold text-navy-900">
            {t('fields.maxBudget')} <span className="text-gold-600">*</span>
          </label>
          <input
            id="s-budget"
            type="text"
            inputMode="numeric"
            dir="ltr"
            required
            className={`${inputClass} text-left`}
            value={maxBudget}
            onChange={(e) => setMaxBudget(e.target.value)}
          />
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5" aria-hidden="true" />
            {t('fields.maxBudgetHint')}
          </p>
        </div>

        {/* تفضيلات مرنة */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-bold text-navy-900">{t('fields.preferences')}</legend>
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                ['s-area', t('fields.minArea'), minArea, setMinArea],
                ['s-rooms', t('fields.minRooms'), minRooms, setMinRooms],
                ['s-baths', t('fields.minBathrooms'), minBathrooms, setMinBathrooms]
              ] as const
            ).map(([id, label, value, setter]) => (
              <div key={id} className="space-y-1.5">
                <label htmlFor={id} className="block text-xs font-semibold text-muted-foreground">
                  {label}
                </label>
                <input
                  id={id}
                  type="text"
                  inputMode="decimal"
                  dir="ltr"
                  className={`${inputClass} px-3 py-2.5 text-left text-sm`}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                />
              </div>
            ))}
          </div>
        </fieldset>

        {errorCode ? (
          <p role="alert" className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
            <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
            {tErrors(errorCode)}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy || budgetNumber === null}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy-900 px-6 py-4 font-bold text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Search className="size-5" aria-hidden="true" />}
          {busy ? t('searching') : t('submit')}
        </button>

        <p className="flex items-start gap-2 text-xs leading-6 text-muted-foreground">
          <Check className="mt-0.5 size-4 shrink-0 text-gold-600" aria-hidden="true" />
          {t('feeZero')}
        </p>
      </form>
    </section>
  );
}
