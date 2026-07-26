import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Logo } from "./Logo";

const LINKS = [
  { key: "home", href: "/" },
  { key: "about", href: "/about" },
  { key: "contact", href: "/contact" },
] as const;

/**
 * Site header. Structure only — the composition comes from the selected design
 * round under design/.
 *
 * The lockup is single-ink on purpose. Cobalt is spent once per page, on the
 * ActionButton; a cobalt cut line up here would be the second one. See Logo.
 *
 * Locale links point at the other locale's home rather than the equivalent
 * page, because there is no middleware.ts in this repo (see src/i18n/routing.ts)
 * and the current pathname is not readable from a Server Component. Fix by
 * either adding middleware or making just the switcher a Client Component —
 * whichever the selected round wants.
 */
export function Nav() {
  const t = useTranslations("nav");
  const active = useLocale();

  return (
    <header className="w-full">
      <div className="mx-auto flex w-full max-w-[var(--sc-measure)] flex-wrap items-center justify-between gap-x-10 gap-y-5 px-6 py-6 md:px-10">
        <Link href="/" aria-label="SudoCut">
          <Logo variant="horizontal" tone="mono" className="h-7" />
        </Link>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <nav aria-label="SudoCut">
            <ul className="flex items-center gap-6">
              {LINKS.map((link) => (
                <li key={link.key}>
                  <Link className="no-underline hover:underline" href={link.href}>
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t("languageLabel")}>
            <ul className="flex items-center gap-3">
              {routing.locales.map((locale) => (
                <li key={locale}>
                  <Link
                    aria-current={locale === active ? "true" : undefined}
                    className={
                      locale === active
                        ? "sc-label no-underline"
                        : "sc-label text-[color:var(--sc-content)] no-underline hover:underline"
                    }
                    href="/"
                    hrefLang={locale}
                    locale={locale}
                  >
                    {t(`language.${locale}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
      <hr />
    </header>
  );
}
