import { useTranslations } from "next-intl";

/**
 * The closed-beta waitlist — and the single cobalt object on the whole site.
 * Nothing else may use --sc-action while this is on the page.
 *
 * This links out to a Google Form rather than collecting inline. Founder's call,
 * 2026-07-27, on the grounds of setup effort — and it is genuinely the cheapest
 * option: make the form, paste the URL, done. (Posting to a Form's
 * /formResponse endpoint from our own fields would have kept the inline UI, but
 * it needs the entry.NNNN field IDs dug out of the form's HTML source, and that
 * endpoint answers 200 even for submissions it discards. More work AND less
 * certainty.)
 *
 * The trade is real and worth remembering if signups look thin: an inline field
 * converts better than a link that leaves the site. The r4 variant collected
 * inline. Revisit in r5.
 *
 * What this buys, besides the setup time: Google renders the confirmation, so
 * the site never claims a submission it did not store. There is no way for this
 * to lie. It is also a plain <a> — no client JavaScript, no server action, so
 * every route stays fully static.
 *
 * The live form is committed rather than left to environment configuration. It
 * is a link visitors click, so there is nothing to protect, and a required
 * variable would mean the site could deploy in a state where the one action on
 * the page goes nowhere. NEXT_PUBLIC_WAITLIST_FORM_URL still overrides it, which
 * is what preview deployments and a future Korean-language form would use.
 *
 * Verified 2026-07-27: resolves to
 * docs.google.com/forms/d/e/1FAIpQLScdxjm0nH…/viewform, title "Waitlist".
 */
const FORM_URL = "https://forms.gle/ee5EnjcggaMHRHGF8";

export function WaitlistCta() {
  const t = useTranslations("waitlist");
  const contact = useTranslations("contact");

  const override = process.env.NEXT_PUBLIC_WAITLIST_FORM_URL;
  const form = override?.startsWith("https://") ? override : FORM_URL;
  const email = contact("email");
  // Belt and braces: if FORM_URL is ever emptied, fall back to the support
  // address rather than rendering a dead button.
  const href = form || `mailto:${email}`;

  return (
    <div className="sc-wait" id="waitlist">
      <p className="sc-wait-label">{t("label")}</p>
      <p className="sc-wait-ask">{t("ask")}</p>

      <div className="sc-wait-row">
        {/* The one cobalt object. Do not add a second anywhere in this view. */}
        <a
          className="sc-btn"
          href={href}
          rel="noopener noreferrer"
          target={href.startsWith("http") ? "_blank" : undefined}
        >
          {t("submit")}
        </a>
      </div>

      <p className="sc-wait-note">{t("note")}</p>
      <p className="sc-wait-note">{t("privacy")}</p>
    </div>
  );
}
