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
 * r6 moved the waitlist's PRIVACY LINE here. The founder asked for less text on
 * the front page and that line is not the important message — but it is a promise
 * about what we do with an address, so it moves rather than goes. Cutting copy is
 * allowed to cost words; it is not allowed to cost a commitment.
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
        <span className="sc-foot-fine">
          {t("rights", { year })} · <Link href="/contact">{nav("contact")}</Link>
        </span>
        <span className="sc-foot-privacy">{t("privacy")}</span>
      </div>
    </footer>
  );
}
