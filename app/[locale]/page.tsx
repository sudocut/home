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
 * Front page — r5 variant BILLBOARD.
 *
 * The most literal reading of the founder's brief: use the halftone
 * aggressively. The screen is the entire hero, full bleed, at a 28px cell pitch —
 * near the top of D7's 6–32px band, and dots you can count from across a room.
 *
 * The claim is knocked out of it on a plate of warm paper with a hard 14px
 * offset shadow, so the one thing that has to be read is the one thing not made
 * of dots. That contrast is the whole idea: everything is texture except the
 * sentence.
 *
 * WHAT THIS COSTS, STATED PLAINLY. A field of ink this large is the closest any
 * of the six variants comes to r2's rejected failure — a dark rectangle reading
 * as a foreign object on a warm sheet. It measures inside the band (coverage
 * ~0.35 at this pitch, D7), but "inside the band" and "right for a landing page"
 * are different questions, and only the second one is the founder's to answer.
 */
export default async function HomePage({ params }: { params: Promise<LocaleParams> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <>
      <section className="sc-bill">
        <Halftone className="sc-bill-art" pitch={28} src="/frames/frame-hero.png" />
        <div className="sc-wrap">
          <div className="sc-bill-plate">
            <p className="sc-kicker">{t("kicker")}</p>
            <h1 className="sc-bill-head">{t("title")}</h1>
            <p className="sc-qualifier">{t("qualifier")}</p>
            {/* The one cobalt object on this page. */}
            <WaitlistCta />
          </div>
        </div>
      </section>

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
