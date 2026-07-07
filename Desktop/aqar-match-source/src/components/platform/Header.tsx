"use client";

import { useState } from "react";
import { Menu, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useLang } from "./LanguageContext";
import { cn } from "@/lib/utils";

export type NavKey =
  | "home"
  | "publish"
  | "search"
  | "account"
  | "dashboard";

const NAV_KEYS: NavKey[] = [
  "home",
  "publish",
  "search",
  "account",
  "dashboard",
];

export function Header({
  current,
  onNavigate,
}: {
  current: NavKey;
  onNavigate: (key: NavKey) => void;
}) {
  const { t, lang, toggle } = useLang();
  const [mobileOpen, setMobileOpen] = useState(false);

  const labelFor = (k: NavKey) => {
    switch (k) {
      case "home":
        return t("nav_home");
      case "publish":
        return t("nav_publish");
      case "search":
        return t("nav_search");
      case "account":
        return t("nav_account");
      case "dashboard":
        return t("nav_dashboard");
    }
  };

  const handleClick = (k: NavKey) => {
    onNavigate(k);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[var(--navy)] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* الشعار */}
          <button
            onClick={() => handleClick("home")}
            className="flex items-baseline gap-1 text-2xl md:text-3xl font-extrabold tracking-tight hover:opacity-90 transition"
            aria-label="Aqar Match home"
          >
            <span className="text-white">{t("brand_aqar")}</span>
            <span className="text-[var(--gold)]">{t("brand_match")}</span>
          </button>

          {/* روابط التنقل - Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_KEYS.map((k) => (
              <button
                key={k}
                onClick={() => handleClick(k)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  current === k
                    ? "bg-[var(--gold)] text-[var(--navy)] font-bold"
                    : "text-white/90 hover:bg-white/10 hover:text-white"
                )}
              >
                {labelFor(k)}
              </button>
            ))}
          </nav>

          {/* اللغة + قائمة الجوال */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggle}
              className="text-white hover:bg-white/10 hover:text-[var(--gold)] gap-1.5"
              aria-label="Toggle language"
            >
              <Globe className="w-4 h-4" />
              <span className="font-bold text-sm">
                {lang === "ar" ? "FR" : "ع"}
              </span>
            </Button>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-white hover:bg-white/10"
                  aria-label="Open menu"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side={lang === "ar" ? "right" : "left"}
                className="bg-[var(--navy)] text-white border-none w-72"
              >
                <div className="flex items-center justify-between mb-8 mt-4">
                  <div className="flex items-baseline gap-1 text-2xl font-extrabold">
                    <span className="text-white">{t("brand_aqar")}</span>
                    <span className="text-[var(--gold)]">
                      {t("brand_match")}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileOpen(false)}
                    className="text-white hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <nav className="flex flex-col gap-2">
                  {NAV_KEYS.map((k) => (
                    <button
                      key={k}
                      onClick={() => handleClick(k)}
                      className={cn(
                        "px-4 py-3 rounded-lg text-base font-medium transition-colors text-start",
                        current === k
                          ? "bg-[var(--gold)] text-[var(--navy)] font-bold"
                          : "text-white/90 hover:bg-white/10"
                      )}
                    >
                      {labelFor(k)}
                    </button>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
