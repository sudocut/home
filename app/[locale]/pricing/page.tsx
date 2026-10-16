import type { Metadata } from "next";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { CREATOR_APPLICATION_URL } from "@/content/creator-application";

type LocaleParams = { locale: string };

type Tier = { name: string; price: string; included: string; sub: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getTranslations({ locale, namespace: "meta" });
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: meta("titleTemplate", { page: t("pricing") }) };
}

/** Current support options, with future subscription targets labelled separately. */
export default async function PricingPage({ params }: { params: Promise<LocaleParams> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pricing");

  // Arrays of objects are read straight off the message catalogue: t() returns
  // strings only, and the tier table is data, not copy with placeholders.
  const messages = (await getMessages({ locale })) as unknown as {
    pricing: { launch: { tiers: Tier[] }; now: { topups: { packs: string[] } } };
  };
  const tiers = messages.pricing.launch.tiers;
  const packs = messages.pricing.now.topups.packs;

  return (
    <div className="sc-wrap">
      <section className="sc-page-head sc-page-head--wide">
        <p className="sc-kicker">{t("kicker")}</p>
        <h1>{t("title")}</h1>
        <p className="sc-lede">{t("lede")}</p>
      </section>

      <section aria-label={t("now.label")} className="sc-block">
        <header className="sc-block-head">
          <h2>{t("now.title")}</h2>
          <span className="sc-when">{t("now.when")}</span>
        </header>
        <div className="sc-block-body">
          <ul className="sc-rows">
            <li>
              <span className="sc-k">{t("now.access.key")}</span>
              <span>{t("now.access.value")}</span>
            </li>
            <li>
              <span className="sc-k">{t("now.management.key")}</span>
              <span>{t("now.management.value")}</span>
            </li>
            <li>
              <span className="sc-k">{t("now.topups.key")}</span>
              <span>
                {t("now.topups.before")}
                <span className="sc-numeric">{t("now.topups.rate")}</span>
                {t("now.topups.after")}
                <span className="sc-packs">
                  {packs.map((pack) => (
                    <span key={pack}>{pack}</span>
                  ))}
                </span>
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section aria-label={t("launch.label")} className="sc-block">
        <header className="sc-block-head">
          <h2>{t("launch.title")}</h2>
          <span className="sc-when">{t("launch.when")}</span>
        </header>
        <div className="sc-block-body">
          <div className="sc-tablewrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">{t("launch.columns.tier")}</th>
                  <th scope="col">{t("launch.columns.price")}</th>
                  <th scope="col">{t("launch.columns.included")}</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier) => (
                  <tr key={tier.name}>
                    <td>{tier.name}</td>
                    <td className="sc-price">{tier.price}</td>
                    <td className="sc-included">
                      {tier.included}
                      {tier.sub ? <span className="sc-sub">{tier.sub}</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="sc-caveat">
            {t("launch.overageBefore")}
            <span className="sc-numeric">{t("launch.overageRate")}</span>
            {t("launch.overageAfter")}
          </p>
          <p className="sc-caveat sc-caveat--mono">{t("launch.target")}</p>
        </div>
      </section>

      <p className="sc-foot-note">{t("footNote")}</p>
      <p className="sc-more">
        <a href={CREATOR_APPLICATION_URL} rel="noopener noreferrer" target="_blank">
          {t("apply")}
        </a>
      </p>
    </div>
  );
}
