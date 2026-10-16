import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CREATOR_APPLICATION_URL } from "@/content/creator-application";

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

/** Creator applications and general support use separate contact paths. */
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

      <p className="sc-more">
        <a href={CREATOR_APPLICATION_URL} rel="noopener noreferrer" target="_blank">
          {t("apply")}
        </a>
      </p>
    </div>
  );
}
