import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChannelTicker } from "@/components/ChannelTicker";
import { Halftone } from "@/components/Halftone";
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
 * Front page — r5 variant STAMP.
 *
 * One screened disc, printed on the sheet like a proof stamp, with the claim set
 * beside it. A 20px cell pitch, and the only circle the system permits: W4 bans
 * rounded corners but explicitly excepts `50%`, so a disc is inside the rules
 * where a rounded rectangle would not be.
 *
 * The reason to try it: every other variant in this round is rectangles inside
 * rectangles, which is the house grammar and also its rut. A single round object
 * is the one shape available that reads as a mark rather than as another panel,
 * and it gives the page a focal point that is not the headline.
 *
 * The reason it might lose: a stamp says *approved*, and what we have is one
 * view count on one channel. The caption under the disc has to carry the whole
 * qualification, and a caption is a weak place to put the honesty.
 */
export default async function HomePage({ params }: { params: Promise<LocaleParams> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <>
      <div className="sc-wrap">
        <section className="sc-stamp">
          <div className="sc-stamp-copy">
            <p className="sc-kicker sc-kicker--rule">{t("kicker")}</p>
            <h1 className="sc-stamp-head">{t("title")}</h1>
            <p className="sc-qualifier">{t("qualifier")}</p>
            {/* The one cobalt object on this page. */}
            <WaitlistCta />
          </div>

          <figure className="sc-stamp-fig">
            <Halftone className="sc-stamp-disc" pitch={20} src="/frames/frame-hero.png" />
            <figcaption className="sc-stamp-cap">
              <span className="sc-stamp-ab">{t("proof.mark")}</span>
              <span className="sc-stamp-tag">{t("proof.tagline")}</span>
            </figcaption>
          </figure>
        </section>
      </div>

      {/* Constitution D8 — the one flowing band on the site. */}
      <ChannelTicker pitch={7} />

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
