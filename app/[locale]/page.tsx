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
 * Front page — r5 variant A/B.
 *
 * The layout is the argument. Two screens side by side, one rule between them,
 * labelled `Human edit` and `SudoCut edit` — and they are identical, because
 * that is the claim. A visitor gets the point before reading a word.
 *
 * BOTH PANELS SCREEN THE SAME FILE, DELIBERATELY, AND THE PAGE SAYS SO.
 * Two different abstract frames would have implied the two edits look different,
 * which is a claim nobody made and nobody measured. And a still from either real
 * edit is a partner channel's to grant, not ours to publish. So it is one screen
 * twice, with a line under it explaining exactly that — the honesty is on the
 * page rather than in this comment, because the visitor is the one who needs it.
 *
 * The A/B proof card from r4 is gone. It argued for this in prose; the layout
 * argues for it in geometry, and keeping both would have been saying it twice.
 */
export default async function HomePage({ params }: { params: Promise<LocaleParams> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <>
      <div className="sc-wrap">
        <section className="sc-ab">
          <p className="sc-kicker sc-kicker--rule">{t("kicker")}</p>
          <h1 className="sc-ab-head">{t("title")}</h1>

          <div className="sc-ab-pair">
            {(["human", "ai"] as const).map((side) => (
              <figure className="sc-ab-cell" key={side}>
                <Halftone className="sc-ab-art" pitch={16} src="/frames/frame-hero.png" />
                <figcaption className="sc-ab-cap">
                  <span className="sc-ab-tag">{t(`ab.${side}`)}</span>
                  <span className="sc-ab-mark">{side === "human" ? "A" : "B"}</span>
                </figcaption>
              </figure>
            ))}
          </div>

          <p className="sc-ab-note">{t("ab.note")}</p>
          <p className="sc-qualifier">{t("qualifier")}</p>
          {/* The one cobalt object on this page. */}
          <WaitlistCta />
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
