"use client";

import { useLang } from "./LanguageContext";
import { useAuth } from "./AuthContext";
import { PlatformButton } from "./PlatformButton";
import {
  User,
  LayoutDashboard,
  Bell,
  Building2,
  Star,
  LogOut,
  Settings,
  Shield,
  Search,
} from "lucide-react";

export function AccountPage({
  onGoToLogin,
  onGoToPublish,
  onGoToSearch,
}: {
  onGoToLogin: () => void;
  onGoToPublish: () => void;
  onGoToSearch: () => void;
}) {
  const { t } = useLang();
  const { user, signOut } = useAuth();

  // إذا كان المستخدم مسجّل الدخول، اعرض بياناته
  if (user) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* رأس الملف الشخصي */}
          <div className="bg-[var(--navy)] px-6 md:px-8 py-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[var(--gold)] flex items-center justify-center text-2xl font-extrabold text-[var(--navy)]">
                {user.fullName.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold mb-1">
                  {user.fullName}
                </h1>
                <p className="text-sm text-white/70" dir="ltr">
                  {user.email}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--gold)] text-[var(--navy)] text-xs font-bold">
                    <Shield className="w-3 h-3" />
                    {user.role === "owner"
                      ? t("account_role_owner")
                      : t("account_role_seeker")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* الإجراءات حسب الدور */}
          <div className="p-6 md:p-8">
            <p className="text-sm text-muted-foreground mb-4">
              {t("account_logged_in_as")}{" "}
              <span className="font-bold text-foreground">
                {user.role === "owner"
                  ? t("account_role_owner")
                  : t("account_role_seeker")}
              </span>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {user.role === "owner" ? (
                <ActionCard
                  icon={<Building2 className="w-5 h-5" />}
                  label={t("account_my_properties")}
                  description={t("publish_title")}
                  onClick={onGoToPublish}
                  variant="gold"
                />
              ) : (
                <ActionCard
                  icon={<Search className="w-5 h-5" />}
                  label={t("search_title")}
                  description={t("search_subtitle")}
                  onClick={onGoToSearch}
                  variant="gold"
                />
              )}
              <ActionCard
                icon={<Bell className="w-5 h-5" />}
                label={t("account_notifications")}
                description="0 إشعار جديد"
                onClick={() => {}}
              />
              <ActionCard
                icon={<Settings className="w-5 h-5" />}
                label={t("account_settings")}
                description="إدارة الحساب والخصوصية"
                onClick={() => {}}
              />
              <ActionCard
                icon={<LogOut className="w-5 h-5" />}
                label={t("account_logout")}
                description="إنهاء الجلسة الحالية"
                onClick={signOut}
                variant="danger"
              />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // إذا لم يكن مسجّل الدخول، اعرض شاشة الدعوة
  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div className="bg-white rounded-2xl border border-border shadow-sm p-8 md:p-12 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[var(--gold)]/10 flex items-center justify-center">
            <User className="w-8 h-8 text-[var(--gold)]" />
          </div>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--navy)] mb-3">
          {t("account_title")}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mb-8 max-w-md mx-auto">
          {t("account_login_prompt")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <PlatformButton variant="gold" onClick={onGoToLogin}>
            {t("login_btn")}
          </PlatformButton>
          <PlatformButton variant="navy" onClick={onGoToLogin}>
            {t("signup_btn")}
          </PlatformButton>
        </div>
      </div>
    </main>
  );
}

export function DashboardPage() {
  const { t } = useLang();
  const { user } = useAuth();

  if (!user) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--navy)] mb-1">
            {t("dashboard_title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("dashboard_login_prompt")}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-dashed border-border p-8 md:p-12 text-center">
          <LayoutDashboard className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">{t("dashboard_login_prompt")}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--navy)] mb-1">
          {t("dashboard_title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("account_logged_in_as")}{" "}
          <span className="font-bold text-foreground">
            {user.role === "owner"
              ? t("account_role_owner")
              : t("account_role_seeker")}
          </span>
        </p>
      </div>

      {/* بطاقات إحصائية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <DashStat
          icon={<Building2 className="w-5 h-5" />}
          label={
            user.role === "owner"
              ? t("account_my_properties")
              : t("matched_properties")
          }
          value="0"
        />
        <DashStat
          icon={<Bell className="w-5 h-5" />}
          label={t("account_notifications")}
          value="0"
        />
        <DashStat
          icon={<Star className="w-5 h-5" />}
          label={t("reviews_title")}
          value="0"
        />
      </div>

      {/* Empty state */}
      <div className="bg-white rounded-2xl border border-dashed border-border p-8 md:p-12 text-center">
        <LayoutDashboard className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
        <p className="text-muted-foreground">
          {user.role === "owner"
            ? "أهلًا بك في لوحة المالك. ابدأ بنشر عقارك الأول."
            : "أهلًا بك في لوحة الباحث. ابدأ بتحديد معايير بحثك."}
        </p>
      </div>
    </main>
  );
}

function ActionCard({
  icon,
  label,
  description,
  onClick,
  variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  variant?: "default" | "gold" | "danger";
}) {
  const styles = {
    default: "border-border hover:border-[var(--gold)]/50",
    gold: "border-[var(--gold)]/40 bg-[var(--gold)]/5 hover:bg-[var(--gold)]/10",
    danger:
      "border-red-200 bg-red-50 hover:bg-red-100 text-red-700",
  }[variant];

  return (
    <button
      onClick={onClick}
      className={`flex items-start gap-3 p-4 rounded-xl border-2 text-start transition-all ${styles}`}
    >
      <div
        className={
          variant === "danger"
            ? "text-red-600"
            : variant === "gold"
            ? "text-[var(--gold)]"
            : "text-[var(--navy)]"
        }
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-bold text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
      </div>
    </button>
  );
}

function DashStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-border shadow-sm p-5">
      <div className="flex items-center gap-2 text-[var(--gold)] mb-2">{icon}</div>
      <div className="text-3xl font-extrabold text-[var(--navy)] mb-1">
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
