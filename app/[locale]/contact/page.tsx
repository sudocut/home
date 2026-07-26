import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

type LocaleParams = { locale: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getTranslations({ locale, namespace: "meta" });
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: meta("titleTemplate", { page: t("contact") }) };
}

/**
 * /contact — NOT part of the r4 winning variant, which has no contact page. Kept
 * because the route and its copy already existed, rebuilt in the winner's system
 * so it does not look like a page from a different site, and linked only from the
 * footer. If the next round decides the waitlist is the only way in, delete this
 * route, its messages, and the footer link together.
 *
 * No cobalt: the waitlist on the front page is where the accent is spent.
 */
export default async function ContactPage({ params }: { params: Promise<LocaleParams> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");
  const email = t("email");

  return (
    <div className="sc-wrap">
      <section className="sc-page-head">
        <p className="sc-kicker">{t("kicker")}</p>
        <h1>{t("title")}</h1>
        <p className="sc-lede">{t("lede")}</p>
      </section>

      <div className="sc-numbered">
        <div className="sc-numbered-item">
          <p className="sc-label">{t("emailLabel")}</p>
          <div>
            <p className="sc-proof-claim">
              <a href={`mailto:${email}`}>{email}</a>
            </p>
            {/* honesty over polish — this address is our assumption, not a
                confirmed one. See brand/BRAND-KIT.md "Domain and contact". */}
            <p className="sc-wait-note">{t("note")}</p>
          </div>
        </div>
      </div>

      <div className="sc-more" />
    </div>
  );
}
