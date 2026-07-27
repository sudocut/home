import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

type LocaleParams = { locale: string };

const PEOPLE = ["jonghyun", "jiho"] as const;
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
 * /team — r4 winner (kimi-k3-a). The two founders, then the four decision rules.
 *
 * The roster was a stub through r2–r4 on purpose: publishing a named real person
 * is a consent decision, not a copy task. The founders ruled on 2026-07-27 to
 * publish themselves, and this page carries exactly that — their own names,
 * roles, and what they build. No birth years, no personal social links, and no
 * one who has not asked to be here. business/README.md still applies.
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

      {/* The roster was a deliberate stub through r2–r4 because publishing a
          named real person is a consent decision. The founders ruled on
          2026-07-27 to publish themselves, so this is theirs and only theirs —
          no birth years, no personal social links, and no third parties. */}
      <section aria-label={t("peopleLabel")} className="sc-people">
        {PEOPLE.map((person) => (
          <article className="sc-person" key={person}>
            <h2>{t(`people.${person}.name`)}</h2>
            <p className="sc-person-role">{t(`people.${person}.role`)}</p>
            <p className="sc-person-copy">{t(`people.${person}.copy`)}</p>
          </article>
        ))}
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

      <p className="sc-team-note">{t("note")}</p>
    </div>
  );
}
