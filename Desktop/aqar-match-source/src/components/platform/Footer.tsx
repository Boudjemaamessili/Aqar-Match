"use client";

import { useLang } from "./LanguageContext";

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="bg-[var(--navy)] text-white/80 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex items-baseline justify-center gap-1 text-xl font-extrabold mb-2">
          <span className="text-white">{t("brand_aqar")}</span>
          <span className="text-[var(--gold)]">{t("brand_match")}</span>
        </div>
        <p className="text-sm text-white/70">{t("footer_text")}</p>
      </div>
    </footer>
  );
}
