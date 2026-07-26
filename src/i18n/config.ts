// Korean is the default. soul.md: "Korean-first is our home, English in parallel."
// This is the one place the locale list is declared; routing.ts derives from it.
export const LOCALES = ["ko", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ko";

export function isLocale(value: string | undefined): value is Locale {
  return LOCALES.includes(value as Locale);
}
