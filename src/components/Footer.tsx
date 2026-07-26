import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "./Logo";

const LINKS = [
  { key: "home", href: "/" },
  { key: "about", href: "/about" },
  { key: "team", href: "/team" },
  { key: "pricing", href: "/pricing" },
  { key: "contact", href: "/contact" },
] as const;

/**
 * Site footer. Monochrome — the page has already spent its one cobalt object on
 * the ActionButton, so the mark here is the single-ink lockup.
 */
export function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");
  const year = String(new Date().getFullYear());

  return (
    <footer className="w-full">
      <hr />
      <div className="mx-auto flex w-full max-w-[var(--sc-measure)] flex-wrap items-end justify-between gap-x-10 gap-y-8 px-6 py-12 md:px-10">
        <div className="flex flex-col gap-4">
          <Logo variant="stacked" tone="mono" className="h-16" />
          <p className="text-[color:var(--sc-content-muted)]">{t("tagline")}</p>
        </div>

        <div className="flex flex-col items-start gap-4">
          <nav aria-label="SudoCut">
            <ul className="flex flex-wrap items-center gap-6">
              {LINKS.map((link) => (
                <li key={link.key}>
                  <Link className="no-underline hover:underline" href={link.href}>
                    {nav(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <p className="sc-label">{t("rights", { year })}</p>
          <p className="sc-label">{t("colophon")}</p>
        </div>
      </div>
    </footer>
  );
}
