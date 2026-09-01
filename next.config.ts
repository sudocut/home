import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  typedRoutes: true,
  // The root layout lives under [locale], so an unmatched path has no layout to
  // render a not-found inside and Next serves an unstyled, empty-bodied error
  // shell. app/global-not-found.tsx fixes that, and needs this flag. Verified
  // working on 16.2.10: /zz and /ko/zzz both return real 404 HTML.
  experimental: { globalNotFound: true },
  // The Logo component inlines the SVGs from brand/logo/ at render time so that
  // var(--sc-*) and the self-hosted Jost face actually resolve (an <img>-embedded
  // SVG is an isolated document and gets neither). Every route here is statically
  // prerendered, so the read happens at build time — but trace the files anyway so
  // a future dynamic route cannot 500 on a missing asset.
  // content/{help,legal}/**.md is read by src/content/docs.ts. Same reasoning as
  // the logos: every document route is statically prerendered so the reads happen
  // at build time, but trace the files so a future dynamic route cannot 500.
  outputFileTracingIncludes: {
    "/**": ["./brand/logo/*.svg", "./content/help/**/*.md", "./content/legal/**/*.md"],
  },
  async redirects() {
    return [
      // English is the default locale (constitution D5, founder 2026-07-26).
      // localePrefix is "always", so the bare root has to land somewhere explicit.
      // Done here rather than in middleware.ts — see src/i18n/routing.ts.
      { source: "/", destination: "/en", permanent: false },
      // The unprefixed legal URLs resolve too. Both are typed into forms we do
      // not control — the Google OAuth consent screen takes one as "Application
      // privacy policy link" — and whoever pastes them will drop the locale
      // segment. A 404 there is a rejected verification, so redirect instead.
      { source: "/terms", destination: "/en/terms", permanent: false },
      { source: "/privacy", destination: "/en/privacy", permanent: false },
    ];
  },
};

export default withNextIntl(nextConfig);
