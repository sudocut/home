import { useLocale, useTranslations } from "next-intl";
import { CREATOR_APPLICATION_URL } from "@/content/creator-application";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LINKS = [
  { key: "about", href: "/about" },
  { key: "team", href: "/team" },
  { key: "pricing", href: "/pricing" },
] as const;

/**
 * Site header — r4 winner (kimi-k3-a). Wordmark left, mono uppercase nav right,
 * one hairline rule underneath.
 *
 * Text-only wordmark, no mark. That is what the ranked variant shipped; the r4
 * verdict lists adopting the mark here as a graft for the NEXT round rather than
 * something to slip in during the port.
 *
 * The application link stays monochrome so the home page keeps one cobalt action.
 */
export function Nav() {
  const t = useTranslations("nav");
  const active = useLocale();

  return (
    <header className="sc-head">
      <div className="sc-wrap">
        <Link className="sc-wordmark" href="/">
          SudoCut
        </Link>

        <nav aria-label="Primary" className="sc-nav">
          {LINKS.map((link) => (
            <Link href={link.href} key={link.key}>
              {t(link.key)}
            </Link>
          ))}
          <a href={CREATOR_APPLICATION_URL} rel="noopener noreferrer" target="_blank">
            {t("apply")}
          </a>

          {/* Locale links point at the other locale's front page rather than the
              equivalent page: there is no middleware.ts here (see
              src/i18n/routing.ts) and a Server Component cannot read the current
              pathname. Fix with middleware, or by making just this a Client
              Component — worth doing once the language question is settled. */}
          {routing.locales
            .filter((locale) => locale !== active)
            .map((locale) => (
              <Link href="/" hrefLang={locale} key={locale} locale={locale}>
                {t(`language.${locale}`)}
              </Link>
            ))}
        </nav>
      </div>
    </header>
  );
}
