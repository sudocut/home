import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";

type LocaleParams = { locale: string };

const PEOPLE = ["jonghyun", "jiho"] as const;
const RULES = ["one", "two", "three", "four"] as const;
const PERSON_PHOTOS: Partial<Record<(typeof PEOPLE)[number], string>> = {
  jonghyun: "/team/jonghyunpark-cutout.webp",
  jiho: "/team/jihoyang-cutout.webp",
};

/**
 * Each founder decides what of theirs is published here. Jong Hyun added his own
 * on 2026-08-18; Jiho has none listed because he has not asked for any. Never add
 * a link on someone else's behalf.
 */
const PERSON_LINKS: Partial<Record<(typeof PEOPLE)[number], { key: string; href: string }[]>> = {
  jonghyun: [
    { key: "linkedin", href: "https://www.linkedin.com/in/jonhpark7966/" },
    { key: "site", href: "https://sudormrf.run/jong-hyun-park/" },
    { key: "email", href: "mailto:jhpark@sudo-cut.com" },
  ],
};

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
 * roles, and what they build. Jong Hyun added his own links on 2026-08-18, which
 * narrows the earlier "no personal social links" to "none but your own": a link
 * goes up because the person it belongs to asked for it. No birth years, and no
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
        {PEOPLE.map((person) => {
          const photo = PERSON_PHOTOS[person];
          const links = PERSON_LINKS[person];
          return (
            <article
              className={photo ? "sc-person sc-person--with-photo" : "sc-person"}
              key={person}
            >
              <div
                className={photo ? "sc-person-head sc-person-head--with-photo" : "sc-person-head"}
              >
                {photo ? (
                  <figure className="sc-person-photo-frame" aria-hidden="true">
                    <Image
                      className="sc-person-photo"
                      src={photo}
                      width={512}
                      height={512}
                      alt=""
                      sizes="72px"
                    />
                  </figure>
                ) : null}
                <div className="sc-person-title">
                  <h2>{t(`people.${person}.name`)}</h2>
                  <p className="sc-person-role">{t(`people.${person}.role`)}</p>
                </div>
              </div>
              <div className="sc-person-body">
                <p className="sc-person-copy">{t(`people.${person}.copy`)}</p>
                {links ? (
                  <ul
                    aria-label={t("linksLabel", { name: t(`people.${person}.name`) })}
                    className="sc-person-links"
                  >
                    {links.map((link) => (
                      <li key={link.key}>
                        <a
                          href={link.href}
                          {...(link.href.startsWith("mailto:")
                            ? {}
                            : { rel: "noopener noreferrer", target: "_blank" })}
                        >
                          {t(`links.${link.key}`)}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </article>
          );
        })}
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
