import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChannelTicker } from "@/components/ChannelTicker";
import { ScreenStage } from "@/components/ScreenStage";
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
 * Front page — r7 variant HALFTONE.
 *
 * **THE CONTROL.** r6-playhead exactly as it stands: `halftone-dots` at a 22px
 * pitch on the waveform, panning seamlessly.
 *
 * It is in the round so the round can answer the question that was actually
 * asked. "Is halftone-dots the best shader for this?" is not answerable by
 * looking at five alternatives; it needs the incumbent on the same page, with the
 * same copy, judged the same way.
 *
 * If this wins, that is a real result: it would mean the survey found nothing
 * better and the shader was right all along.
 *
 * SHARED BY ALL SIX r7 VARIANTS
 * The layout is r6-playhead, unchanged and already chosen. **Only the screen
 * differs**, because the founder asked whether `halftone-dots` was the right
 * shader at all — and a round that also moved the layout could not answer that.
 *
 * Three variants hold the shader and change the base image; two change the
 * shader; one changes nothing and is the control. That split is the experiment:
 * it separates "which shader" from "which picture", which six free-form designs
 * could not.
 *
 * Every candidate was rendered and measured before it was proposed —
 * `node tools/shader-survey.mjs`. Most of the library never reached the page:
 * `mesh-gradient`, `god-rays`, `metaballs`, `liquid-metal`, `warp`, `voronoi`
 * and the rest blend many colours or glow, and W5 bans blur while W8 bans
 * decorative gradients. They cannot be expressed in a three-colour palette, so
 * they are not taste rejections.
 */
export default async function HomePage({ params }: { params: Promise<LocaleParams> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <>
      <ScreenStage screen={{ shader: "halftone-dots", src: "/frames/base-wave.png", pitch: 22 }}>
        <div className="sc-plate">
          <p className="sc-kicker">{t("kicker")}</p>
          <h1 className="sc-plate-head">{t("title")}</h1>
          <p className="sc-qualifier">{t("qualifier")}</p>
          {/* The one cobalt object on this page. */}
          <WaitlistCta />
        </div>
      </ScreenStage>

      {/* Constitution D8 — the only other motion on the page. */}
      <ChannelTicker pitch={7} />

      <div className="sc-wrap">
        <p className="sc-deliverable">{t("deliverable")}</p>
      </div>
    </>
  );
}
