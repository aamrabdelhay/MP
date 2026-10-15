"use client";

import { Languages } from "lucide-react";
import { useLanguage } from "@/app/providers";

export function LanguageSwitcher() {
  const { language, t, toggleLanguage } = useLanguage();

  return (
    <button
      className="language-switcher"
      type="button"
      onClick={toggleLanguage}
      aria-label={language === "ar" ? "Switch language to English" : "تغيير اللغة إلى العربية"}
      title={language === "ar" ? "Switch to English" : "التغيير إلى العربية"}
    >
      <Languages aria-hidden="true" size={16} strokeWidth={1.8} />
      <span>{t.languageButton}</span>
    </button>
  );
}
