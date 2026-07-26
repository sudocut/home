import { defineRouting } from "next-intl/routing";
import { DEFAULT_LOCALE, LOCALES } from "./config";

// This is a public company site, not the logged-in product app, so the locale
// lives in the URL rather than in a cookie: /ko/about and /en/about are two
// addressable, indexable, shareable pages. (sudocut/web does the opposite —
// cookie-based, no prefix — because it is an app behind a login.)
//
// localePrefix "always" means /ko is never elided. There is no middleware.ts in
// this repo, so the bare "/" is redirected to "/ko" by next.config.ts instead.
// Trade-off: no Accept-Language negotiation. Every visitor lands on Korean and
// switches explicitly from the nav. That is the correct default for this brand.
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always",
});
