"use client";

import { useState } from "react";
import { useLang } from "./LanguageContext";
import { Stepper } from "./Stepper";
import { Alert } from "./Alert";
import { PlatformButton } from "./PlatformButton";
import {
  PROPERTY_TYPES,
  LEGAL_STATUSES,
  ROOM_OPTIONS,
  BATHROOM_OPTIONS,
  FACADE_OPTIONS,
  WILAYAS,
  getCommunesForWilaya,
  PropertyTypeKey,
  calcSaleFee,
  calcRentFee,
  formatDZD,
} from "./data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Camera, X, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PublishState {
  // Step 1
  transactionType: "sale" | "rent" | null;
  propertyType: PropertyTypeKey | null;
  // Step 2
  wilaya: string;
  commune: string;
  neighborhood: string;
  area: string;
  rooms: string;
  floor: string;
  bathrooms: string;
  facades: string;
  legalStatus: string;
  listingTitle: string;
  listingDesc: string;
  // Step 3
  askingPrice: string;
  secretMin: string;
  // Step 4
  accountType: "individual" | "agency" | "notary" | null;
  fullName: string;
  whatsapp: string;
  // Step 5
  photos: string[];
}

const initialState: PublishState = {
  transactionType: null,
  propertyType: null,
  wilaya: "",
  commune: "",
  neighborhood: "",
  area: "",
  rooms: "",
  floor: "",
  bathrooms: "",
  facades: "",
  legalStatus: "",
  listingTitle: "",
  listingDesc: "",
  askingPrice: "",
  secretMin: "",
  accountType: null,
  fullName: "",
  whatsapp: "",
  photos: [],
};

export function PublishFlow({ onBackHome }: { onBackHome: () => void }) {
  const { t, dir } = useLang();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<PublishState>(initialState);
  const [published, setPublished] = useState(false);

  const update = <K extends keyof PublishState>(
    key: K,
    value: PublishState[K]
  ) => setState((s) => ({ ...s, [key]: value }));

  const stepLabels = [
    t("step_type"),
    t("step_location"),
    t("step_pricing"),
    t("step_info"),
    t("step_photos"),
  ];

  // التحقق من صحة كل خطوة
  // الأرض الفلاحية فقط تظهر المساحة بالهكتار، أما أرض البناء فبالمتر المربع
  const isFarmland = state.propertyType === "farmland";
  const isLand =
    state.propertyType === "buildable_land" ||
    state.propertyType === "farmland";

  const stepValid: Record<number, boolean> = {
    1: !!state.transactionType && !!state.propertyType,
    2:
      !!state.wilaya &&
      !!state.commune &&
      !!state.neighborhood &&
      !!state.area &&
      !!state.legalStatus &&
      !!state.listingTitle &&
      (isLand || (!!state.rooms && !!state.facades)),
    3: !!state.askingPrice && !!state.secretMin,
    4: !!state.accountType && !!state.fullName && !!state.whatsapp,
    5: true, // الصور اختيارية
  };

  const handleNext = () => {
    if (step < 5 && stepValid[step]) setStep(step + 1);
    else if (step === 5) setPublished(true);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const reset = () => {
    setState(initialState);
    setStep(1);
    setPublished(false);
  };

  // حساب الرسم الشفاف
  const feePreview =
    state.transactionType === "sale" && state.secretMin
      ? calcSaleFee(Number(state.secretMin))
      : state.transactionType === "rent" && state.secretMin
      ? calcRentFee(Number(state.secretMin))
      : 0;

  const PrevIcon = dir === "rtl" ? ArrowRight : ArrowLeft;
  const NextIcon = dir === "rtl" ? ArrowLeft : ArrowRight;

  if (published) {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center bg-white rounded-2xl shadow-sm border border-border p-8 md:p-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--navy)] mb-4">
            {t("brand_aqar")} {t("brand_match")}
          </h2>
          <p className="text-base md:text-lg text-foreground leading-relaxed mb-8">
            {t("publish_success")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <PlatformButton variant="gold">
              {t("create_account_20s")}
            </PlatformButton>
            <PlatformButton variant="text" onClick={reset}>
              {t("back_home")}
            </PlatformButton>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* رأس الصفحة */}
      <div className="mb-6">
        <button
          onClick={onBackHome}
          className="text-sm text-muted-foreground hover:text-[var(--navy)] mb-3 transition"
        >
          ← {t("back_home")}
        </button>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--navy)] mb-1">
          {t("publish_title")}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          {t("publish_subtitle")}
        </p>
      </div>

      {/* شريط المراحل */}
      <div className="bg-white rounded-xl border border-border p-4 md:p-6 mb-6 shadow-sm">
        <Stepper current={step} total={5} labels={stepLabels} />
      </div>

      {/* بطاقة المرحلة */}
      <div className="bg-white rounded-xl border border-border p-6 md:p-8 shadow-sm">
        {/* === المرحلة 1 === */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[var(--navy)] mb-3">
                {t("transaction_type")}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <ChoiceCard
                  selected={state.transactionType === "sale"}
                  onClick={() => update("transactionType", "sale")}
                  label={t("transaction_sale")}
                />
                <ChoiceCard
                  selected={state.transactionType === "rent"}
                  onClick={() => update("transactionType", "rent")}
                  label={t("transaction_rent")}
                />
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[var(--navy)] mb-3">
                {t("property_type")}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {PROPERTY_TYPES.map((pt) => (
                  <ChoiceCard
                    key={pt.key}
                    selected={state.propertyType === pt.key}
                    onClick={() => update("propertyType", pt.key)}
                    label={t(`type_${pt.key}`)}
                    icon={<span className="text-2xl">{pt.icon}</span>}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* === المرحلة 2 === */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-[var(--navy)]">
              {t("step_location")} — {t("property_details")}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">{t("wilaya")}</Label>
                <Select
                  value={state.wilaya}
                  onValueChange={(v) => {
                    update("wilaya", v);
                    update("commune", "");
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("choose_wilaya")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {WILAYAS.map((w) => (
                      <SelectItem key={w} value={w}>
                        {w}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-1.5 block">{t("commune")}</Label>
                <Select
                  value={state.commune}
                  onValueChange={(v) => update("commune", v)}
                  disabled={!state.wilaya}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        state.wilaya ? t("choose_commune") : t("choose_wilaya")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {state.wilaya &&
                      getCommunesForWilaya(state.wilaya).map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">{t("neighborhood")}</Label>
              <Input
                value={state.neighborhood}
                onChange={(e) => update("neighborhood", e.target.value)}
                placeholder={t("neighborhood")}
              />
            </div>

            <div className="border-t border-border pt-5">
              <h3 className="font-bold text-[var(--navy)] mb-3">
                {t("property_details")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-1.5 block">
                    {isFarmland ? t("area_hectare") : t("area")}
                  </Label>
                  <Input
                    type="number"
                    value={state.area}
                    onChange={(e) => update("area", e.target.value)}
                    placeholder="0"
                  />
                </div>

                {!isLand && (
                  <div>
                    <Label className="mb-1.5 block">{t("rooms")}</Label>
                    <Select
                      value={state.rooms}
                      onValueChange={(v) => update("rooms", v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="0" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROOM_OPTIONS.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {!isLand && (
                  <div>
                    <Label className="mb-1.5 block">{t("floor")}</Label>
                    <Input
                      type="number"
                      value={state.floor}
                      onChange={(e) => update("floor", e.target.value)}
                      placeholder="0"
                    />
                  </div>
                )}

                {!isLand && (
                  <div>
                    <Label className="mb-1.5 block">{t("bathrooms")}</Label>
                    <Select
                      value={state.bathrooms}
                      onValueChange={(v) => update("bathrooms", v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="0" />
                      </SelectTrigger>
                      <SelectContent>
                        {BATHROOM_OPTIONS.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label className="mb-1.5 block">{t("facades")}</Label>
                  <Select
                    value={state.facades}
                    onValueChange={(v) => update("facades", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="0" />
                    </SelectTrigger>
                    <SelectContent>
                      {FACADE_OPTIONS.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label className="mb-1.5 block">{t("legal_status")}</Label>
                  <Select
                    value={state.legalStatus}
                    onValueChange={(v) => update("legalStatus", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("legal_status")} />
                    </SelectTrigger>
                    <SelectContent>
                      {LEGAL_STATUSES.map((ls) => (
                        <SelectItem key={ls} value={ls}>
                          {t(ls)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-5 space-y-4">
              <div>
                <Label className="mb-1.5 block">{t("listing_title")}</Label>
                <Input
                  value={state.listingTitle}
                  onChange={(e) => update("listingTitle", e.target.value)}
                  placeholder={t("listing_title_ph")}
                />
              </div>
              <div>
                <Label className="mb-1.5 block">
                  {t("listing_desc")}{" "}
                  <span className="text-muted-foreground text-xs">
                    ({t("optional")})
                  </span>
                </Label>
                <Textarea
                  value={state.listingDesc}
                  onChange={(e) => update("listingDesc", e.target.value)}
                  placeholder={t("listing_desc_ph")}
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}

        {/* === المرحلة 3: التسعير === */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-[var(--navy)]">
              {t("step_pricing")}
            </h2>

            <div>
              <Label className="mb-1.5 block">{t("asking_price")}</Label>
              <Input
                type="number"
                value={state.askingPrice}
                onChange={(e) => update("askingPrice", e.target.value)}
                placeholder="0"
              />
            </div>

            <div>
              <Label className="mb-1.5 block">{t("secret_min")}</Label>
              <Input
                type="number"
                value={state.secretMin}
                onChange={(e) => update("secretMin", e.target.value)}
                placeholder="0"
              />
              <Alert variant="secure" className="mt-2">
                {t("secret_alert")}
              </Alert>
            </div>

            <div className="border-t border-border pt-5">
              <Label className="block mb-2 font-bold text-[var(--navy)]">
                {t("transparent_fees")}
              </Label>
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t("fee_example")}
                  </span>
                  <span className="text-2xl font-extrabold text-[var(--gold)]">
                    {feePreview ? formatDZD(feePreview) : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === المرحلة 4: معلوماتك === */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-[var(--navy)]">
              {t("step_info")}
            </h2>

            <div>
              <Label className="mb-2 block">{t("account_type")}</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(
                  [
                    "individual",
                    "agency",
                    "notary",
                  ] as const
                ).map((at) => (
                  <ChoiceCard
                    key={at}
                    selected={state.accountType === at}
                    onClick={() => update("accountType", at)}
                    label={t(`account_${at}`)}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">{t("full_name")}</Label>
              <Input
                value={state.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                placeholder={t("full_name")}
              />
            </div>

            <div>
              <Label className="mb-1.5 block">{t("whatsapp")}</Label>
              <Input
                type="tel"
                value={state.whatsapp}
                onChange={(e) => update("whatsapp", e.target.value)}
                placeholder="06XXXXXXXX"
                dir="ltr"
              />
              <div className="mt-2 space-y-1">
                <p className="text-xs text-muted-foreground">
                  {t("whatsapp_note1")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("whatsapp_note2")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* === المرحلة 5: الصور === */}
        {step === 5 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-[var(--navy)]">
              {t("photos_title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("photos_subtitle")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("photos_desc")}
            </p>

            <div className="border-2 border-dashed border-border rounded-xl p-6 md:p-10 text-center hover:border-[var(--gold)]/50 transition cursor-pointer">
              <Camera className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium text-[var(--navy)] mb-1">
                {t("add_photo")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("photo_limits")}
              </p>
            </div>

            {state.photos.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {state.photos.map((p, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-lg overflow-hidden bg-muted"
                  >
                    <img
                      src={p}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() =>
                        update(
                          "photos",
                          state.photos.filter((_, idx) => idx !== i)
                        )
                      }
                      className="absolute top-1 end-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* الأزرار */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-border">
          <PlatformButton
            variant="gray"
            onClick={handlePrev}
            disabled={step === 1}
            className="gap-1.5"
          >
            <PrevIcon className="w-4 h-4" />
            {t("previous")}
          </PlatformButton>

          <PlatformButton
            variant="gold"
            onClick={handleNext}
            disabled={!stepValid[step]}
            className="gap-1.5"
          >
            {step === 5 ? t("publish_btn") : t("next")}
            <NextIcon className="w-4 h-4" />
          </PlatformButton>
        </div>
      </div>
    </main>
  );
}

function ChoiceCard({
  selected,
  onClick,
  label,
  icon,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-start",
        selected
          ? "border-[var(--gold)] bg-[var(--gold)]/10 shadow-sm"
          : "border-border hover:border-[var(--gold)]/50 bg-white"
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span
        className={cn(
          "font-medium",
          selected ? "text-[var(--navy)] font-bold" : "text-foreground"
        )}
      >
        {label}
      </span>
    </button>
  );
}
