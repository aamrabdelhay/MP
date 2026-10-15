"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { messages, type AppMessages, type Language } from "@/lib/i18n";

const LANGUAGE_STORAGE_KEY = "capital-university-language";

type LanguageContextValue = {
  language: Language;
  direction: "rtl" | "ltr";
  t: AppMessages;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ar");

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    } catch {
      // Language preference is optional when browser storage is unavailable.
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "ar" ? "en" : "ar");
  }, [language, setLanguage]);

  useEffect(() => {
    try {
      const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage === "ar" || savedLanguage === "en") {
        // Restore after hydration so server and first client render are both Arabic.
        setLanguageState(savedLanguage);
      }
    } catch {
      // Keep Arabic as the default if storage is unavailable.
    }
  }, []);

  useEffect(() => {
    const direction = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    document.body.dataset.language = language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      direction: language === "ar" ? "rtl" : "ltr",
      t: messages[language],
      setLanguage,
      toggleLanguage,
    }),
    [language, setLanguage, toggleLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within Providers.");
  return context;
}
