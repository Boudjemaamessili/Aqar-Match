'use client';

/**
 * PublishView — واجهة نشر العقار (المرحلة 4).
 *
 * معالج من 5 خطوات + تبويب استيراد جماعي للوكالات:
 *   1) المعاملة والنوع   2) الموقع   3) التفاصيل
 *   4) السعر (+ معاينة حيّة للرسم عبر calcSellerFee) والصور   5) التواصل والنشر
 *
 * مبادئ:
 *   - كل حسابات الرسم/الحدود تعيد استخدام matching.ts نفسه (بلا تكرار منطق).
 *   - السعر السري يُرسل في الجسم مرة واحدة للحفظ ولا يُعاد عرضه من أي استجابة.
 *   - التحقق هنا للراحة فقط — الخادم هو المرجع الصارم الأخير دائماً.
 */
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {
  AlertTriangle,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  EyeOff,
  FileSpreadsheet,
  ImagePlus,
  Info,
  Loader2,
  Lock,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  UserRound,
  X
} from 'lucide-react';
import {Link} from '@/i18n/navigation';
import {ACTIVE_WILAYAS, communesOfWilaya} from '@/lib/geo';
import {normalizeDzPhone} from '@/lib/auth/phone';
import {
  calcSellerFee,
  getSecretMinAbsoluteFloor,
  isPropertyTypeAllowed,
  PROPERTY_TYPE_RULES,
  type DealType,
  type PropertyType
} from '@/lib/matching';
import {
  ACCOUNT_TYPES,
  DEAL_TYPES,
  LEGAL_STATUSES,
  PROPERTY_CONDITIONS,
  TITLE_MIN_LENGTH,
  type AccountTypeInput,
  type LegalStatusInput,
  type PropertyConditionInput
} from '@/lib/properties/constants';
import {parseAmountNumber} from '@/lib/properties/normalize';
import type {ImageInput, SeasonalFeaturesInput} from '@/lib/properties/schemas';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGES_PER_PROPERTY,
  UPLOAD_MAX_BYTES
} from '@/lib/uploads/constants';

// ─── أنواع داخلية ────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5;

interface Draft {
  dealType: DealType | null;
  propertyType: PropertyType | null;
  wilaya: number | null;
  commune: number | null;
  neighborhood: string;
  title: string;
  description: string;
  area: string;
  rooms: string;
  bathrooms: string;
  floor: string;
  floors: string;
  facades: string;
  legalStatus: '' | LegalStatusInput;
  condition: PropertyConditionInput;
  furnished: boolean | null;
  hasParking: boolean | null;
  hasElevator: boolean | null;
  hasGarden: boolean | null;
  seasonalCapacity: string;
  seasonalDistance: string;
  seasonalAC: boolean;
  seasonalPool: boolean;
  seasonalSeaView: boolean;
  seasonalWifi: boolean;
  price: string;
  secretMin: string;
  accountType: AccountTypeInput;
  ownerName: string;
  ownerPhone: string;
}

const EMPTY_DRAFT: Draft = {
  dealType: null,
  propertyType: null,
  wilaya: null,
  commune: null,
  neighborhood: '',
  title: '',
  description: '',
  area: '',
  rooms: '',
  bathrooms: '',
  floor: '',
  floors: '',
  facades: '',
  legalStatus: '',
  condition: 'GOOD',
  furnished: null,
  hasParking: null,
  hasElevator: null,
  hasGarden: null,
  seasonalCapacity: '',
  seasonalDistance: '',
  seasonalAC: false,
  seasonalPool: false,
  seasonalSeaView: false,
  seasonalWifi: false,
  price: '',
  secretMin: '',
  accountType: 'INDIVIDUAL',
  ownerName: '',
  ownerPhone: ''
};

interface LocalImage {
  readonly localId: string;
  readonly file: File | null;
  readonly previewUrl: string;
  readonly status: 'uploading' | 'ready' | 'error';
  readonly descriptor?: ImageInput;
}

interface MeSummary {
  readonly name: string | null;
  readonly phone: string;
  readonly role: string;
}

interface PublishReceiptData {
  readonly id: string;
  readonly status: string;
  readonly fee: number;
  readonly currency: string;
  readonly askingPrice: number;
  readonly imagesCount: number;
  readonly publishedAt: string;
}

interface BulkRowError {
  readonly row: number;
  readonly field: string | null;
  readonly reason: string;
}

interface BulkImportResult {
  readonly total: number;
  readonly success: number;
  readonly skipped: number;
  readonly failed: number;
  readonly errors: readonly BulkRowError[];
  readonly skippedRows: readonly BulkRowError[];
  readonly ids: readonly string[];
}

interface ApiFail {
  readonly code: string;
  readonly issueToken?: string;
}

/** رموز أخطاء لهذا القسم كما في messages (publish.errors) */
const PUBLISH_ERROR_CODES = [
  'INVALID_JSON',
  'VALIDATION_ERROR',
  'RATE_LIMITED',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'CSRF_ORIGIN_MISMATCH',
  'CONFLICT',
  'NOT_FOUND',
  'INVALID_PHONE',
  'NAME_REQUIRED',
  'TYPE_NOT_ALLOWED',
  'SECRET_MIN_BELOW_FLOOR',
  'PRICE_BELOW_SECRET_MIN',
  'INVALID_WILAYA',
  'INVALID_COMMUNE',
  'COMMUNE_WILAYA_MISMATCH',
  'NO_FILE',
  'INVALID_MULTIPART',
  'FILE_TOO_LARGE',
  'UNSUPPORTED_IMAGE_TYPE',
  'INVALID_IMAGE_CONTENT',
  'UPLOAD_STORE_FAILED',
  'INVALID_IMAGE_URL',
  'TOO_MANY_IMAGES',
  'BULK_EMPTY',
  'BULK_TOO_MANY',
  'UNKNOWN_DEAL_TYPE',
  'UNKNOWN_PROPERTY_TYPE',
  'UNKNOWN_WILAYA',
  'UNKNOWN_COMMUNE',
  'UNKNOWN_LEGAL_STATUS',
  'UNKNOWN_CONDITION',
  'INVALID_NUMBER',
  'DUPLICATE_LISTING',
  'INTERNAL'
] as const;
type PublishErrorCode = (typeof PUBLISH_ERROR_CODES)[number];

type ValidationToken =
  | 'pickDealType'
  | 'pickPropertyType'
  | 'pickWilaya'
  | 'pickCommune'
  | 'titleTooShort'
  | 'priceInvalid'
  | 'secretInvalid'
  | 'secretBelowFloor'
  | 'priceBelowSecret'
  | 'imagesUploading'
  | 'ownerNameShort'
  | 'ownerPhoneInvalid';

// ─── أدوات مساعدة ────────────────────────────────────────────────────────────

function parseApiError(payload: unknown): ApiFail {
  if (typeof payload === 'object' && payload !== null && (payload as {ok?: unknown}).ok === false) {
    const error = (payload as {error?: {code?: unknown; details?: unknown}}).error;
    const code = typeof error?.code === 'string' ? error.code : 'INTERNAL';
    // داخل VALIDATION_ERROR قد يختبئ رمز قاعدة عمل (issue.message)
    let issueToken: string | undefined;
    const details = error?.details as {issues?: Array<{message?: unknown}>} | undefined;
    const firstMessage = details?.issues?.[0]?.message;
    if (typeof firstMessage === 'string' && PUBLISH_ERROR_CODES.includes(firstMessage as PublishErrorCode)) {
      issueToken = firstMessage;
    }
    return {code, issueToken};
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
  if (!response.ok) throw parseApiError(payload);
  if (typeof payload === 'object' && payload !== null && (payload as {ok?: unknown}).ok === true) {
    return (payload as {data: T}).data;
  }
  throw {code: 'INTERNAL'} satisfies ApiFail;
}

function toOptionalNumber(value: string): number | undefined {
  if (value.trim().length === 0) return undefined;
  const parsed = parseAmountNumber(value);
  return parsed ?? undefined;
}

let localIdCounter = 0;
function nextLocalId(): string {
  localIdCounter += 1;
  return `img-${localIdCounter}`;
}

const inputClass =
  'w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-navy-900 outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30';
const numericInputClass = `${inputClass} text-left`;
const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-navy-900 px-6 py-3.5 font-bold text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-60';
const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 font-bold text-navy-900 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60';

// ─── المكوّن الرئيسي ─────────────────────────────────────────────────────────

export function PublishView() {
  const t = useTranslations('publish');
  const tErrors = useTranslations('publish.errors');
  const tValidation = useTranslations('publish.validation');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [tab, setTab] = useState<'single' | 'bulk'>('single');
  const [step, setStep] = useState<Step>(1);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [images, setImages] = useState<readonly LocalImage[]>([]);
  const [stepError, setStepError] = useState<ValidationToken | null>(null);
  const [apiError, setApiError] = useState<PublishErrorCode | null>(null);
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<PublishReceiptData | null>(null);
  const [me, setMe] = useState<MeSummary | null | 'loading'>('loading');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<readonly LocalImage[]>([]);
  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  // تنسيق العملة بالأرقام اللاتينية (قرار موثّق منذ المرحلة 1)
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(isRtl ? 'ar-DZ-u-nu-latn' : 'fr-DZ-u-nu-latn', {
        style: 'currency',
        currency: 'DZD',
        maximumFractionDigits: 0
      }),
    [isRtl]
  );
  const formatDzd = useCallback((value: number) => currencyFormatter.format(value), [currencyFormatter]);

  // جلب الجلسة لتعبئة بيانات المالك + بوابة الاستيراد الجماعي
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch('/api/auth/me', {cache: 'no-store'});
        if (response.ok) {
          const payload = (await response.json()) as {data?: {user?: MeSummary}};
          const user = payload.data?.user;
          if (!cancelled && user) {
            setMe(user);
            setDraft((d) => ({
              ...d,
              ownerName: d.ownerName || user.name || '',
              ownerPhone: d.ownerPhone || user.phone,
              accountType: user.role === 'agency' ? 'AGENCY' : d.accountType
            }));
            return;
          }
        }
      } catch {
        // شبكة متعثرة = مجهول
      }
      if (!cancelled) setMe(null);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // تنظيف روابط المعاينة المؤقتة عند التفكيك
  useEffect(() => {
    return () => {
      for (const image of imagesRef.current) {
        URL.revokeObjectURL(image.previewUrl);
      }
    };
  }, []);

  const update = useCallback(<K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({...d, [key]: value}));
    setStepError(null);
    setApiError(null);
  }, []);

  // معاينة الرسم الحيّة (تُحسب على مدخل البائع نفسه — لا تسريب)
  const secretMinNumber = toOptionalNumber(draft.secretMin);
  const priceNumber = toOptionalNumber(draft.price);
  const feePreview =
    draft.dealType !== null && secretMinNumber !== undefined && secretMinNumber > 0
      ? calcSellerFee(draft.dealType, secretMinNumber)
      : null;
  const secretFloor = draft.dealType !== null ? getSecretMinAbsoluteFloor(draft.dealType) : null;

  const allowedTypes: readonly PropertyType[] =
    draft.dealType !== null ? PROPERTY_TYPE_RULES[draft.dealType] : [];

  const communes = useMemo(
    () => (draft.wilaya !== null ? communesOfWilaya(draft.wilaya) : []),
    [draft.wilaya]
  );

  // ─── تحقق كل خطوة (راحة فقط — الخادم مرجع أخير) ─────────────────────────

  function validateStep(target: Step): ValidationToken | null {
    switch (target) {
      case 1: {
        if (!draft.dealType) return 'pickDealType';
        if (!draft.propertyType || !isPropertyTypeAllowed(draft.dealType, draft.propertyType)) {
          return 'pickPropertyType';
        }
        return null;
      }
      case 2: {
        if (draft.wilaya === null) return 'pickWilaya';
        if (draft.commune === null) return 'pickCommune';
        return null;
      }
      case 3: {
        if (draft.title.trim().length < TITLE_MIN_LENGTH) return 'titleTooShort';
        return null;
      }
      case 4: {
        if (images.some((i) => i.status === 'uploading')) return 'imagesUploading';
        if (priceNumber === undefined || priceNumber <= 0) return 'priceInvalid';
        if (secretMinNumber === undefined || secretMinNumber <= 0) return 'secretInvalid';
        if (secretFloor !== null && secretMinNumber < secretFloor) return 'secretBelowFloor';
        if (priceNumber < secretMinNumber) return 'priceBelowSecret';
        return null;
      }
      case 5: {
        if (draft.ownerName.trim().length < 2) return 'ownerNameShort';
        if (!normalizeDzPhone(draft.ownerPhone).ok) return 'ownerPhoneInvalid';
        return null;
      }
    }
  }

  function goNext(): void {
    const error = validateStep(step);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError(null);
    setStep((s) => (s < 5 ? ((s + 1) as Step) : s));
  }

  function goBack(): void {
    setStepError(null);
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
  }

  // ─── رفع الصور ───────────────────────────────────────────────────────────

  async function uploadOne(localId: string, file: File): Promise<void> {
    const form = new FormData();
    form.append('file', file);
    try {
      const response = await fetch('/api/uploads', {method: 'POST', body: form});
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) throw payload;
      const descriptor = (payload as {data: ImageInput}).data;
      setImages((list) =>
        list.map((i) => (i.localId === localId ? {...i, status: 'ready', descriptor} : i))
      );
    } catch {
      setImages((list) => list.map((i) => (i.localId === localId ? {...i, status: 'error'} : i)));
    }
  }

  function handleFilesChosen(files: FileList | null): void {
    if (!files) return;
    const current = imagesRef.current;
    const room = MAX_IMAGES_PER_PROPERTY - current.length;
    const accepted = [...files].slice(0, Math.max(0, room));
    const prepared: LocalImage[] = [];
    for (const file of accepted) {
      const tooLarge = file.size > UPLOAD_MAX_BYTES;
      const badType = !ALLOWED_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number]);
      const entry: LocalImage = {
        localId: nextLocalId(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: tooLarge || badType ? 'error' : 'uploading'
      };
      prepared.push(entry);
    }
    if (prepared.length === 0) return;
    setImages((list) => [...list, ...prepared]);
    for (const entry of prepared) {
      if (entry.status === 'uploading' && entry.file) {
        void uploadOne(entry.localId, entry.file);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeImage(localId: string): void {
    setImages((list) => {
      const target = list.find((i) => i.localId === localId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return list.filter((i) => i.localId !== localId);
    });
  }

  // ─── الإرسال ─────────────────────────────────────────────────────────────

  function buildSeasonalFeatures(): SeasonalFeaturesInput | undefined {
    if (draft.dealType !== 'SEASONAL_RENT') return undefined;
    const capacity = toOptionalNumber(draft.seasonalCapacity);
    if (capacity === undefined || capacity < 1) return undefined;
    const features: SeasonalFeaturesInput = {capacity: Math.round(capacity)};
    const distance = toOptionalNumber(draft.seasonalDistance);
    if (distance !== undefined && distance >= 0) features.distanceToBeachM = Math.round(distance);
    if (draft.seasonalAC) features.airConditioning = true;
    if (draft.seasonalPool) features.pool = true;
    if (draft.seasonalSeaView) features.seaView = true;
    if (draft.seasonalWifi) features.wifi = true;
    return features;
  }

  async function submit(): Promise<void> {
    const error = validateStep(5);
    if (error || !draft.dealType || !draft.propertyType || draft.wilaya === null || draft.commune === null) {
      setStepError(error ?? 'pickDealType');
      return;
    }
    if (busy) return;
    setBusy(true);
    setApiError(null);
    try {
      const payload = {
        dealType: draft.dealType,
        propertyType: draft.propertyType,
        wilaya: draft.wilaya,
        commune: draft.commune,
        neighborhood: draft.neighborhood.trim() || undefined,
        title: draft.title.trim(),
        description: draft.description.trim() || undefined,
        area: toOptionalNumber(draft.area),
        rooms: toOptionalNumber(draft.rooms),
        floor: toOptionalNumber(draft.floor),
        floors: toOptionalNumber(draft.floors),
        bathrooms: toOptionalNumber(draft.bathrooms),
        facades: toOptionalNumber(draft.facades),
        legalStatus: draft.legalStatus || undefined,
        condition: draft.condition,
        furnished: draft.furnished ?? undefined,
        hasParking: draft.hasParking ?? undefined,
        hasElevator: draft.hasElevator ?? undefined,
        hasGarden: draft.hasGarden ?? undefined,
        seasonalFeatures: buildSeasonalFeatures(),
        price: priceNumber,
        secretMin: secretMinNumber,
        images: images.filter((i) => i.status === 'ready').flatMap((i) => (i.descriptor ? [i.descriptor] : [])),
        accountType: draft.accountType,
        ownerName: draft.ownerName.trim(),
        ownerPhone: draft.ownerPhone.trim(),
        // الجلسة (إن وجدت) تربط تلقائياً خادمياً؛ userPhone احتياط من الواجهات القديمة
        ...(me !== null && me !== 'loading' ? {userPhone: me.phone} : {})
      };
      const data = await postJson<PublishReceiptData>('/api/properties', payload);
      setReceipt(data);
    } catch (err) {
      const fail = err as ApiFail;
      const token = fail.issueToken ?? fail.code;
      setApiError(PUBLISH_ERROR_CODES.includes(token as PublishErrorCode) ? (token as PublishErrorCode) : 'INTERNAL');
      setBusy(false);
    }
  }

  function resetAll(): void {
    setDraft(EMPTY_DRAFT);
    for (const image of images) URL.revokeObjectURL(image.previewUrl);
    setImages([]);
    setReceipt(null);
    setStep(1);
    setStepError(null);
    setApiError(null);
    setBusy(false);
  }

  // ─── عناصر فرعية ─────────────────────────────────────────────────────────

  function Field(props: {
    readonly label: string;
    readonly hint?: string;
    readonly icon?: React.ReactNode;
    readonly required?: boolean;
    readonly children: React.ReactNode;
  }) {
    return (
      <div className="space-y-2">
        <span className="flex items-center gap-2 text-sm font-bold text-navy-900">
          {props.icon}
          {props.label}
          {props.required ? <span className="text-gold-600" aria-hidden="true">*</span> : null}
        </span>
        {props.children}
        {props.hint ? <p className="text-xs leading-6 text-muted-foreground">{props.hint}</p> : null}
      </div>
    );
  }

  function ChoiceChip(props: {
    readonly active: boolean;
    readonly onClick: () => void;
    readonly children: React.ReactNode;
  }) {
    return (
      <button
        type="button"
        onClick={props.onClick}
        aria-pressed={props.active}
        className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors ${
          props.active
            ? 'border-gold-500 bg-gold-50 text-navy-900 ring-2 ring-gold-500/30'
            : 'border-border bg-card text-muted-foreground hover:border-gold-300 hover:text-navy-900'
        }`}
      >
        {props.children}
      </button>
    );
  }

  function TriStateToggle(props: {
    readonly label: string;
    readonly value: boolean | null;
    readonly onChange: (value: boolean | null) => void;
  }) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <span className="text-sm font-bold text-navy-900">{props.label}</span>
        <div className="flex gap-1">
          {([true, false, null] as const).map((option) => (
            <button
              key={String(option)}
              type="button"
              onClick={() => props.onChange(option)}
              aria-pressed={props.value === option}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                props.value === option
                  ? 'bg-navy-900 text-white'
                  : 'bg-muted text-muted-foreground hover:text-navy-900'
              }`}
            >
              {option === true ? t('fields.yes') : option === false ? t('fields.no') : t('fields.unset')}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const NextIcon = isRtl ? ChevronLeft : ChevronRight;
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

  // ─── خطوات المعالج ───────────────────────────────────────────────────────

  function renderStepType(): React.ReactNode {
    return (
      <div className="space-y-8">
        <Field label={t('fields.dealType')} required icon={<Tag className="size-4 text-gold-600" aria-hidden="true" />}>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('fields.dealType')}>
            {DEAL_TYPES.map((deal) => (
              <ChoiceChip
                key={deal}
                active={draft.dealType === deal}
                onClick={() => {
                  setDraft((d) => ({
                    ...d,
                    dealType: deal,
                    // إن كان النوع السابق غير مسموح للمعاملة الجديدة يُصفَّر
                    propertyType:
                      d.propertyType && isPropertyTypeAllowed(deal, d.propertyType) ? d.propertyType : null
                  }));
                  setStepError(null);
                }}
              >
                {t(`types.deal.${deal}`)}
              </ChoiceChip>
            ))}
          </div>
        </Field>

        <Field label={t('fields.propertyType')} required icon={<Building2 className="size-4 text-gold-600" aria-hidden="true" />}>
          {draft.dealType === null ? (
            <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
              {t('validation.pickDealType')}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('fields.propertyType')}>
              {allowedTypes.map((type) => (
                <ChoiceChip key={type} active={draft.propertyType === type} onClick={() => update('propertyType', type)}>
                  {t(`types.property.${type}`)}
                </ChoiceChip>
              ))}
            </div>
          )}
        </Field>
      </div>
    );
  }

  function renderStepLocation(): React.ReactNode {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label={t('fields.wilaya')} required icon={<MapPin className="size-4 text-gold-600" aria-hidden="true" />}>
            <select
              className={inputClass}
              value={draft.wilaya ?? ''}
              onChange={(e) => {
                const value = e.target.value === '' ? null : Number(e.target.value);
                setDraft((d) => ({...d, wilaya: value, commune: null}));
                setStepError(null);
              }}
            >
              <option value="" disabled>
                —
              </option>
              {ACTIVE_WILAYAS.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.code} — {isRtl ? w.nameAr : w.nameFr}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t('fields.commune')} required icon={<MapPin className="size-4 text-gold-600" aria-hidden="true" />}>
            <select
              className={`${inputClass} disabled:opacity-60`}
              value={draft.commune ?? ''}
              disabled={draft.wilaya === null}
              onChange={(e) => {
                update('commune', e.target.value === '' ? null : Number(e.target.value));
              }}
            >
              <option value="" disabled>
                {draft.wilaya === null ? t('fields.selectWilayaFirst') : '—'}
              </option>
              {communes.map((c) => (
                <option key={c.id} value={c.id}>
                  {isRtl ? c.nameAr : c.nameFr}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          label={t('fields.neighborhood')}
          hint={t('fields.neighborhoodHint')}
          icon={<MapPin className="size-4 text-gold-600" aria-hidden="true" />}
        >
          <input
            type="text"
            className={inputClass}
            value={draft.neighborhood}
            maxLength={120}
            placeholder={t('fields.neighborhoodPlaceholder')}
            onChange={(e) => update('neighborhood', e.target.value)}
          />
        </Field>
      </div>
    );
  }

  function renderStepDetails(): React.ReactNode {
    return (
      <div className="space-y-6">
        <Field label={t('fields.title')} required icon={<Sparkles className="size-4 text-gold-600" aria-hidden="true" />}>
          <input
            type="text"
            className={inputClass}
            value={draft.title}
            maxLength={120}
            placeholder={t('fields.titlePlaceholder')}
            onChange={(e) => update('title', e.target.value)}
          />
        </Field>

        <Field label={t('fields.description')} icon={<Info className="size-4 text-gold-600" aria-hidden="true" />}>
          <textarea
            className={`${inputClass} min-h-28 resize-y`}
            value={draft.description}
            maxLength={2000}
            placeholder={t('fields.descriptionPlaceholder')}
            onChange={(e) => update('description', e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {(
            [
              ['area', t('fields.area')],
              ['rooms', t('fields.rooms')],
              ['bathrooms', t('fields.bathrooms')],
              ['floor', t('fields.floor')],
              ['floors', t('fields.floors')],
              ['facades', t('fields.facades')]
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <input
                type="text"
                inputMode="decimal"
                dir="ltr"
                className={numericInputClass}
                value={draft[key]}
                onChange={(e) => update(key, e.target.value)}
              />
            </Field>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label={t('fields.condition')} icon={<Check className="size-4 text-gold-600" aria-hidden="true" />}>
            <select
              className={inputClass}
              value={draft.condition}
              onChange={(e) => update('condition', e.target.value as PropertyConditionInput)}
            >
              {PROPERTY_CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>
                  {t(`types.condition.${condition}`)}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t('fields.legalStatus')} icon={<ShieldCheck className="size-4 text-gold-600" aria-hidden="true" />}>
            <select
              className={inputClass}
              value={draft.legalStatus}
              onChange={(e) => update('legalStatus', e.target.value as '' | LegalStatusInput)}
            >
              <option value="">{t('fields.unset')}</option>
              {LEGAL_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`types.legal.${status}`)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm font-bold text-navy-900">
            <Sparkles className="size-4 text-gold-600" aria-hidden="true" />
            {t('fields.features')}
          </p>
          <TriStateToggle label={t('fields.furnished')} value={draft.furnished} onChange={(v) => update('furnished', v)} />
          <TriStateToggle label={t('fields.hasParking')} value={draft.hasParking} onChange={(v) => update('hasParking', v)} />
          <TriStateToggle label={t('fields.hasElevator')} value={draft.hasElevator} onChange={(v) => update('hasElevator', v)} />
          <TriStateToggle label={t('fields.hasGarden')} value={draft.hasGarden} onChange={(v) => update('hasGarden', v)} />
        </div>

        {draft.dealType === 'SEASONAL_RENT' ? (
          <div className="space-y-4 rounded-2xl border border-gold-200 bg-gold-50/60 p-5">
            <p className="flex items-center gap-2 text-sm font-extrabold text-navy-900">
              <Sparkles className="size-4 text-gold-600" aria-hidden="true" />
              {t('fields.seasonalTitle')}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t('fields.capacity')} required>
                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  className={numericInputClass}
                  value={draft.seasonalCapacity}
                  onChange={(e) => update('seasonalCapacity', e.target.value)}
                />
              </Field>
              <Field label={t('fields.distanceToBeachM')}>
                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  className={numericInputClass}
                  value={draft.seasonalDistance}
                  onChange={(e) => update('seasonalDistance', e.target.value)}
                />
              </Field>
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['seasonalAC', t('fields.airConditioning')],
                  ['seasonalPool', t('fields.pool')],
                  ['seasonalSeaView', t('fields.seaView')],
                  ['seasonalWifi', t('fields.wifi')]
                ] as const
              ).map(([key, label]) => (
                <ChoiceChip key={key} active={draft[key]} onClick={() => update(key, !draft[key])}>
                  {label}
                </ChoiceChip>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  function renderStepPricing(): React.ReactNode {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label={t('fields.price')}
            required
            hint={t('fields.priceHint')}
            icon={<Tag className="size-4 text-gold-600" aria-hidden="true" />}
          >
            <input
              type="text"
              inputMode="numeric"
              dir="ltr"
              className={numericInputClass}
              value={draft.price}
              onChange={(e) => update('price', e.target.value)}
            />
          </Field>

          <Field
            label={t('fields.secretMin')}
            required
            hint={secretFloor !== null ? t('fields.floorHint', {value: formatDzd(secretFloor)}) : undefined}
            icon={<EyeOff className="size-4 text-gold-600" aria-hidden="true" />}
          >
            <input
              type="text"
              inputMode="numeric"
              dir="ltr"
              className={numericInputClass}
              value={draft.secretMin}
              onChange={(e) => update('secretMin', e.target.value)}
            />
          </Field>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-navy-200 bg-navy-50 p-4">
          <Lock className="mt-0.5 size-5 shrink-0 text-navy-700" aria-hidden="true" />
          <p className="text-sm leading-7 text-navy-800">{t('fields.secretMinHint')}</p>
        </div>

        <div className="rounded-2xl border border-gold-300 bg-gold-50 p-5">
          <p className="text-sm font-bold text-navy-800">{t('fields.feePreview')}</p>
          <p className="mt-1 text-3xl font-extrabold text-navy-900" dir="ltr">
            {feePreview !== null ? formatDzd(feePreview) : '—'}
          </p>
          {feePreview === null ? (
            <p className="mt-1 text-xs text-muted-foreground">{t('fields.feePreviewEmpty')}</p>
          ) : null}
          <p className="mt-2 text-xs leading-6 text-muted-foreground">{t('fields.feeNote')}</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-bold text-navy-900">
              <ImagePlus className="size-4 text-gold-600" aria-hidden="true" />
              {t('images.title')}
            </p>
            <span className="text-xs font-bold text-muted-foreground">
              {t('images.count', {count: images.length, max: MAX_IMAGES_PER_PROPERTY})}
            </span>
          </div>
          <p className="text-xs leading-6 text-muted-foreground">{t('images.hint')}</p>

          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_IMAGE_MIME_TYPES.join(',')}
            multiple
            className="hidden"
            onChange={(e) => handleFilesChosen(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length >= MAX_IMAGES_PER_PROPERTY}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gold-300 bg-gold-50/50 px-4 py-8 font-bold text-navy-800 transition-colors hover:border-gold-500 hover:bg-gold-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload className="size-5 text-gold-600" aria-hidden="true" />
            {t('images.add')}
          </button>

          {images.length > 0 ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {images.map((image) => (
                <li key={image.localId} className="group relative overflow-hidden rounded-xl border border-border bg-muted">
                  {/* المعاينة بلوب محلي — لا روابط خارجية */}
                  {/* eslint-disable-next-line @next/next/no-img-element -- بلوب محلي، لا فائدة من مُحسِّن الصور هنا */}
                  <img src={image.previewUrl} alt="" className="aspect-4/3 w-full object-cover" />
                  {image.status === 'uploading' ? (
                    <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-navy-950/60 text-xs font-bold text-white">
                      <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                      {t('images.uploading')}
                    </span>
                  ) : null}
                  {image.status === 'error' ? (
                    <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-destructive/90 px-2 py-1.5 text-[11px] font-bold text-white">
                      {t('images.failed')}
                      {image.file ? (
                        <button
                          type="button"
                          className="underline"
                          onClick={() => {
                            setImages((list) =>
                              list.map((i) => (i.localId === image.localId ? {...i, status: 'uploading'} : i))
                            );
                            void uploadOne(image.localId, image.file as File);
                          }}
                        >
                          {t('images.retry')}
                        </button>
                      ) : null}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => removeImage(image.localId)}
                    aria-label={t('images.remove')}
                    className="absolute end-1.5 top-1.5 rounded-full bg-navy-950/70 p-1.5 text-white opacity-0 transition-opacity hover:bg-destructive focus:opacity-100 group-hover:opacity-100"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {images.length > 0 ? <p className="text-xs text-muted-foreground">{t('images.firstIsPrimary')}</p> : null}
        </div>
      </div>
    );
  }

  function renderStepOwner(): React.ReactNode {
    const loggedIn = me !== null && me !== 'loading';
    return (
      <div className="space-y-6">
        <Field label={t('fields.accountType')} required icon={<UserRound className="size-4 text-gold-600" aria-hidden="true" />}>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('fields.accountType')}>
            {ACCOUNT_TYPES.map((type) => (
              <ChoiceChip key={type} active={draft.accountType === type} onClick={() => update('accountType', type)}>
                {t(`types.account.${type}`)}
              </ChoiceChip>
            ))}
          </div>
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label={t('fields.ownerName')} required icon={<UserRound className="size-4 text-gold-600" aria-hidden="true" />}>
            <input
              type="text"
              className={inputClass}
              value={draft.ownerName}
              maxLength={80}
              autoComplete="name"
              onChange={(e) => update('ownerName', e.target.value)}
            />
          </Field>

          <Field
            label={t('fields.ownerPhone')}
            required
            hint={t('fields.ownerPhoneHint')}
            icon={<Phone className="size-4 text-gold-600" aria-hidden="true" />}
          >
            <input
              type="tel"
              dir="ltr"
              inputMode="tel"
              autoComplete="tel"
              className={numericInputClass}
              value={draft.ownerPhone}
              placeholder="0550 11 22 33"
              onChange={(e) => update('ownerPhone', e.target.value)}
            />
          </Field>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted p-4">
          {loggedIn ? (
            <>
              <Check className="mt-0.5 size-5 shrink-0 text-gold-700" aria-hidden="true" />
              <p className="text-sm leading-7 text-navy-800">{t('sessionNotice')}</p>
            </>
          ) : (
            <>
              <Info className="mt-0.5 size-5 shrink-0 text-navy-700" aria-hidden="true" />
              <p className="text-sm leading-7 text-navy-800">{t('anonNotice')}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  const STEP_RENDERERS: Record<Step, () => React.ReactNode> = {
    1: renderStepType,
    2: renderStepLocation,
    3: renderStepDetails,
    4: renderStepPricing,
    5: renderStepOwner
  };

  const STEP_KEYS = ['type', 'location', 'details', 'pricing', 'owner'] as const;

  // ─── الإيصال ────────────────────────────────────────────────────────────

  if (receipt) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-3xl border border-gold-200 bg-card p-6 shadow-sm sm:p-10">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-navy-900">
            <Check className="size-8 text-gold-400" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-center text-2xl font-extrabold text-navy-900">{t('receipt.title')}</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">{t('receipt.subtitle')}</p>

          <dl className="mt-8 divide-y divide-border rounded-2xl border border-border">
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <dt className="text-sm font-semibold text-muted-foreground">{t('receipt.id')}</dt>
              <dd className="font-mono text-sm font-bold text-navy-900" dir="ltr">
                {receipt.id}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <dt className="text-sm font-semibold text-muted-foreground">{t('receipt.askingPrice')}</dt>
              <dd className="text-sm font-extrabold text-navy-900" dir="ltr">
                {formatDzd(receipt.askingPrice)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <dt className="text-sm font-semibold text-muted-foreground">{t('receipt.fee')}</dt>
              <dd className="text-sm font-extrabold text-gold-700" dir="ltr">
                {formatDzd(receipt.fee)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <dt className="text-sm font-semibold text-muted-foreground">{t('receipt.imagesCount')}</dt>
              <dd className="text-sm font-bold text-navy-900">{receipt.imagesCount}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <dt className="text-sm font-semibold text-muted-foreground">{t('receipt.status')}</dt>
              <dd className="text-sm font-bold text-navy-900">
                {receipt.status === 'UNMONITORED' ? t('receipt.statusUnmonitored') : t('receipt.statusActive')}
              </dd>
            </div>
          </dl>

          <div className="mt-6 space-y-3">
            <p className="flex items-start gap-2 rounded-xl bg-gold-50 px-4 py-3 text-xs leading-6 text-navy-800">
              <Lock className="mt-0.5 size-4 shrink-0 text-gold-700" aria-hidden="true" />
              {t('receipt.secretNote')}
            </p>
            <p className="flex items-start gap-2 rounded-xl bg-muted px-4 py-3 text-xs leading-6 text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {t('receipt.feeNote')}
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button type="button" onClick={resetAll} className={primaryButtonClass}>
              {t('receipt.newListing')}
            </button>
            {receipt.status === 'UNMONITORED' ? (
              <Link href="/login" className={secondaryButtonClass}>
                {t('receipt.createAccount')}
              </Link>
            ) : (
              <Link href="/" className={secondaryButtonClass}>
                {t('receipt.goHome')}
              </Link>
            )}
          </div>
        </div>
      </section>
    );
  }

  // ─── التبويبان ───────────────────────────────────────────────────────────

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold text-navy-900">{t('title')}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">{t('subtitle')}</p>
      </header>

      <div className="mt-8" role="tablist" aria-label={t('title')}>
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1.5">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'single'}
            onClick={() => setTab('single')}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
              tab === 'single' ? 'bg-navy-900 text-white shadow-sm' : 'text-muted-foreground hover:text-navy-900'
            }`}
          >
            {t('tabSingle')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'bulk'}
            onClick={() => setTab('bulk')}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
              tab === 'bulk' ? 'bg-navy-900 text-white shadow-sm' : 'text-muted-foreground hover:text-navy-900'
            }`}
          >
            <FileSpreadsheet className="size-4" aria-hidden="true" />
            {t('tabBulk')}
          </button>
        </div>
      </div>

      {tab === 'bulk' ? (
        <BulkImportPanel me={me} formatDzd={formatDzd} />
      ) : (
        <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {/* مؤشر الخطوات */}
          <ol className="flex items-center gap-1.5" aria-label={t('nav.stepIndicator', {step, total: 5})}>
            {STEP_KEYS.map((key, index) => {
              const number = (index + 1) as Step;
              const done = number < step;
              const current = number === step;
              return (
                <li key={key} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                  <span
                    aria-current={current ? 'step' : undefined}
                    className={`flex size-8 items-center justify-center rounded-full text-xs font-extrabold transition-colors ${
                      done
                        ? 'bg-gold-500 text-navy-950'
                        : current
                          ? 'bg-navy-900 text-white ring-4 ring-gold-500/25'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {done ? <Check className="size-4" aria-hidden="true" /> : number}
                  </span>
                  <span
                    className={`hidden w-full truncate text-center text-[11px] font-bold sm:block ${
                      current ? 'text-navy-900' : 'text-muted-foreground'
                    }`}
                  >
                    {t(`steps.${key}`)}
                  </span>
                </li>
              );
            })}
          </ol>

          <h2 className="mt-6 text-lg font-extrabold text-navy-900">
            {t(`steps.${STEP_KEYS[step - 1] ?? 'type'}`)}
          </h2>

          <div className="mt-6">{STEP_RENDERERS[step]()}</div>

          {stepError ? (
            <p role="alert" className="mt-6 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
              {stepError === 'secretBelowFloor' && secretFloor !== null
                ? tValidation('secretBelowFloor', {value: formatDzd(secretFloor)})
                : tValidation(stepError)}
            </p>
          ) : null}
          {apiError ? (
            <p role="alert" className="mt-6 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
              {tErrors(apiError)}
            </p>
          ) : null}

          <div className="mt-8 flex items-center justify-between gap-3">
            <button type="button" onClick={goBack} disabled={step === 1 || busy} className={secondaryButtonClass}>
              <BackIcon className="size-4" aria-hidden="true" />
              {t('nav.back')}
            </button>

            {step < 5 ? (
              <button type="button" onClick={goNext} className={primaryButtonClass}>
                {t('nav.next')}
                <NextIcon className="size-4" aria-hidden="true" />
              </button>
            ) : (
              <button type="button" onClick={() => void submit()} disabled={busy} className={primaryButtonClass}>
                {busy ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Check className="size-5" aria-hidden="true" />}
                {busy ? t('nav.submitting') : t('nav.submit')}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// ─── لوحة الاستيراد الجماعي (الوكالات) ───────────────────────────────────────

const BULK_COLUMN_COUNT_MIN = 7;

interface BulkRowPayload {
  readonly dealType: string;
  readonly propertyType: string;
  readonly wilaya: string;
  readonly commune: string;
  readonly title: string;
  readonly price: string;
  readonly secretMin: string;
  readonly area?: string;
  readonly rooms?: string;
  readonly bathrooms?: string;
  readonly neighborhood?: string;
  readonly description?: string;
}

function splitBulkLine(line: string): string[] {
  // لصق Sheets/Excel يفصل بـ Tab؛ النماذج النصية بـ «;»
  const separator = line.includes('\t') ? '\t' : ';';
  return line.split(separator).map((cell) => cell.trim());
}

function cell(cells: string[], index: number): string | undefined {
  const value = cells[index]?.trim() ?? '';
  return value.length > 0 ? value : undefined;
}

function parseBulkText(text: string): {rows: BulkRowPayload[]; incomplete: number[]} {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const rows: BulkRowPayload[] = [];
  const incomplete: number[] = [];
  lines.forEach((line, index) => {
    const cells = splitBulkLine(line);
    if (cells.filter((c) => c.length > 0).length < BULK_COLUMN_COUNT_MIN) {
      incomplete.push(index + 1);
      return;
    }
    rows.push({
      dealType: cells[0] ?? '',
      propertyType: cells[1] ?? '',
      wilaya: cells[2] ?? '',
      commune: cells[3] ?? '',
      title: cells[4] ?? '',
      price: cells[5] ?? '',
      secretMin: cells[6] ?? '',
      area: cell(cells, 7),
      rooms: cell(cells, 8),
      bathrooms: cell(cells, 9),
      neighborhood: cell(cells, 10),
      description: cell(cells, 11)
    });
  });
  return {rows, incomplete};
}

function BulkImportPanel({me}: {readonly me: MeSummary | null | 'loading'; readonly formatDzd: (v: number) => string}) {
  const t = useTranslations('publish.bulk');
  const tErrors = useTranslations('publish.errors');

  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [panelError, setPanelError] = useState<PublishErrorCode | 'readError' | 'noRows' | null>(null);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAgency = me !== null && me !== 'loading' && me.role === 'agency';
  const parsed = useMemo(() => parseBulkText(text), [text]);

  function downloadTemplate(): void {
    const sample = [
      'بيع;شقة;16;حيدرة;شقة F3 فاخرة قريبة من الجامعة;25000000;22000000;85;3;1;حيدرة العليا;شقة مشمسة مع موقف',
      'vente;appartement;31;Bir El Djir;Appartement F4 neuf;18500000;17000000;110;4;2;;',
      'كراء موسمي;فيلا;23;عنابة;فيلا مطلة على البحر;200000;150000;300;5;3;;فيها مسبح ومكيف'
    ].join('\n');
    const blob = new Blob([`﻿${sample}`], {type: 'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'aqar-match-bulk-template.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleFileChosen(file: File | undefined): Promise<void> {
    if (!file) return;
    setPanelError(null);
    try {
      const content = await file.text();
      setText(content);
    } catch {
      setPanelError('readError');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function runImport(): Promise<void> {
    setPanelError(null);
    if (parsed.rows.length === 0) {
      setPanelError('noRows');
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const data = await postJson<BulkImportResult>('/api/bulk-import', {
        rows: parsed.rows,
        accountType: 'AGENCY'
      });
      setResult(data);
    } catch (err) {
      const fail = err as ApiFail;
      const token = fail.issueToken ?? fail.code;
      setPanelError(
        PUBLISH_ERROR_CODES.includes(token as PublishErrorCode) ? (token as PublishErrorCode) : 'INTERNAL'
      );
    } finally {
      setBusy(false);
    }
  }

  function translateReason(reason: string): string {
    return PUBLISH_ERROR_CODES.includes(reason as PublishErrorCode)
      ? tErrors(reason as PublishErrorCode)
      : reason;
  }

  if (me === 'loading') {
    return (
      <div className="mt-8 flex items-center justify-center gap-2 rounded-3xl border border-border bg-card p-12 text-sm font-bold text-muted-foreground">
        <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        {t('loading')}
      </div>
    );
  }

  if (!isAgency) {
    return (
      <div className="mt-8 rounded-3xl border border-border bg-card p-8 text-center">
        <ShieldCheck className="mx-auto size-10 text-gold-600" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-extrabold text-navy-900">{t('title')}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted-foreground">{t('agencyOnly')}</p>
        {me === null ? (
          <Link href="/login?next=/publish" className={`${primaryButtonClass} mt-6`}>
            {t('importNow')}
          </Link>
        ) : null}
      </div>
    );
  }

  if (result) {
    const allIssues = [
      ...result.errors.map((e) => ({...e, kind: 'failed' as const})),
      ...result.skippedRows.map((e) => ({...e, kind: 'skipped' as const}))
    ].sort((a, b) => a.row - b.row);

    return (
      <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-extrabold text-navy-900">{t('resultsTitle')}</h2>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-navy-900 p-4 text-center">
            <p className="text-2xl font-extrabold text-gold-400">{result.success}</p>
            <p className="mt-1 text-xs font-bold text-white/80">{t('success')}</p>
          </div>
          <div className="rounded-2xl bg-gold-100 p-4 text-center">
            <p className="text-2xl font-extrabold text-gold-800">{result.skipped}</p>
            <p className="mt-1 text-xs font-bold text-gold-900/70">{t('skipped')}</p>
          </div>
          <div className="rounded-2xl bg-destructive/10 p-4 text-center">
            <p className="text-2xl font-extrabold text-destructive">{result.failed}</p>
            <p className="mt-1 text-xs font-bold text-destructive/70">{t('failed')}</p>
          </div>
        </div>

        {allIssues.length > 0 ? (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-96 text-start text-sm">
              <thead className="bg-muted text-xs font-extrabold text-navy-900">
                <tr>
                  <th className="px-4 py-3 text-start">{t('colRow')}</th>
                  <th className="px-4 py-3 text-start">{t('colField')}</th>
                  <th className="px-4 py-3 text-start">{t('colReason')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allIssues.map((issue, index) => (
                  <tr key={`${issue.row}-${index}`} className={issue.kind === 'skipped' ? 'bg-gold-50/60' : undefined}>
                    <td className="px-4 py-2.5 font-mono font-bold text-navy-900">{issue.row}</td>
                    <td className="px-4 py-2.5 text-muted-foreground" dir="ltr">
                      {issue.field ?? '—'}
                    </td>
                    <td className={`px-4 py-2.5 font-semibold ${issue.kind === 'skipped' ? 'text-gold-800' : 'text-destructive'}`}>
                      {translateReason(issue.reason)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-6 flex items-center gap-2 rounded-xl bg-navy-50 px-4 py-3 text-sm font-bold text-navy-800">
            <Check className="size-4 text-gold-700" aria-hidden="true" />
            {t('noIssues')}
          </p>
        )}

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            className={primaryButtonClass}
            onClick={() => {
              setResult(null);
              setText('');
              setPanelError(null);
            }}
          >
            {t('again')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-extrabold text-navy-900">{t('title')}</h2>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">{t('subtitle')}</p>

      <div className="mt-6 rounded-2xl bg-muted p-4">
        <p className="text-xs font-extrabold text-navy-900">{t('columnsTitle')}</p>
        <p className="mt-1 font-mono text-[11px] leading-6 text-muted-foreground" dir="auto">
          dealType ; propertyType ; wilaya ; commune ; title ; price ; secretMin ; area ; rooms ; bathrooms ; neighborhood ; description
        </p>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">{t('acceptedTypes')}</p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={downloadTemplate} className={secondaryButtonClass}>
          <Download className="size-4" aria-hidden="true" />
          {t('downloadTemplate')}
        </button>
        <span className="text-xs font-bold text-muted-foreground">{t('or')}</span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt,text/csv,text/plain"
          className="hidden"
          onChange={(e) => void handleFileChosen(e.target.files?.[0])}
        />
        <button type="button" onClick={() => fileInputRef.current?.click()} className={secondaryButtonClass}>
          <FileSpreadsheet className="size-4" aria-hidden="true" />
          {t('uploadFile')}
        </button>
      </div>

      <div className="mt-6 space-y-2">
        <label htmlFor="bulk-paste" className="text-sm font-bold text-navy-900">
          {t('pasteLabel')}
        </label>
        <textarea
          id="bulk-paste"
          className={`${inputClass} min-h-44 resize-y font-mono text-xs leading-6`}
          placeholder={t('pastePlaceholder')}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setPanelError(null);
          }}
        />
        <p className="text-xs text-muted-foreground">
          {t('rowsReady', {count: parsed.rows.length})}
          {parsed.incomplete.length > 0 ? ` — ${t('rowTooShort')}` : ''}
        </p>
      </div>

      {panelError ? (
        <p role="alert" className="mt-4 flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          {panelError === 'readError'
            ? t('readError')
            : panelError === 'noRows'
              ? t('noRows')
              : tErrors(panelError)}
        </p>
      ) : null}

      <div className="mt-6 flex justify-end">
        <button type="button" onClick={() => void runImport()} disabled={busy || parsed.rows.length === 0} className={primaryButtonClass}>
          {busy ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Upload className="size-5" aria-hidden="true" />}
          {busy ? t('importing') : t('importNow')}
        </button>
      </div>

      <p className="mt-4 flex items-start gap-2 text-xs leading-6 text-muted-foreground">
        <Trash2 className="mt-0.5 size-4 shrink-0 text-gold-600" aria-hidden="true" />
        {t('acceptedTypes')}
      </p>
    </div>
  );
}
