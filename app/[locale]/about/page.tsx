import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type LocaleParams = { locale: string };

const BELIEFS = ["one", "two", "three"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getTranslations({ locale, namespace: "meta" });
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: meta("titleTemplate", { page: t("about") }) };
}

/**
 * /about — r4 winner (kimi-k3-a). Three numbered beliefs, then the blind A/B
 * result stated in full.
 *
 * NO cobalt on this page. The ranked variant spends the point colour only on the
 * front page's waitlist button; the link at the foot is an underlined mono link,
 * not a button. Do not promote it.
 */
export default async function AboutPage({ params }: { params: Promise<LocaleParams> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  return (
    <div className="sc-wrap">
      <section className="sc-page-head">
        <p className="sc-kicker">{t("kicker")}</p>
        <h1>{t("title")}</h1>
        <p className="sc-lede">
          {t("ledeBefore")}
          <span style={{ fontFamily: "var(--sc-mono)" }}>{t("ledeMono")}</span>
          {t("ledeAfter")}
        </p>
      </section>

      <section aria-label={t("beliefsLabel")} className="sc-numbered">
        {BELIEFS.map((belief) => (
          <div className="sc-numbered-item" key={belief}>
            <p className="sc-numbered-no">{t(`beliefs.${belief}.no`)}</p>
            <div>
              <h2>{t(`beliefs.${belief}.title`)}</h2>
              <p>{t(`beliefs.${belief}.copy`)}</p>
            </div>
          </div>
        ))}
      </section>

      <aside aria-label={t("proof.label")} className="sc-proof sc-proof--full">
        <p className="sc-proof-ab">{t("proof.mark")}</p>
        <p className="sc-proof-claim">{t("proof.claim")}</p>
        <p className="sc-proof-detail">{t("proof.detail")}</p>
        <p className="sc-proof-tagline">{t("proof.tagline")}</p>
      </aside>

      <p className="sc-more">
        <Link href={{ pathname: "/", hash: "waitlist" }}>{t("more")}</Link>
      </p>
    </div>
  );
}
