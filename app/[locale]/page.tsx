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
 * Front page — r7 variant DITHER.
 *
 * **THE RECOMMENDATION.** A Bayer-dithered reproduction of the waveform, ink on
 * paper, panning seamlessly.
 *
 * Why it beats the incumbent, measured rather than argued: `halftone-dots`
 * reduces the signal to round dots on a fixed grid, and the waveform's fine
 * vertical peaks are exactly the detail a dot grid throws away. An 8x8 Bayer
 * dither keeps them — coverage 0.321 against halftone's 0.210, on the same
 * source, so it is not simply darker but carrying more of the picture.
 *
 * It is also two-colour by construction. `u_colorHighlight` is set equal to
 * `u_colorFront`, which the library's own docs call "classic 2-color dithering";
 * anything else would invent a third ink.
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
      <ScreenStage screen={{ shader: "image-dithering", src: "/frames/base-wave.png", px: 3 }}>
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
