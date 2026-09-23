import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChannelTicker } from "@/components/ChannelTicker";
import { ScreenStage } from "@/components/ScreenStage";
import { WaitlistCta } from "@/components/WaitlistCta";
import { YouTubeConnect } from "@/components/YouTubeConnect";

type LocaleParams = { locale: string };
const WORKFLOW_STEPS = ["edit", "captions", "intro", "shorts", "publish"] as const;

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
 * Front page — r7 variant DRIFT.
 *
 * The one shader in the library whose own clock works.
 *
 * `dithering` is procedural — no base image at all — and it reads `u_time` in
 * `main()`, measured at 71.2 mean absolute difference over nine seconds. So this
 * variant runs on `ShaderMount`'s native speed and our pan loop is not involved.
 * That is a real engineering argument: no periodic source to maintain, no wrap to
 * get right, no geometry constraint on the hero's aspect ratio.
 *
 * The cost is meaning. It is a beautiful dithered cloud that has nothing to do
 * with audio, video or editing — where the waveform, spectrogram and timeline all
 * show the visitor what the product works on. Restraint is a criterion in this
 * rubric; so is proof.
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
      <ScreenStage screen={{ shader: "dithering", shape: 1, px: 3, scale: 0.55 }}>
        <div className="sc-plate">
          <p className="sc-kicker">{t("kicker")}</p>
          <h1 className="sc-plate-head">{t("title")}</h1>
          <p className="sc-qualifier">{t("qualifier")}</p>
          <div className="sc-hero-workflow">
            <p className="sc-hero-workflow-label">{t("workflow.label")}</p>
            <ol className="sc-hero-workflow-list">
              {WORKFLOW_STEPS.map((step, index) => (
                <li className="sc-hero-workflow-step" key={step}>
                  <span className="sc-hero-workflow-number">0{index + 1}</span>
                  <strong>{t(`workflow.${step}`)}</strong>
                </li>
              ))}
            </ol>
          </div>
          {/* The one cobalt object on this page. */}
          <WaitlistCta />
        </div>
      </ScreenStage>

      {/* Constitution D8 — the only other motion on the page. */}
      <ChannelTicker pitch={7} />

      <section className="sc-wrap sc-deliverable">
        <p className="sc-deliverable-label">{t("deliverableLabel")}</p>
        <h2 className="sc-deliverable-head">{t("deliverableTitle")}</h2>
        <p className="sc-deliverable-body">{t("deliverable")}</p>
      </section>

      {/* Last band before the footer, and that adjacency is the point — see the
          header of YouTubeConnect.tsx. Constitution D12. */}
      <YouTubeConnect />
    </>
  );
}
