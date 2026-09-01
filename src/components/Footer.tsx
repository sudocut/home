import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * Site footer — r4 winner (kimi-k3-a): wordmark, tagline, one fine-print line.
 * Monochrome, and no nav — the header already carries every route.
 *
 * DEVIATION FROM THE RANKED VARIANT, deliberate and small: the variant has no
 * /contact page, but this repo does, with real copy. Rather than delete a page
 * or leave it unreachable, it is linked here. If the next round decides the
 * waitlist is the only way in, delete the route and this link together.
 *
 * /help is linked here for the same reason, and deliberately NOT in the header:
 * the r4 winner's nav is a wordmark and three links, and adding a fourth is a
 * change to a ranked decision, not a port detail. Help documents are shared as
 * direct links anyway. Promoting /help into the nav is a round or a founder
 * call — see design/README.md.
 *
 * r6 moved the waitlist's PRIVACY LINE here. The founder asked for less text on
 * the front page and that line is not the important message — but it is a promise
 * about what we do with an address, so it moves rather than goes. Cutting copy is
 * allowed to cost words; it is not allowed to cost a commitment.
 *
 * /terms and /privacy are here for a reason that is not taste: Google's OAuth
 * consent screen records both URLs and requires them to be reachable from the
 * site they name, and a footer is where a visitor looks for them anyway.
 *
 * DEVIATION FROM THE RANKED VARIANT, founder call 2026-09-01: the r4 winner has
 * ONE fine-print line and the links lived at the tail of it, 12px and muted. The
 * founder asked for terms and privacy to be easy to reach, so the four links are
 * their own labelled <nav> at 13px and full contrast, and the copyright drops to
 * a row of its own. The footer still carries a wordmark, a tagline and small
 * type — what changed is which of the two is the quieter one. Four links is the
 * ceiling; a fifth is a round, not another <Link>.
 */
export function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");
  const year = String(new Date().getFullYear());

  return (
    <footer className="sc-foot">
      <div className="sc-wrap">
        <span className="sc-wordmark">SudoCut</span>
        <span className="sc-foot-tag">{t("tagline")}</span>
        <nav aria-label={t("linksLabel")} className="sc-foot-links">
          <Link href="/help">{nav("help")}</Link>
          <Link href="/contact">{nav("contact")}</Link>
          <Link href="/terms">{nav("terms")}</Link>
          <Link href="/privacy">{nav("privacy")}</Link>
        </nav>
        <span className="sc-foot-privacy">{t("privacy")}</span>
        <span className="sc-foot-fine">{t("rights", { year })}</span>
      </div>
    </footer>
  );
}
