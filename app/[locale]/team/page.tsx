import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

type LocaleParams = { locale: string };

const RULES = ["one", "two", "three", "four"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getTranslations({ locale, namespace: "meta" });
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: meta("titleTemplate", { page: t("team") }) };
}

/**
 * /team — r4 winner (kimi-k3-a). Four decision rules, then a dashed placeholder
 * where the roster will go.
 *
 * THE ROSTER IS DELIBERATELY UNPUBLISHED. The founder data exists, but the source
 * marks one title "needs founder confirmation" and carries birth years and
 * personal social links, while business/README.md says keep personal data out of
 * git. Publishing a named real person is a consent decision, not a copy task.
 * Do not fill this in from any source other than the founders saying so.
 */
export default async function TeamPage({ params }: { params: Promise<LocaleParams> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("team");

  return (
    <div className="sc-wrap">
      <section className="sc-page-head">
        <p className="sc-kicker">{t("kicker")}</p>
        <h1>{t("title")}</h1>
        <p className="sc-lede">{t("lede")}</p>
      </section>

      <section aria-label={t("rulesLabel")} className="sc-numbered">
        {RULES.map((rule) => (
          <div className="sc-numbered-item" key={rule}>
            <p className="sc-numbered-no">{t(`rules.${rule}.no`)}</p>
            <div>
              <h2>{t(`rules.${rule}.title`)}</h2>
              <p>{t(`rules.${rule}.copy`)}</p>
            </div>
          </div>
        ))}
      </section>

      {/* A <section> rather than the variant's bare <div>: aria-label needs a
          role to attach to, and on a plain div a screen reader drops it. */}
      <section aria-label={t("roster.label")} className="sc-roster">
        <p className="sc-roster-slot">{t("roster.slot")}</p>
        <p className="sc-roster-why">{t("roster.why")}</p>
      </section>
    </div>
  );
}
