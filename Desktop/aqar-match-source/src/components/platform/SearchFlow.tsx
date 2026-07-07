"use client";

import { useState } from "react";
import { useLang } from "./LanguageContext";
import { Stepper } from "./Stepper";
import { Alert } from "./Alert";
import { PlatformButton } from "./PlatformButton";
import {
  PROPERTY_TYPES,
  WILAYAS,
  getCommunesForWilaya,
  PropertyTypeKey,
  calcSaleFee,
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
import { Label } from "@/components/ui/label";
import {
  Home,
  Key,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Bell,
  Search as SearchIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchState {
  // Step 1
  dealType: "buy" | "rent" | null;
  // Step 2
  propertyType: PropertyTypeKey | null;
  // Step 3
  wilaya: string;
  commune: string;
  neighborhood: string;
  // Step 4
  budget: string;
  // Step 5
  fullName: string;
  whatsapp: string;
}

const initialState: SearchState = {
  dealType: null,
  propertyType: null,
  wilaya: "",
  commune: "",
  neighborhood: "",
  budget: "",
  fullName: "",
  whatsapp: "",
};

type ResultView = "form" | "no_match" | "match_found" | "paid" | "canceled";

export function SearchFlow({ onBackHome }: { onBackHome: () => void }) {
  const { t, dir } = useLang();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<SearchState>(initialState);
  const [result, setResult] = useState<ResultView>("form");

  const update = <K extends keyof SearchState>(
    key: K,
    value: SearchState[K]
  ) => setState((s) => ({ ...s, [key]: value }));

  const stepLabels = [
    t("what_do_you_want"),
    t("step_type"),
    t("step_location"),
    t("max_budget"),
    t("your_contact"),
  ];

  const stepValid: Record<number, boolean> = {
    1: !!state.dealType,
    2: !!state.propertyType,
    3: !!state.wilaya && !!state.commune,
    4: !!state.budget && Number(state.budget) > 0,
    5: !!state.fullName && !!state.whatsapp,
  };

  const handleNext = () => {
    if (step < 5 && stepValid[step]) setStep(step + 1);
    else if (step === 5 && stepValid[5]) {
      // محاكاة المحرك السري
      // في الإنتاج: استدعاء API للمطابقة
      const hasMatch = Math.random() > 0.5; // 50% فرصة للتطابق للعرض التوضيحي
      setResult(hasMatch ? "match_found" : "no_match");
    }
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const reset = () => {
    setState(initialState);
    setStep(1);
    setResult("form");
  };

  const PrevIcon = dir === "rtl" ? ArrowRight : ArrowLeft;
  const NextIcon = dir === "rtl" ? ArrowLeft : ArrowRight;

  // عرض النتائج
  if (result === "no_match") {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-8 md:p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <SearchIcon className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-[var(--navy)] mb-2">
            {t("no_match_title")}
          </h2>
          <p className="text-muted-foreground mb-4">{t("no_match_desc")}</p>
          <div className="bg-muted/40 rounded-lg p-4 mb-8">
            <p className="text-sm text-foreground flex items-center justify-center gap-2">
              <Bell className="w-4 h-4 text-[var(--gold)] shrink-0" />
              {t("no_match_engine")}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <PlatformButton variant="gold" onClick={reset}>
              {t("new_search")}
            </PlatformButton>
            <PlatformButton
              variant="gray"
              onClick={() => {
                setStep(4);
                setResult("form");
              }}
            >
              {t("edit_budget")}
            </PlatformButton>
            <PlatformButton variant="text" onClick={onBackHome}>
              {t("back_home")}
            </PlatformButton>
          </div>
        </div>
      </main>
    );
  }

  if (result === "match_found") {
    const buyerFee = Math.round(calcSaleFee(Number(state.budget)) / 2);
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="bg-white rounded-2xl border-2 border-[var(--gold)] shadow-md p-6 md:p-10 mb-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--navy)] mb-2">
            {t("match_found_title")}
          </h2>
          <p className="text-foreground mb-2">{t("match_found_desc")}</p>
          <p className="text-sm text-muted-foreground mb-6">
            {t("match_found_cta")}
          </p>

          <div className="bg-muted/50 rounded-lg p-4 mb-6 text-start">
            <h3 className="font-bold text-[var(--navy)] mb-3 text-center">
              {t("fee_summary")}
            </h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {t("buyer_fee")}
              </span>
              <span className="text-xl font-extrabold text-[var(--gold)]">
                {formatDZD(buyerFee)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("fee_refund_note")}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <PlatformButton
              variant="gold"
              onClick={() => setResult("paid")}
              className="gap-2"
            >
              {t("pay_confirm")}
            </PlatformButton>
            <PlatformButton
              variant="gray"
              onClick={() => {
                setStep(2);
                setResult("form");
              }}
            >
              {t("edit_search")}
            </PlatformButton>
            <PlatformButton
              variant="text"
              onClick={() => setResult("canceled")}
            >
              {t("cancel")}
            </PlatformButton>
          </div>
        </div>
      </main>
    );
  }

  if (result === "paid") {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-6">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6 md:p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-[var(--navy)] mb-2">
            {t("seriousness_confirmed")}
          </h2>
          <p className="text-foreground">{t("seller_notified")}</p>
        </div>

        {/* بطاقة العقار المطابق */}
        <div className="bg-white/60 backdrop-blur rounded-2xl border border-[var(--gold)]/30 shadow-sm p-6">
          <h3 className="text-lg font-bold text-[var(--navy)] mb-4">
            {t("matched_properties")} (1)
          </h3>
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-border">
              <div>
                <h4 className="font-bold text-[var(--navy)] text-lg">
                  {state.propertyType === "apartment"
                    ? t("type_apartment")
                    : state.propertyType === "villa"
                    ? t("type_villa")
                    : state.propertyType === "house"
                    ? t("type_house")
                    : state.propertyType === "shop"
                    ? t("type_shop")
                    : state.propertyType === "buildable_land"
                    ? t("type_buildable_land")
                    : t("type_farmland")}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {state.wilaya}، {state.commune}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-bold text-green-700">
                  {t("match_strong")}
                </span>
                <span className="text-sm font-extrabold text-green-700">
                  80%
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Detail label={t("area_approx")} value="100–120 م²" />
              <Detail
                label={t("legal_status")}
                value={t("legal_authenticated")}
              />
              <Detail label={t("rooms")} value="5" />
              <Detail label={t("bathrooms")} value="1" />
            </div>
          </div>
        </div>

        <div className="text-center">
          <PlatformButton variant="text" onClick={onBackHome}>
            {t("back_home")}
          </PlatformButton>
        </div>
      </main>
    );
  }

  if (result === "canceled") {
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl border border-border shadow-sm p-8 md:p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <XCircle className="w-10 h-10 text-muted-foreground" />
            </div>
          </div>
          <p className="text-foreground mb-8">{t("search_canceled")}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <PlatformButton variant="gold" onClick={reset}>
              {t("new_search")}
            </PlatformButton>
            <PlatformButton variant="text" onClick={onBackHome}>
              {t("back_home")}
            </PlatformButton>
          </div>
        </div>
      </main>
    );
  }

  // النموذج
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-6">
        <button
          onClick={onBackHome}
          className="text-sm text-muted-foreground hover:text-[var(--navy)] mb-3 transition"
        >
          ← {t("back_home")}
        </button>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--navy)] mb-1">
          {t("search_title")}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          {t("search_subtitle")}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-border p-4 md:p-6 mb-6 shadow-sm">
        <Stepper current={step} total={5} labels={stepLabels} />
      </div>

      <div className="bg-white rounded-xl border border-border p-6 md:p-8 shadow-sm">
        {/* === المرحلة 1 === */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-[var(--navy)]">
              {t("what_do_you_want")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <ChoiceCard
                selected={state.dealType === "buy"}
                onClick={() => update("dealType", "buy")}
                label={t("buy_property")}
                icon={<Home className="w-6 h-6 text-[var(--navy)]" />}
              />
              <ChoiceCard
                selected={state.dealType === "rent"}
                onClick={() => update("dealType", "rent")}
                label={t("rent_property")}
                icon={<Key className="w-6 h-6 text-[var(--navy)]" />}
              />
            </div>
            <Alert variant="secure">{t("search_secure_note")}</Alert>
          </div>
        )}

        {/* === المرحلة 2 === */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-[var(--navy)]">
              {t("which_type")}
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
        )}

        {/* === المرحلة 3 === */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-[var(--navy)]">
              {t("where_property")}
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
          </div>
        )}

        {/* === المرحلة 4 === */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[var(--navy)]">
              {t("max_budget")}
            </h2>
            <Input
              type="number"
              value={state.budget}
              onChange={(e) => update("budget", e.target.value)}
              placeholder={t("budget_ph")}
              dir="ltr"
              className="text-lg font-bold text-end"
            />
            <Alert variant="secure">{t("budget_secret")}</Alert>
            <p className="text-xs text-muted-foreground">
              {t("budget_use")}
            </p>
            <Alert variant="tip">{t("budget_tip")}</Alert>
          </div>
        )}

        {/* === المرحلة 5 === */}
        {step === 5 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-[var(--navy)] mb-1">
                {t("your_contact")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("contact_note")}
              </p>
            </div>

            <div>
              <Label className="mb-1.5 block">{t("full_name_label")}</Label>
              <Input
                value={state.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                placeholder={t("full_name_label")}
              />
            </div>

            <div>
              <Label className="mb-1.5 block">{t("whatsapp")}</Label>
              <Input
                type="tel"
                value={state.whatsapp}
                onChange={(e) => update("whatsapp", e.target.value)}
                placeholder={t("whatsapp_ph")}
                dir="ltr"
              />
              <Alert variant="secure" className="mt-2">
                {t("phone_secret")}
              </Alert>
            </div>

            {/* ملخص البحث */}
            <div className="bg-muted/40 rounded-lg p-4 space-y-2">
              <h3 className="font-bold text-[var(--navy)] mb-2">
                {t("search_summary")}
              </h3>
              <SummaryRow
                label={t("summary_deal")}
                value={
                  state.dealType === "buy"
                    ? t("transaction_sale")
                    : t("transaction_rent")
                }
              />
              <SummaryRow
                label={t("summary_type")}
                value={
                  state.propertyType
                    ? t(`type_${state.propertyType}`)
                    : "—"
                }
              />
              <SummaryRow
                label={t("summary_location")}
                value={`${state.wilaya}${
                  state.commune ? `، ${state.commune}` : ""
                }`}
              />
              <SummaryRow
                label={t("summary_budget")}
                value={
                  state.budget
                    ? new Intl.NumberFormat("fr-DZ").format(
                        Number(state.budget)
                      ) + " دج"
                    : "—"
                }
              />
            </div>

            <Alert variant="warning">{t("attempts_warning")}</Alert>
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
            {step === 5 ? t("start_matching") : t("next")}
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/30 rounded p-2">
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div className="font-medium text-foreground">{value}</div>
    </div>
  );
}
