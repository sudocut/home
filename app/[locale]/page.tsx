import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChannelTicker } from "@/components/ChannelTicker";
import { WaitlistCta } from "@/components/WaitlistCta";

type LocaleParams = { locale: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getTranslations({ locale, namespace: "meta" });
  return { title: meta("title"), description: meta("description") };
}

/**
 * Front page — r5 variant TICKER.
 *
 * The only variant that answers *"it should be shown to users at once they
 * landed"* by putting the trust band FIRST — above the headline, directly under
 * the masthead, at full tile size. Nothing about the fold can go wrong, because
 * the band is not below it.
 *
 * The trade is real and it is the reason this is one of six rather than the
 * answer: it spends the most valuable strip on the page on proof-by-association
 * instead of on the claim. Five channel names carry a stranger only if the
 * stranger already knows what the names are. On a Korean-first launch three of
 * them will land; on an English one, possibly none. So this variant is a bet
 * that recognition beats explanation, and the founder is better placed to price
 * that bet than a stylesheet is.
 *
 * The screens are the largest of any variant, at a 12px pitch, because here they
 * are the first thing seen rather than a strip at the bottom.
 */
export default async function HomePage({ params }: { params: Promise<LocaleParams> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <>
      {/* Constitution D8 — the one flowing band on the site, and in this variant
          the first thing on the page. */}
      <ChannelTicker pitch={12} />

      <div className="sc-wrap">
        <section className="sc-tk">
          <div>
            <p className="sc-kicker sc-kicker--rule">{t("kicker")}</p>
            <h1 className="sc-tk-head">{t("title")}</h1>
            <p className="sc-qualifier">{t("qualifier")}</p>
          </div>

          <div className="sc-tk-side">
            {/* The one cobalt object on this page. */}
            <WaitlistCta />
          </div>
        </section>
      </div>

      <section aria-label={t("split.label")} className="sc-split">
        {(["chore", "story"] as const).map((cell) => (
          <div className="sc-split-cell" key={cell}>
            <p className="sc-num">{t(`split.${cell}.value`)}</p>
            <p className="sc-split-label">{t(`split.${cell}.label`)}</p>
            <p className="sc-split-copy">{t(`split.${cell}.copy`)}</p>
          </div>
        ))}
      </section>

      <div className="sc-wrap">
        <p className="sc-example">
          {t("deliverable.before")}
          <span className="sc-numeric">{t("deliverable.figure")}</span>
          {t("deliverable.after")}
        </p>
      </div>
    </>
  );
}
