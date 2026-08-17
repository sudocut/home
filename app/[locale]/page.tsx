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
 * Front page — r5 variant BANDS.
 *
 * Aggressive by repetition rather than by scale. Three full-bleed screened bands
 * at three different pitches — 26px, then the trust band's 7px, then 11px —
 * separated by strips of bare paper, with the content knocked out on paper
 * plates. The page reads as a printed sheet run through the press three times.
 *
 * WHY IT IS NOT ONE FULL-PAGE SCREEN. That is banned, and by the same rule that
 * lets the rest of this exist: D7 admits `halftone-dots` as a FOREGROUND object
 * and leaves the page's own background field to warm paper, the D6 texture and
 * the 76px grid. Bands are how you get an all-over effect without taking the
 * sheet away — every band still sits on the paper, and the paper still shows
 * between them.
 *
 * Varying the pitch band to band is the point rather than decoration: it is what
 * stops three screens of the same abstract frame reading as one repeated tile.
 */
export default async function HomePage({ params }: { params: Promise<LocaleParams> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <>
      <section className="sc-band sc-band--hero">
        <Halftone className="sc-band-art" pitch={26} src="/frames/frame-hero.png" />
        <div className="sc-wrap">
          <div className="sc-band-box">
            <p className="sc-kicker">{t("kicker")}</p>
            <h1 className="sc-band-head">{t("title")}</h1>
            <p className="sc-qualifier">{t("qualifier")}</p>
            {/* The one cobalt object on this page. */}
            <WaitlistCta />
          </div>
        </div>
      </section>

      {/* Constitution D8 — the one flowing band on the site, and the middle of
          the three screened bands. */}
      <ChannelTicker pitch={7} />

      <section aria-label={t("split.label")} className="sc-band sc-band--figures">
        <Halftone className="sc-band-art" pitch={11} src="/frames/frame-06.png" />
        <div className="sc-wrap">
          <div className="sc-band-box sc-band-box--split">
            {(["chore", "story"] as const).map((cell) => (
              <div key={cell}>
                <p className="sc-num">{t(`split.${cell}.value`)}</p>
                <p className="sc-split-label">{t(`split.${cell}.label`)}</p>
                <p className="sc-split-copy">{t(`split.${cell}.copy`)}</p>
              </div>
            ))}
          </div>
        </div>
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
