import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  getNextLocale,
  LOCALE_STORAGE_KEY,
  resolveLocale,
  type Locale,
} from "@/lib/locale";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";

  try {
    return resolveLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY));
  } catch {
    return "en";
  }
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(getStoredLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // The UI still works when storage is blocked by browser privacy settings.
    }
  }, [locale]);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale,
    toggleLocale: () => setLocale((current) => getNextLocale(current)),
  }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used inside LocaleProvider");
  }
  return context;
}
