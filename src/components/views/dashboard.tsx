'use client';

/**
 * DashboardView — لوحة تحكم المستخدم (المرحلة 6).
 * تعتمد هوية المستخدم من مخزن Zustand (يُحقن من الخادم بعد تحقق الجلسة)،
 * وتجلب بياناتها من GET /api/dashboard?phone=… ثم تعرض ثلاثة أقسام:
 *   عقاراتي · طلباتي · مطابقاتي (جهتا المشتري والبائع)
 * حالات واضحة: تحميل / خطأ + إعادة / فارغ برسائل ودية / يتطلب دخولاً.
 * الإجراءات الحسّاسة (موافقة/إلغاء/كشف) تبقى في صندوق المطابقات — لا تكرار منطق.
 */
import {useCallback, useEffect, useMemo, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {
  AlertTriangle,
  ArrowLeft,
  BedDouble,
  Building2,
  Clock,
  Eye,
  Handshake,
  LayoutDashboard,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Ruler,
  Search,
  ShieldCheck,
  UserRound
} from 'lucide-react';
import {Link} from '@/i18n/navigation';
import type {PublicUser} from '@/lib/auth/serializers';
import {getCommune, getWilaya} from '@/lib/geo';
import type {DealType, PropertyType} from '@/lib/matching';
import {useUserStore} from '@/stores/user-store';
import {formatDzd} from '@/lib/utils';
import {
  BuyerMatchCard,
  localizedGeoName,
  type BuyerMatchItem,
  type MatchStatusKey
} from './search';

// ─── أنواع مرآة استجابة الـ API ──────────────────────────────────────────────

type PropertyStatusKey = 'ACTIVE' | 'UNMONITORED' | 'PAUSED' | 'SOLD' | 'RENTED' | 'WITHDRAWN';
type SearchStatusKey = 'ACTIVE' | 'PAUSED' | 'FULFILLED' | 'CANCELLED';
type AccountTypeKey = 'INDIVIDUAL' | 'AGENCY';
type ConditionKey = 'NEW' | 'GOOD' | 'RENOVATED' | 'TO_RENOVATE' | 'UNDER_CONSTRUCTION';

const DASHBOARD_ERROR_CODES = ['UNAUTHENTICATED', 'FORBIDDEN', 'RATE_LIMITED', 'CONFLICT', 'NOT_FOUND', 'INTERNAL', 'NETWORK'] as const;
type DashboardErrorCode = (typeof DASHBOARD_ERROR_CODES)[number];

interface DashboardPropertyItem {
  readonly id: string;
  readonly transactionType: DealType;
  readonly propertyType: PropertyType;
  readonly condition: ConditionKey;
  readonly status: PropertyStatusKey;
  readonly accountType: AccountTypeKey;
  readonly wilaya: {readonly code: number; readonly nameAr: string; readonly nameFr: string};
  readonly commune: {readonly id: number; readonly nameAr: string; readonly nameFr: string};
  readonly neighborhood: string | null;
  readonly titleAr: string;
  readonly areaM2: number | null;
  readonly rooms: number | null;
  readonly askingPrice: number;
  readonly currency: string;
  readonly views: number;
  readonly matchesCount: number;
  readonly imagesCount: number;
  readonly primaryImageUrl: string | null;
  readonly ownerPhoneMasked: string | null;
  readonly createdAt: string;
}

interface DashboardSearchItem {
  readonly id: string;
  readonly status: SearchStatusKey;
  readonly transactionType: DealType;
  readonly propertyType: PropertyType;
  readonly wilayaCode: number;
  readonly communeId: number | null;
  readonly neighborhoods: readonly string[];
  readonly maxBudget: number;
  readonly minAreaM2: number | null;
  readonly minRooms: number | null;
  readonly minBathrooms: number | null;
  readonly matchesCount: number;
  readonly awaitingCount: number;
  readonly createdAt: string;
}

interface DashboardBuyerMatch extends BuyerMatchItem {
  readonly respondBy: string | null;
  readonly sellerAgreedAt: string | null;
  readonly revealedAt: string | null;
}

interface DashboardSellerMatch {
  readonly id: string;
  readonly status: MatchStatusKey;
  readonly displayedScore: number;
  readonly feeSeller: number;
  readonly respondBy: string | null;
  readonly sellerAgreedAt: string | null;
  readonly revealedAt: string | null;
  readonly buyerMaskedName: string;
  readonly property: {
    readonly id: string;
    readonly titleAr: string;
    readonly transactionType: DealType;
    readonly propertyType: PropertyType;
    readonly askingPrice: number;
    readonly primaryImageUrl: string | null;
  };
  readonly createdAt: string;
}

interface DashboardApiData {
  readonly properties: readonly DashboardPropertyItem[];
  readonly searches: readonly DashboardSearchItem[];
  readonly matches: readonly DashboardBuyerMatch[];
  readonly sellerMatches: readonly DashboardSellerMatch[];
  readonly summary: {
    readonly propertiesCount: number;
    readonly searchesCount: number;
    readonly matchesCount: number;
    readonly pendingCount: number;
  };
}

type DashboardTab = 'properties' | 'searches' | 'matches';

// ─── أدوات عرض صغيرة ─────────────────────────────────────────────────────────

function parseDashboardError(status: number, payload: unknown): DashboardErrorCode {
  if (typeof payload === 'object' && payload !== null && (payload as {ok?: unknown}).ok === false) {
    const code = (payload as {error?: {code?: unknown}}).error?.code;
    if (typeof code === 'string' && (DASHBOARD_ERROR_CODES as readonly string[]).includes(code)) {
      return code as DashboardErrorCode;
    }
  }
  return status === 403 ? 'FORBIDDEN' : status === 401 ? 'UNAUTHENTICATED' : 'INTERNAL';
}

/** الأجزاء المتبقية من مهلة 48 س (ساعات/دقائق) — null إن مضت أو لم تُضبط */
function remainingParts(iso: string | null): {readonly hours: number; readonly minutes: number} | null {
  if (!iso) return null;
  const delta = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(delta) || delta <= 0) return null;
  const totalMinutes = Math.floor(delta / 60_000);
  return {hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60};
}

const PROPERTY_STATUS_STYLES: Record<PropertyStatusKey, string> = {
  ACTIVE: 'bg-navy-100 text-navy-800',
  UNMONITORED: 'bg-muted text-muted-foreground',
  PAUSED: 'bg-gold-100 text-gold-800',
  SOLD: 'bg-gold-500/20 text-gold-800',
  RENTED: 'bg-gold-500/20 text-gold-800',
  WITHDRAWN: 'bg-muted text-muted-foreground line-through'
};

const MATCH_STATUS_STYLES: Record<MatchStatusKey, string> = {
  CONTACT_REVEALED: 'bg-gold-100 text-gold-800',
  SELLER_AGREED: 'bg-gold-100 text-gold-800',
  BUYER_PAID: 'bg-gold-100 text-gold-800',
  SELLER_NOTIFIED: 'bg-navy-100 text-navy-800',
  EXPIRED: 'bg-muted text-muted-foreground',
  CANCELLED: 'bg-muted text-muted-foreground'
};

function EmptyBlock(props: {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly desc: string;
  readonly ctaHref: string;
  readonly ctaLabel: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
      <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-navy-900/5 text-navy-700">
        {props.icon}
      </span>
      <h3 className="mt-4 text-lg font-extrabold text-navy-900">{props.title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-7 text-muted-foreground">{props.desc}</p>
      <Link
        href={props.ctaHref}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gold-500 px-5 py-2.5 text-sm font-extrabold text-navy-950 transition-colors hover:bg-gold-400"
      >
        {props.ctaLabel}
      </Link>
    </div>
  );
}

function DeadlineChip({respondBy}: {readonly respondBy: string | null}) {
  const tMatch = useTranslations('match');
  const remaining = remainingParts(respondBy);
  if (!remaining) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-navy-900/5 px-2.5 py-1 text-[11px] font-bold text-navy-800">
      <Clock className="size-3.5 text-gold-600" aria-hidden="true" />
      {tMatch('deadlineIn', {hours: remaining.hours, minutes: remaining.minutes})}
    </span>
  );
}

function InboxLink({label}: {readonly label: string}) {
  return (
    <Link
      href="/matches"
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-navy-900/15 bg-background px-4 py-2.5 text-xs font-extrabold text-navy-900 transition-colors hover:bg-navy-900 hover:text-white"
    >
      <Handshake className="size-4" aria-hidden="true" />
      {label}
      <ArrowLeft className="size-3.5 rtl:rotate-0 ltr:rotate-180" aria-hidden="true" />
    </Link>
  );
}

// ─── المكوّن الرئيسي ─────────────────────────────────────────────────────────

export function DashboardView({initialUser}: {readonly initialUser: PublicUser | null}) {
  const locale = useLocale();
  const t = useTranslations('dashboard');
  const tErrors = useTranslations('dashboard.errors');
  const tTypes = useTranslations('publish.types');
  const tMatch = useTranslations('match');
  const tMatchStatus = useTranslations('match.status');

  // الهوية من مخزن Zustand (يُحقن من props الموثوقة خادمياً — مرة واحدة)
  const storeUser = useUserStore((s) => s.user);
  const hydrated = useUserStore((s) => s.hydrated);
  const setUser = useUserStore((s) => s.setUser);
  useEffect(() => {
    if (!hydrated) setUser(initialUser);
  }, [hydrated, initialUser, setUser]);
  const user = hydrated ? storeUser : initialUser;

  // حالة مفصولة (بدل union واحد): التحميل = بلا بيانات وبلا خطأ —
  // يعاد اشتقاقها مجاناً ولا تحتاج setState في نص التأثير أبداً.
  const [data, setData] = useState<DashboardApiData | null>(null);
  const [error, setError] = useState<DashboardErrorCode | null>(null);
  /// عدّاد إعادة يدوية: يُعاد التأثير عند تغيّره (setState من معالج حدث فقط)
  const [reloadTick, setReloadTick] = useState(0);
  const [tab, setTab] = useState<DashboardTab>('properties');
  const loading = data === null && error === null;

  const numberFmt = useMemo(
    () => new Intl.NumberFormat(locale === 'ar' ? 'ar-DZ' : 'fr-DZ'),
    [locale]
  );
  const money = useCallback((v: number) => formatDzd(v, locale), [locale]);
  const formatDate = useCallback(
    (iso: string) =>
      new Intl.DateTimeFormat(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', {dateStyle: 'medium'}).format(
        new Date(iso)
      ),
    [locale]
  );

  // الجلب: سلاسل Promise داخل التأثير — setState يحدث في callbacks خارجية
  // (fetch = النظام الخارجي) كما تنص قاعدة react-hooks/set-state-in-effect.
  const userPhone = user?.phone ?? null;
  useEffect(() => {
    if (!userPhone) return;
    const controller = new AbortController();
    fetch(`/api/dashboard?phone=${encodeURIComponent(userPhone)}`, {
      cache: 'no-store',
      signal: controller.signal
    })
      .then(async (response) => {
        const payload: unknown = await response.json().catch(() => null);
        const okPayload =
          typeof payload === 'object' && payload !== null && (payload as {ok?: unknown}).ok === true
            ? (payload as {data: DashboardApiData})
            : null;
        if (response.ok && okPayload) {
          setData(okPayload.data);
          setError(null);
        } else {
          setData(null);
          setError(parseDashboardError(response.status, payload));
        }
      })
      .catch((fetchError: unknown) => {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') return;
        setData(null);
        setError('NETWORK');
      });
    return () => controller.abort();
  }, [userPhone, reloadTick]);

  // إعادة يدوية (زر تحديث/إعادة): مسح العرض ثم رفع العداد لإعادة التأثير
  const reload = useCallback(() => {
    setData(null);
    setError(null);
    setReloadTick((tick) => tick + 1);
  }, []);

  // ── يتطلب تسجيل الدخول (بلا مستخدم في المخزن ولا من الخادم) ──
  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-14 text-center shadow-sm">
          <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-navy-900 text-gold-400">
            <UserRound className="size-7" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-xl font-extrabold text-navy-900">{t('loginRequiredTitle')}</h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">{t('loginRequiredDesc')}</p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gold-500 px-6 py-3 text-sm font-extrabold text-navy-950 transition-colors hover:bg-gold-400"
          >
            {t('loginCta')}
          </Link>
        </div>
      </div>
    );
  }

  const TABS: readonly {readonly key: DashboardTab; readonly label: string; readonly count: number | null}[] = [
    {
      key: 'properties',
      label: t('tabProperties'),
      count: data?.summary.propertiesCount ?? null
    },
    {
      key: 'searches',
      label: t('tabSearches'),
      count: data?.summary.searchesCount ?? null
    },
    {
      key: 'matches',
      label: t('tabMatches'),
      count: data?.summary.matchesCount ?? null
    }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
      {/* ── الترويسة ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-navy-900 text-gold-400">
            <LayoutDashboard className="size-6" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-navy-900">
              {t('greeting', {name: user.name ?? t('title')})}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{t('subtitle')}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={reload}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-navy-900 transition-colors hover:bg-muted disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="size-4" aria-hidden="true" />
          )}
          {t('refresh')}
        </button>
      </div>

      {/* ── حالة الخطأ ── */}
      {error !== null ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-red-200 bg-red-50 px-6 py-12 text-center">
          <AlertTriangle className="size-8 text-red-500" aria-hidden="true" />
          <h2 className="mt-3 text-lg font-extrabold text-navy-900">{t('errorTitle')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{tErrors(error)}</p>
          <button
            type="button"
            onClick={reload}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-extrabold text-white transition-colors hover:bg-navy-800"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            {t('retry')}
          </button>
        </div>
      ) : null}

      {/* ── بطاقات الملخص (هيكل أثناء التحميل) ── */}
      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            {key: 'summaryProperties', icon: Building2, target: 'properties' as const, value: data?.summary.propertiesCount ?? null},
            {key: 'summarySearches', icon: Search, target: 'searches' as const, value: data?.summary.searchesCount ?? null},
            {key: 'summaryMatches', icon: Handshake, target: 'matches' as const, value: data?.summary.matchesCount ?? null},
            {key: 'summaryPending', icon: Clock, target: 'matches' as const, value: data?.summary.pendingCount ?? null}
          ] as const
        ).map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => setTab(card.target)}
            className="rounded-2xl border border-border bg-card p-4 text-start shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <dt className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <card.icon className="size-4 text-gold-600" aria-hidden="true" />
              {t(card.key)}
            </dt>
            <dd className="mt-2 text-3xl font-black text-navy-900">
              {card.value === null ? (
                <span className="inline-block h-8 w-12 animate-pulse rounded-lg bg-muted" aria-label={t('loading')} />
              ) : (
                numberFmt.format(card.value)
              )}
            </dd>
          </button>
        ))}
      </dl>

      {/* ── شريط الأقسام ── */}
      <div
        role="tablist"
        aria-label={t('title')}
        className="mt-8 flex gap-1 overflow-x-auto rounded-2xl border border-border bg-muted/60 p-1.5"
      >
        {TABS.map((item) => (
          <button
            key={item.key}
            role="tab"
            aria-selected={tab === item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-extrabold transition-colors ${
              tab === item.key
                ? 'bg-navy-900 text-white shadow-sm'
                : 'text-muted-foreground hover:bg-background hover:text-navy-900'
            }`}
          >
            {item.label}
            {item.count !== null ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-black ${
                  tab === item.key ? 'bg-gold-500 text-navy-950' : 'bg-muted text-muted-foreground'
                }`}
              >
                {numberFmt.format(item.count)}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ── محتوى الأقسام ── */}
      <div className="mt-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((n) => (
              <div key={n} className="h-64 animate-pulse rounded-2xl border border-border bg-muted/50" />
            ))}
          </div>
        ) : null}

        {data !== null && tab === 'properties' ? (
          data.properties.length === 0 ? (
            <EmptyBlock
              icon={<Building2 className="size-7" aria-hidden="true" />}
              title={t('emptyPropertiesTitle')}
              desc={t('emptyPropertiesDesc')}
              ctaHref="/publish"
              ctaLabel={t('ctaPublish')}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.properties.map((p) => (
                <article
                  key={p.id}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
                >
                  <Link
                    href={`/properties/${p.id}`}
                    className="absolute inset-0 z-10"
                    aria-label={t('viewProperty')}
                  />
                  <div className="relative aspect-16/10 bg-muted">
                    {p.primaryImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- صور داخلية مضغوطة من مسارنا
                      <img
                        src={p.primaryImageUrl}
                        alt={p.titleAr}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <Building2 className="size-8" aria-hidden="true" />
                      </div>
                    )}
                    <span
                      className={`absolute end-2 top-2 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${PROPERTY_STATUS_STYLES[p.status]}`}
                    >
                      {t(`propertyStatus.${p.status}`)}
                    </span>
                    <span className="absolute start-2 top-2 rounded-full bg-card/95 px-2.5 py-1 text-[11px] font-bold text-navy-800">
                      {tTypes(`deal.${p.transactionType}`)} · {tTypes(`property.${p.propertyType}`)}
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
                          {numberFmt.format(p.areaM2)} م²
                        </span>
                      ) : null}
                      {p.rooms !== null ? (
                        <span className="inline-flex items-center gap-1">
                          <BedDouble className="size-3.5 text-gold-600" aria-hidden="true" />
                          {numberFmt.format(p.rooms)}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between gap-2 border-t border-border/70 pt-3">
                      <p className="text-lg font-extrabold text-navy-900" dir="ltr">
                        {money(p.askingPrice)}
                      </p>
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {t('createdOn', {date: formatDate(p.createdAt)})}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] font-bold text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="size-3.5" aria-hidden="true" />
                        {numberFmt.format(p.views)} {t('viewsLabel')}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Handshake className="size-3.5 text-gold-600" aria-hidden="true" />
                        {t('matchesChip', {count: p.matchesCount})}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )
        ) : null}

        {data !== null && tab === 'searches' ? (
          data.searches.length === 0 ? (
            <EmptyBlock
              icon={<Search className="size-7" aria-hidden="true" />}
              title={t('emptySearchesTitle')}
              desc={t('emptySearchesDesc')}
              ctaHref="/search"
              ctaLabel={t('ctaSearch')}
            />
          ) : (
            <ul className="space-y-3">
              {data.searches.map((s) => {
                const wilaya = getWilaya(s.wilayaCode);
                const commune = s.communeId !== null ? getCommune(s.communeId) : undefined;
                return (
                  <li
                    key={s.id}
                    className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-navy-900 px-2.5 py-1 text-[11px] font-extrabold text-gold-300">
                          {tTypes(`deal.${s.transactionType}`)}
                        </span>
                        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-navy-800">
                          {tTypes(`property.${s.propertyType}`)}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${
                            s.status === 'ACTIVE'
                              ? 'bg-navy-100 text-navy-800'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {t(`searchStatus.${s.status}`)}
                        </span>
                      </div>
                      <p className="mt-2 flex items-center gap-1 text-sm font-bold text-navy-900">
                        <MapPin className="size-4 text-gold-600" aria-hidden="true" />
                        {wilaya ? localizedGeoName(locale, wilaya) : s.wilayaCode}
                        {' — '}
                        {commune ? localizedGeoName(locale, commune) : t('allWilaya')}
                        {s.neighborhoods.length > 0 ? (
                          <span className="text-xs font-bold text-muted-foreground">
                            {' · '}
                            {tMatch('neighborhoodsCount', {count: s.neighborhoods.length})}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-muted-foreground">
                        {t('budgetLabel')}: <span dir="ltr">{money(s.maxBudget)}</span>
                        {' · '}
                        {t('createdOn', {date: formatDate(s.createdAt)})}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <span className="rounded-xl bg-muted px-3 py-2 text-xs font-extrabold text-navy-900">
                        {t('matchesTotal', {count: s.matchesCount})}
                      </span>
                      {s.awaitingCount > 0 ? (
                        <span className="rounded-xl bg-gold-100 px-3 py-2 text-xs font-extrabold text-gold-800">
                          {t('awaitingChip', {count: s.awaitingCount})}
                        </span>
                      ) : null}
                      <Link
                        href="/matches"
                        className="inline-flex items-center justify-center rounded-xl border border-navy-900/15 px-3 py-2 text-xs font-extrabold text-navy-900 transition-colors hover:bg-navy-900 hover:text-white"
                      >
                        {t('openInbox')}
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )
        ) : null}

        {data !== null && tab === 'matches' ? (
          data.matches.length === 0 && data.sellerMatches.length === 0 ? (
            <EmptyBlock
              icon={<Handshake className="size-7" aria-hidden="true" />}
              title={t('emptyMatchesTitle')}
              desc={t('emptyMatchesDesc')}
              ctaHref="/search"
              ctaLabel={t('ctaSearch')}
            />
          ) : (
            <div className="space-y-10">
              {/* جهة المشتري: مطابقات على طلبات بحثه */}
              {data.matches.length > 0 ? (
                <section>
                  <h2 className="text-lg font-extrabold text-navy-900">{t('buyerMatchesTitle')}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t('buyerMatchesDesc')}</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {data.matches.map((m) => (
                      <BuyerMatchCard
                        key={m.id}
                        match={m}
                        formatDzd={money}
                        locale={locale}
                        actions={<InboxLink label={t('openInbox')} />}
                        footer={
                          m.status === 'SELLER_NOTIFIED' ? (
                            <DeadlineChip respondBy={m.respondBy} />
                          ) : undefined
                        }
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {/* جهة البائع: طلبات واردة على عقاراته */}
              {data.sellerMatches.length > 0 ? (
                <section>
                  <h2 className="text-lg font-extrabold text-navy-900">{t('sellerMatchesTitle')}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t('sellerMatchesDesc')}</p>
                  <ul className="mt-4 space-y-3">
                    {data.sellerMatches.map((m) => (
                      <li
                        key={m.id}
                        className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center"
                      >
                        <div className="relative h-20 w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:w-28">
                          {m.property.primaryImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element -- صور داخلية مضغوطة
                            <img
                              src={m.property.primaryImageUrl}
                              alt={m.property.titleAr}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                              <Building2 className="size-6" aria-hidden="true" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="line-clamp-1 text-sm font-extrabold text-navy-900">
                              {m.property.titleAr}
                            </h3>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${MATCH_STATUS_STYLES[m.status]}`}
                            >
                              {tMatchStatus(m.status)}
                            </span>
                          </div>
                          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <UserRound className="size-3.5" aria-hidden="true" />
                              {t('buyerLabel')}: {m.buyerMaskedName}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <ShieldCheck className="size-3.5 text-gold-600" aria-hidden="true" />
                              {t('feeLabel')}: <span dir="ltr">{money(m.feeSeller)}</span>
                            </span>
                            <span dir="ltr">{money(m.property.askingPrice)}</span>
                          </p>
                          {m.status === 'SELLER_NOTIFIED' ? (
                            <div className="mt-2">
                              <DeadlineChip respondBy={m.respondBy} />
                            </div>
                          ) : null}
                        </div>
                        <div className="shrink-0 sm:w-44">
                          <InboxLink label={t('openInbox')} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          )
        ) : null}
      </div>

      {/* إجراء سريع للنشر */}
      <div className="mt-10 flex justify-center">
        <Link
          href="/publish"
          className="inline-flex items-center gap-2 rounded-full bg-gold-500 px-6 py-3 text-sm font-extrabold text-navy-950 shadow-lg shadow-gold-500/25 transition-colors hover:bg-gold-400"
        >
          <Plus className="size-4" aria-hidden="true" />
          {t('ctaPublish')}
        </Link>
      </div>
    </div>
  );
}
