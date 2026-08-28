export const LOCALE_STORAGE_KEY = "photoai.locale";

export type Locale = "en" | "ru";

export function resolveLocale(value: string | null | undefined): Locale {
  return value === "ru" ? "ru" : "en";
}

export function getNextLocale(locale: Locale): Locale {
  return locale === "en" ? "ru" : "en";
}
