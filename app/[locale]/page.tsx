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
 * Front page — r6 variant PLAYHEAD.
 *
 * The tape is running. The screen pans across the waveform continuously and
 * forever, with no seam — the source repeats exactly twice across its width, so
 * the wrap lands on identical content and there is nothing to see.
 *
 * TWO THINGS THE FOUNDER REMOVED after picking this variant, 2026-08-18:
 *
 *   The console.  D10 let a visitor change the screen. Ruled out: "it does not
 *                 matter for right now". The constitution records D10 as
 *                 reversed rather than deleting it, because the argument for it
 *                 — soul.md S7, expose the criteria — is still a good one and
 *                 the next round should be able to find it.
 *   The gate line. "Invite-only · ~10 channels · Korea first · free during beta"
 *                 is gone from the hero. Every one of those facts still lives on
 *                 /pricing, so the page lost a line and the site lost nothing.
 *
 * SHARED BY ALL SIX r6 VARIANTS
 * r5 chose billboard: a full-bleed screen with the claim knocked out on paper.
 * r6 keeps that, and the screen MOVES (D9) over a waveform base image.
 *
 * The waveform is the one picture this company can put on its own front page
 * that is both honest and about the product: it is what SudoCut looks at. It
 * invents no footage and needs nobody's permission.
 *
 * Text is cut again, to 61 words. Gone since r5: the two-figure band, the "what
 * comes back" sentence, the waitlist's "two questions" line, the gate line, and
 * the privacy line — which MOVED to the footer rather than being deleted,
 * because cutting copy may cost words and may not cost a commitment.
 *
 * The qualifier survives both cuts. The claim above it is a view count on one
 * channel, and the standing brief forbids publishing it without saying so.
 */
export default async function HomePage({ params }: { params: Promise<LocaleParams> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <>
      <ScreenStage pitch={22} src="/frames/base-wave.png">
        <div className="sc-plate">
          <p className="sc-kicker">{t("kicker")}</p>
          <h1 className="sc-plate-head">{t("title")}</h1>
          <p className="sc-qualifier">{t("qualifier")}</p>
          {/* The one cobalt object on this page. The console is monochrome. */}
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
