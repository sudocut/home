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
 * Front page — r5 variant PRESS.
 *
 * The newspaper front page. Type carries the page and the screen is the picture
 * beside the story, at a 14px cell pitch — coarse enough to read as print from
 * across a room, fine enough to still be a picture (D7).
 *
 * WHAT CHANGED FROM r4, AND WHY
 * The founder's note, 2026-08-18: *"there are too many text so users cannot read
 * important message. The important message is that AI edits the video, and
 * publish, views are same as human edited video."*
 *
 * So the hero is now one claim in three beats — "AI cut it. We published it. Same
 * views." — and the 60-word lede that used to sit under it is a 28-word line that
 * both says what the product does and refuses the overclaim. The A/B proof card,
 * which used to be a separate object arguing for the same thing, is gone: the
 * headline IS the proof, and keeping the card would have been saying it twice.
 *
 * The trust band sits directly under the hero rather than at the foot of the
 * page, because the founder asked for it on landing. That is why this hero is
 * built tight — no 100svh, compact waitlist — the band has to clear the fold.
 */
export default async function HomePage({ params }: { params: Promise<LocaleParams> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <>
      <div className="sc-wrap">
        <section className="sc-press">
          <div>
            <p className="sc-kicker sc-kicker--rule">{t("kicker")}</p>
            <h1 className="sc-press-head">{t("title")}</h1>
            <p className="sc-qualifier">{t("qualifier")}</p>
            {/* The one cobalt object on this page. */}
            <WaitlistCta />
          </div>

          {/* D7. The plate is a foreground object printed on the sheet — the
              sheet itself is still warm paper, the D6 texture and the 76px
              grid, and nothing here replaces them. */}
          <figure className="sc-plate">
            <Halftone className="sc-plate-art" pitch={14} src="/frames/frame-hero.png" />
            <figcaption className="sc-plate-cap">
              <span className="sc-plate-ab">{t("proof.mark")}</span>
              <span className="sc-plate-tag">{t("proof.tagline")}</span>
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
