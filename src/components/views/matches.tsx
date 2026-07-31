'use client';

/**
 * MatchesView — صندوق المطابقات للطرفين (المرحلة 5).
 *   كمشتري: بطاقات العقارات + حالة الرد + كشف التواصل (بعد CONTACT_REVEALED)
 *   كبائع: الطلبات الواردة على عقاراتي + موافقة/دفع (تأكيد بخطوتين) + مهلة 48 س
 * أعلى الصفحة: وارد الإشعارات. العدّادات تتجدد كل 30 ثانية.
 */
import {useCallback, useEffect, useMemo, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {
  AlertTriangle,
  Bell,
  Check,
  Clock,
  EyeOff,
  Handshake,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  X
} from 'lucide-react';
import {Link} from '@/i18n/navigation';
import {getCommune, getWilaya} from '@/lib/geo';
import type {DealType, PropertyType} from '@/lib/matching';
import {BuyerMatchCard, localizedGeoName, type BuyerMatchItem, type MatchStatusKey} from './search';

// ─── أنواع مرآة الاستجابات ───────────────────────────────────────────────────

interface BuyerInboxMatch extends BuyerMatchItem {
  readonly respondBy: string | null;
  readonly revealedAt: string | null;
  readonly cancelledAt: string | null;
  readonly cancelReason: string | null;
}

interface SellerMatchItem {
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
  readonly searchSummary: {
    readonly wilayaCode: number;
    readonly communeId: number | null;
    readonly minAreaM2: number | null;
    readonly minRooms: number | null;
    readonly minBathrooms: number | null;
    readonly neighborhoodsCount: number;
  };
  readonly createdAt: string;
}

interface NotificationItem {
  readonly id: string;
  readonly type:
    | 'MATCH_FOUND'
    | 'MATCH_AGREED'
    | 'BUYER_PAID'
    | 'CONTACT_REVEALED'
    | 'MATCH_EXPIRED'
    | 'MATCH_CANCELLED'
    | 'SYSTEM';
  readonly createdAt: string;
}

interface ContactData {
  readonly counterparty: {readonly name: string | null; readonly phone: string};
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
  'MATCH_NOT_FOUND',
  'MATCH_NOT_PARTY',
  'MATCH_ALREADY_RESPONDED',
  'MATCH_ALREADY_REVEALED',
  'MATCH_NOT_CANCELLABLE',
  'MATCH_EXPIRED',
  'CONTACT_NOT_REVEALED',
  'SEARCH_NOT_FOUND',
  'INTERNAL'
] as const;
type MatchErrorCode = (typeof MATCH_ERROR_CODES)[number];

function readErrorCode(payload: unknown): MatchErrorCode {
  if (typeof payload === 'object' && payload !== null && (payload as {ok?: unknown}).ok === false) {
    const code = (payload as {error?: {code?: unknown}}).error?.code;
    if (typeof code === 'string' && MATCH_ERROR_CODES.includes(code as MatchErrorCode)) {
      return code as MatchErrorCode;
    }
  }
  return 'INTERNAL';
}

async function callApi<T>(url: string, method: 'GET' | 'POST', body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: body === undefined ? undefined : {'Content-Type': 'application/json'},
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(readErrorCode(payload));
  return (payload as {data: T}).data;
}

interface DeadlineInfo {
  readonly expired: boolean;
  readonly urgent: boolean;
  readonly hours: number;
  readonly minutes: number;
}

function deadlineInfo(respondBy: string, nowMs: number): DeadlineInfo {
  const remaining = new Date(respondBy).getTime() - nowMs;
  if (remaining <= 0) return {expired: true, urgent: true, hours: 0, minutes: 0};
  const totalMinutes = Math.floor(remaining / 60_000);
  return {
    expired: false,
    urgent: remaining < 6 * 3_600_000,
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60
  };
}

export function MatchesView() {
  const t = useTranslations('match');
  const tStatus = useTranslations('match.status');
  const tTypes = useTranslations('publish.types');
  const tErrors = useTranslations('match.errors');
  const tSearchNs = useTranslations('search');
  const locale = useLocale();

  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [buyerItems, setBuyerItems] = useState<BuyerInboxMatch[] | null>(null);
  const [sellerItems, setSellerItems] = useState<SellerMatchItem[] | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notice, setNotice] = useState<'agreeDone' | 'cancelDone' | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{id: string; code: MatchErrorCode} | null>(null);
  const [confirmAgreeId, setConfirmAgreeId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [contacts, setContacts] = useState<Record<string, {loading: boolean; data?: ContactData; error?: MatchErrorCode}>>({});

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

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === 'ar' ? 'ar-DZ-u-nu-latn' : 'fr-DZ-u-nu-latn', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }),
    [locale]
  );

  // عدّاد تنازلي حي — يتجدد كل 30 ثانية
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const loadBuyer = useCallback(async () => {
    try {
      const data = await callApi<{items: BuyerInboxMatch[]}>('/api/matches?role=buyer', 'GET');
      setBuyerItems(data.items);
    } catch {
      setBuyerItems([]);
    }
  }, []);

  const loadSeller = useCallback(async () => {
    try {
      const data = await callApi<{items: SellerMatchItem[]}>('/api/matches?role=seller', 'GET');
      setSellerItems(data.items);
    } catch {
      setSellerItems([]);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await callApi<{items: NotificationItem[]; unreadCount: number}>(
        '/api/notifications',
        'GET'
      );
      setNotifications(data.items.slice(0, 10));
      setUnreadCount(data.unreadCount);
      // تمييز المعروضة كمقروءة (نارٌ ونِسيان) — العدّاد يصفر عند التحديث التالي
      if (data.unreadCount > 0) {
        void fetch('/api/notifications/mark-read', {method: 'POST'}).catch(() => undefined);
      }
    } catch {
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    void loadBuyer();
    void loadNotifications();
  }, [loadBuyer, loadNotifications]);

  useEffect(() => {
    if (role === 'seller' && sellerItems === null) {
      void loadSeller();
    }
  }, [role, sellerItems, loadSeller]);

  function refreshAll(): void {
    void loadBuyer();
    if (sellerItems !== null) void loadSeller();
    void loadNotifications();
    setNow(Date.now());
  }

  // ─── الأفعال ──────────────────────────────────────────────────────────────

  async function agree(matchId: string): Promise<void> {
    if (busyId) return;
    setBusyId(matchId);
    setActionError(null);
    setNotice(null);
    try {
      await callApi(`/api/matches/${matchId}/agree`, 'POST');
      setConfirmAgreeId(null);
      setNotice('agreeDone');
      await loadSeller();
      await loadNotifications();
    } catch (err) {
      setActionError({id: matchId, code: err instanceof Error ? (err.message as MatchErrorCode) : 'INTERNAL'});
    } finally {
      setBusyId(null);
    }
  }

  async function cancel(matchId: string): Promise<void> {
    if (busyId) return;
    setBusyId(matchId);
    setActionError(null);
    setNotice(null);
    try {
      const reason = cancelReason.trim();
      await callApi(`/api/matches/${matchId}/cancel`, 'POST', reason.length > 0 ? {reason} : undefined);
      setConfirmCancelId(null);
      setCancelReason('');
      setNotice('cancelDone');
      await Promise.all([loadBuyer(), sellerItems !== null ? loadSeller() : Promise.resolve(), loadNotifications()]);
    } catch (err) {
      setActionError({id: matchId, code: err instanceof Error ? (err.message as MatchErrorCode) : 'INTERNAL'});
    } finally {
      setBusyId(null);
    }
  }

  async function revealContact(matchId: string): Promise<void> {
    setContacts((c) => ({...c, [matchId]: {loading: true}}));
    try {
      const data = await callApi<ContactData>(`/api/matches/${matchId}/contact`, 'GET');
      setContacts((c) => ({...c, [matchId]: {loading: false, data}}));
    } catch (err) {
      setContacts((c) => ({
        ...c,
        [matchId]: {
          loading: false,
          error: err instanceof Error ? (err.message as MatchErrorCode) : 'INTERNAL'
        }
      }));
    }
  }

  // ─── قطع مشتركة ───────────────────────────────────────────────────────────

  function DeadlineChip({respondBy}: {readonly respondBy: string | null}) {
    if (!respondBy) return null;
    const info = deadlineInfo(respondBy, now);
    if (info.expired) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-extrabold text-destructive">
          <Clock className="size-3.5" aria-hidden="true" />
          {tStatus('EXPIRED')}
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${
          info.urgent ? 'bg-destructive/10 text-destructive' : 'bg-navy-100 text-navy-800'
        }`}
      >
        <Clock className="size-3.5" aria-hidden="true" />
        {info.urgent ? t('deadlineUrgent') : t('deadlineIn', {hours: info.hours, minutes: info.minutes})}
      </span>
    );
  }

  function StatusChip({status}: {readonly status: MatchStatusKey}) {
    const tone =
      status === 'CONTACT_REVEALED'
        ? 'bg-gold-100 text-gold-800'
        : status === 'SELLER_NOTIFIED'
          ? 'bg-navy-100 text-navy-800'
          : 'bg-muted text-muted-foreground';
    return <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${tone}`}>{tStatus(status)}</span>;
  }

  function ContactPanel({matchId}: {readonly matchId: string}) {
    const entry = contacts[matchId];
    if (!entry) {
      return (
        <button
          type="button"
          onClick={() => void revealContact(matchId)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold-500 px-4 py-3 text-sm font-extrabold text-navy-950 transition-colors hover:bg-gold-400"
        >
          <EyeOff className="size-4" aria-hidden="true" />
          {t('contactShow')}
        </button>
      );
    }
    if (entry.loading) {
      return (
        <p className="flex items-center justify-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm font-bold text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          {t('contactLoading')}
        </p>
      );
    }
    if (entry.error || !entry.data) {
      return (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
          {tErrors(entry.error ?? 'INTERNAL')}
        </p>
      );
    }
    return (
      <div className="rounded-xl border border-gold-300 bg-gold-50 p-4">
        <p className="text-xs font-extrabold text-navy-900">{t('contactTitle')}</p>
        <dl className="mt-2 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <dt className="flex items-center gap-1.5 font-semibold text-muted-foreground">
              <UserRound className="size-4" aria-hidden="true" />
              {t('contactName')}
            </dt>
            <dd className="font-bold text-navy-900">{entry.data.counterparty.name ?? '—'}</dd>
          </div>
          <div className="flex items-center justify-between text-sm">
            <dt className="flex items-center gap-1.5 font-semibold text-muted-foreground">
              <Phone className="size-4" aria-hidden="true" />
              {t('contactPhone')}
            </dt>
            <dd className="font-mono font-extrabold text-navy-900" dir="ltr">
              {entry.data.counterparty.phone}
            </dd>
          </div>
        </dl>
        <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{t('contactNote')}</p>
      </div>
    );
  }

  function CancelPanel({matchId}: {readonly matchId: string}) {
    return (
      <div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm font-extrabold text-navy-900">{t('cancelTitle')}</p>
        <p className="text-xs leading-6 text-muted-foreground">{t('cancelConfirm')}</p>
        <input
          type="text"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-navy-900 outline-none focus:border-gold-500"
          placeholder={t('cancelReason')}
          value={cancelReason}
          maxLength={200}
          onChange={(e) => setCancelReason(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busyId === matchId}
            onClick={() => void cancel(matchId)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-destructive px-3 py-2.5 text-sm font-extrabold text-white transition-opacity disabled:opacity-60"
          >
            {busyId === matchId ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <X className="size-4" aria-hidden="true" />}
            {busyId === matchId ? t('cancelling') : t('cancelYes')}
          </button>
          <button
            type="button"
            disabled={busyId === matchId}
            onClick={() => {
              setConfirmCancelId(null);
              setCancelReason('');
            }}
            className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-bold text-navy-900"
          >
            {t('cancelNo')}
          </button>
        </div>
      </div>
    );
  }

  function ActionError({matchId}: {readonly matchId: string}) {
    if (!actionError || actionError.id !== matchId) return null;
    return (
      <p role="alert" className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
        <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
        {tErrors(actionError.code)}
      </p>
    );
  }

  // ─── قائمة المشتري ─────────────────────────────────────────────────────────

  function renderBuyerList(): React.ReactNode {
    if (buyerItems === null) {
      return <LoadingBlock />;
    }
    if (buyerItems.length === 0) {
      return (
        <EmptyBlock
          title={t('emptyBuyerTitle')}
          desc={t('emptyBuyerDesc')}
          cta={<Link href="/search" className={ctaClass}>{t('ctaSearch')}</Link>}
        />
      );
    }
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {buyerItems.map((match) => (
          <BuyerMatchCard
            key={match.id}
            match={match}
            formatDzd={formatDzd}
            locale={locale}
            actions={
              <div className="space-y-2.5">
                {match.status === 'CONTACT_REVEALED' ? <ContactPanel matchId={match.id} /> : null}
                {match.status === 'SELLER_NOTIFIED' ? (
                  <>
                    {confirmCancelId === match.id ? (
                      <CancelPanel matchId={match.id} />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmCancelId(match.id)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
                      >
                        <X className="size-4" aria-hidden="true" />
                        {t('cancel')}
                      </button>
                    )}
                  </>
                ) : null}
                <ActionError matchId={match.id} />
              </div>
            }
            footer={
              match.status === 'SELLER_NOTIFIED' && match.respondBy ? (
                <div className="pt-1">
                  <DeadlineChip respondBy={match.respondBy} />
                </div>
              ) : null
            }
          />
        ))}
      </div>
    );
  }

  // ─── قائمة البائع ──────────────────────────────────────────────────────────

  function renderSellerList(): React.ReactNode {
    if (sellerItems === null) {
      return <LoadingBlock />;
    }
    if (sellerItems.length === 0) {
      return (
        <EmptyBlock
          title={t('emptySellerTitle')}
          desc={t('emptySellerDesc')}
          cta={<Link href="/publish" className={ctaClass}>{t('ctaPublish')}</Link>}
        />
      );
    }
    return (
      <div className="space-y-5">
        {sellerItems.map((match) => {
          const wilaya = getWilaya(match.searchSummary.wilayaCode);
          const commune = match.searchSummary.communeId !== null ? getCommune(match.searchSummary.communeId) : undefined;
          return (
            <article
              key={match.id}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm sm:flex"
            >
              <div className="relative aspect-16/10 bg-muted sm:aspect-auto sm:w-44 sm:shrink-0">
                {match.property.primaryImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- صورة داخلية مضغوطة
                  <img
                    src={match.property.primaryImageUrl}
                    alt={match.property.titleAr}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <MapPin className="size-7" aria-hidden="true" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-3 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-extrabold text-navy-900">{match.property.titleAr}</h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <UserRound className="size-3.5" aria-hidden="true" />
                      {t('buyerMasked', {name: match.buyerMaskedName})}
                      {wilaya
                        ? ` · ${t('searchSummary', {
                            wilaya: localizedGeoName(locale, wilaya),
                            commune: commune ? localizedGeoName(locale, commune) : t('allWilayaCommune')
                          })}`
                        : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-navy-900/90 px-2.5 py-1 text-[11px] font-extrabold text-gold-300">
                      {tSearchNs('scorePoints', {score: match.displayedScore})}
                    </span>
                    <StatusChip status={match.status} />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-navy-800">
                  <span>{tTypes(`deal.${match.property.transactionType}`)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{tTypes(`property.${match.property.propertyType}`)}</span>
                  <span aria-hidden="true">·</span>
                  <span dir="ltr">{formatDzd(match.property.askingPrice)}</span>
                  {match.status === 'SELLER_NOTIFIED' ? <DeadlineChip respondBy={match.respondBy} /> : null}
                </div>

                {match.status === 'SELLER_NOTIFIED' ? (
                  <div className="space-y-2.5 border-t border-border/70 pt-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className="font-semibold text-muted-foreground">{t('feeLabel')}</span>
                      <span className="font-extrabold text-gold-700" dir="ltr">
                        {formatDzd(match.feeSeller)}
                      </span>
                    </div>
                    {confirmAgreeId === match.id ? (
                      <div className="space-y-3 rounded-xl border border-gold-300 bg-gold-50 p-4">
                        <p className="flex items-start gap-2 text-xs leading-6 text-navy-800">
                          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-gold-700" aria-hidden="true" />
                          {t('agreeNote')}
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={busyId === match.id}
                            onClick={() => void agree(match.id)}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-navy-900 px-4 py-3 text-sm font-extrabold text-white transition-colors hover:bg-navy-800 disabled:opacity-60"
                          >
                            {busyId === match.id ? (
                              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                            ) : (
                              <Handshake className="size-4" aria-hidden="true" />
                            )}
                            {busyId === match.id ? t('agreeing') : t('agreePay', {fee: formatDzd(match.feeSeller)})}
                          </button>
                          <button
                            type="button"
                            disabled={busyId === match.id}
                            onClick={() => setConfirmAgreeId(null)}
                            className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-bold text-navy-900"
                          >
                            {t('cancelNo')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmAgreeId(match.id);
                            setConfirmCancelId(null);
                          }}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 py-3 text-sm font-extrabold text-white transition-colors hover:bg-navy-800"
                        >
                          <Handshake className="size-4" aria-hidden="true" />
                          {t('agreePay', {fee: formatDzd(match.feeSeller)})}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmCancelId(match.id);
                            setConfirmAgreeId(null);
                          }}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
                        >
                          <X className="size-4" aria-hidden="true" />
                          {t('cancel')}
                        </button>
                      </div>
                    )}
                    {confirmCancelId === match.id ? <CancelPanel matchId={match.id} /> : null}
                  </div>
                ) : null}

                {match.status === 'CONTACT_REVEALED' ? (
                  <div className="border-t border-border/70 pt-3">
                    <ContactPanel matchId={match.id} />
                  </div>
                ) : null}

                <ActionError matchId={match.id} />
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  function LoadingBlock() {
    return (
      <div className="flex items-center justify-center gap-2 rounded-3xl border border-border bg-card p-12 text-sm font-bold text-muted-foreground">
        <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        {t('loading')}
      </div>
    );
  }

  function EmptyBlock(props: {readonly title: string; readonly desc: string; readonly cta: React.ReactNode}) {
    return (
      <div className="rounded-3xl border border-border bg-card p-10 text-center">
        <Check className="mx-auto size-10 text-gold-600" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-extrabold text-navy-900">{props.title}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted-foreground">{props.desc}</p>
        <div className="mt-6 flex justify-center">{props.cta}</div>
      </div>
    );
  }

  const ctaClass =
    'inline-flex items-center gap-2 rounded-xl bg-navy-900 px-6 py-3 text-sm font-extrabold text-white transition-colors hover:bg-navy-800';

  // ─── الهيكل ────────────────────────────────────────────────────────────────

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-navy-900">{t('title')}</h1>
          <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground">{t('subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={refreshAll}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-navy-900 transition-colors hover:bg-muted"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          {t('refresh')}
        </button>
      </header>

      {/* إشعار نجاح مؤقت بعد إجراء حسّاس (موافقة/إلغاء) */}
      {notice !== null ? (
        <p
          role="status"
          className="mt-6 flex items-start gap-2 rounded-2xl border border-gold-300 bg-gold-50 px-4 py-3 text-sm font-bold text-navy-900"
        >
          <Check className="mt-0.5 size-4 shrink-0 text-gold-700" aria-hidden="true" />
          {t(notice === 'agreeDone' ? 'noticeAgreeDone' : 'noticeCancelDone')}
        </p>
      ) : null}

      {/* الإشعارات */}
      <div className="mt-8 rounded-2xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-extrabold text-navy-900">
          <Bell className="size-4 text-gold-600" aria-hidden="true" />
          {t('notificationsTitle')}
          {unreadCount > 0 ? (
            <span className="rounded-full bg-gold-500 px-2 py-0.5 text-[11px] font-extrabold text-navy-950">
              {t('unread', {count: unreadCount})}
            </span>
          ) : null}
        </h2>
        {notifications.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t('notificationsEmpty')}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {notifications.map((n) => (
              <li
                key={n.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted px-4 py-2.5 text-sm"
              >
                <span className="font-semibold text-navy-800">{t(`notification.${n.type}`)}</span>
                <span className="text-xs text-muted-foreground" dir="ltr">
                  {dateFormatter.format(new Date(n.createdAt))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* التبويبان */}
      <div className="mt-8 grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1.5" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={role === 'buyer'}
          onClick={() => setRole('buyer')}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
            role === 'buyer' ? 'bg-navy-900 text-white shadow-sm' : 'text-muted-foreground hover:text-navy-900'
          }`}
        >
          <Search className="size-4" aria-hidden="true" />
          {t('tabBuyer')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={role === 'seller'}
          onClick={() => setRole('seller')}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
            role === 'seller' ? 'bg-navy-900 text-white shadow-sm' : 'text-muted-foreground hover:text-navy-900'
          }`}
        >
          <Handshake className="size-4" aria-hidden="true" />
          {t('tabSeller')}
        </button>
      </div>

      <div className="mt-6">{role === 'buyer' ? renderBuyerList() : renderSellerList()}</div>
    </section>
  );
}
