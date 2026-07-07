"use client";

import {
  Lock,
  Zap,
  Ban,
  Home,
  Search,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Star,
  TrendingUp,
} from "lucide-react";
import { useLang } from "./LanguageContext";
import { PlatformButton } from "./PlatformButton";

export function HomePage({
  onStartPublish,
  onStartSearch,
}: {
  onStartPublish: () => void;
  onStartSearch: () => void;
}) {
  const { t } = useLang();

  return (
    <main>
      {/* ============== Hero Section ============== */}
      <section className="bg-[var(--navy)] text-white relative overflow-hidden">
        {/* توهج خلفي ذهبي */}
        <div
          className="absolute -top-32 -end-32 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: "var(--gold)" }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative">
          <div className="text-center max-w-3xl mx-auto">
            {/* العنوان */}
            <h1 className="flex items-baseline justify-center gap-2 text-3xl md:text-5xl font-extrabold mb-4">
              <span className="text-white">{t("brand_aqar")}</span>
              <span className="text-[var(--gold)]">{t("brand_match")}</span>
            </h1>

            {/* الشعار الفرعي */}
            <p className="text-lg md:text-2xl text-white/90 mb-6 leading-relaxed">
              {t("hero_tagline")}
            </p>

            {/* عبارة مزدوجة */}
            <div className="text-2xl md:text-4xl font-extrabold mb-6 leading-tight">
              <span className="text-white">{t("hero_no_browse")}، </span>
              <span className="text-[var(--gold)]">
                {t("hero_smart_match")}
              </span>
            </div>

            {/* سؤال استفزازي */}
            <p className="text-sm md:text-base text-white/70 mb-2 leading-relaxed">
              {t("hero_question")}
            </p>
            <p className="text-sm md:text-base text-white/80 mb-10 leading-relaxed">
              {t("hero_promise")}
            </p>

            {/* زرّا الاختيار */}
            <div className="flex flex-col gap-3 max-w-md mx-auto">
              <PlatformButton
                variant="gold"
                onClick={onStartPublish}
                className="w-full text-base md:text-lg py-4"
              >
                {t("cta_seller")}
              </PlatformButton>
              <PlatformButton
                variant="navy"
                onClick={onStartSearch}
                className="w-full text-base md:text-lg py-4 border-2 border-[var(--gold)]/40 hover:border-[var(--gold)]"
              >
                {t("cta_buyer")}
              </PlatformButton>
            </div>
          </div>
        </div>
      </section>

      {/* فاصل أفقي */}
      <div className="h-px bg-border" />

      {/* ============== نقاط الألم ============== */}
      <section className="bg-[var(--navy)] text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <PainPoint
              icon={<Lock className="w-8 h-8" />}
              iconColor="text-[var(--gold)]"
              title={t("pain_title_1")}
              desc={t("pain_desc_1")}
            />
            <PainPoint
              icon={<Zap className="w-8 h-8" />}
              iconColor="text-[var(--gold)]"
              title={t("pain_title_2")}
              desc={t("pain_desc_2")}
            />
            <PainPoint
              icon={<Ban className="w-8 h-8" />}
              iconColor="text-red-500"
              title={t("pain_title_3")}
              desc={t("pain_desc_3")}
            />
          </div>
        </div>
      </section>

      {/* فاصل يغير الخلفية إلى بيضاء */}
      <div className="h-px bg-border" />

      {/* ============== كيف تعمل ============== */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-extrabold mb-3">
              <span className="text-[var(--navy)]">{t("how_title_a")} </span>
              <span className="text-[var(--gold)]">
                {t("brand_aqar")} {t("brand_match")}
              </span>
              <span className="text-[var(--navy)]">{t("how_title_b")}</span>
            </h2>
            <p className="text-sm md:text-lg text-muted-foreground">
              {t("how_subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StepCard
              num="01"
              icon={<Home className="w-6 h-6" />}
              title={t("step1_title")}
              desc={t("step1_desc")}
            />
            <StepCard
              num="02"
              icon={<Search className="w-6 h-6" />}
              title={t("step2_title")}
              desc={t("step2_desc")}
            />
            <StepCard
              num="03"
              icon={<ShieldCheck className="w-6 h-6" />}
              title={t("step3_title")}
              desc={t("step3_desc")}
            />
            <StepCard
              num="04"
              icon={<CheckCircle2 className="w-6 h-6" />}
              title={t("step4_title")}
              desc={t("step4_desc")}
            />
          </div>
        </div>
      </section>

      {/* ============== المنصة في أرقام ============== */}
      <section className="bg-gray-50 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center text-[var(--navy)] mb-10">
            {t("stats_title")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <StatCard value="1,247" label={t("stat_active")} />
            <StatCard value="892" label={t("stat_sale")} />
            <StatCard value="355" label={t("stat_rent")} />
          </div>
        </div>
      </section>

      {/* ============== آراء المستخدمين ============== */}
      <section className="bg-white py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Star className="w-6 h-6 md:w-7 md:h-7 text-[var(--gold)] fill-[var(--gold)]" />
            <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--navy)]">
              {t("reviews_title")}
            </h2>
          </div>
          <p className="text-center text-sm md:text-base text-muted-foreground mb-10">
            {t("reviews_subtitle")}
          </p>

          {/* Empty state */}
          <div className="text-center py-12 px-6 rounded-2xl border-2 border-dashed border-border bg-muted/30 max-w-xl mx-auto">
            <Star className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground text-base">
              {t("reviews_empty")}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function PainPoint({
  icon,
  iconColor,
  title,
  desc,
}: {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-4">
        <div className={`${iconColor}`}>{icon}</div>
      </div>
      <h3 className="text-lg md:text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-sm md:text-base text-white/70 font-light">{desc}</p>
    </div>
  );
}

function StepCard({
  num,
  icon,
  title,
  desc,
}: {
  num: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-6 relative border border-border/50 hover:border-[var(--gold)]/40 transition-colors">
      {/* رقم في الزاوية */}
      <div className="absolute -top-3 end-4 w-10 h-10 rounded-full bg-[var(--gold)] text-[var(--navy)] flex items-center justify-center font-extrabold text-sm shadow-md">
        {num}
      </div>
      {/* أيقونة */}
      <div className="text-[var(--navy)] mb-3 mt-3">{icon}</div>
      <h3 className="font-bold text-base md:text-lg text-[var(--navy)] mb-2">
        {title}
      </h3>
      <p className="text-xs md:text-sm text-muted-foreground font-light leading-relaxed">
        {desc}
      </p>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white rounded-xl p-8 text-center border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-center gap-2 mb-2">
        <TrendingUp className="w-5 h-5 text-[var(--gold)]" />
        <div className="text-4xl md:text-5xl font-extrabold text-[var(--navy)]">
          {value}
        </div>
      </div>
      <div className="text-sm md:text-base text-muted-foreground font-light">
        {label}
      </div>
    </div>
  );
}
