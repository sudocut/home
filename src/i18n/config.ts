// English is the default, Korean second — founder ruling 2026-07-26,
// constitution D5. NOTE: this REVERSES soul.md, which says "Korean-first is our
// home, English in parallel". The founder outranks it, but soul.md lives in
// sudocut/meta and still says the opposite; the gap is tracked in
// docs/open-questions.md. This is the one place the locale list is declared.
export const LOCALES = ["en", "ko"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string | undefined): value is Locale {
  return LOCALES.includes(value as Locale);
}
