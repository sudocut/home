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
 * Front page — r6 variant POINTER.
 *
 * The screen follows the cursor. Moving the mouse moves the field behind the
 * claim, so the page responds to a visitor rather than performing at them —
 * nothing moves until someone does something.
 *
 * One knob only: dot size. The motion control is absent on purpose, because
 * here the visitor already IS the motion control.
 *
 * On touch there is no pointer, so the screen holds still — a complete design
 * rather than a degraded one, and the same state a visitor with
 * prefers-reduced-motion gets.
 *
 * SHARED BY ALL SIX r6 VARIANTS
 * r5 chose billboard: a full-bleed screen with the claim knocked out on paper.
 * r6 keeps that and changes three things the founder asked for on 2026-08-18 —
 * the screen MOVES (D9), the visitor can ADJUST it (D10), and the base image is
 * a waveform rather than an abstract light field.
 *
 * The waveform is the one picture this company can put on its own front page
 * that is both honest and about the product: it is what SudoCut looks at. It
 * invents no footage and needs nobody's permission.
 *
 * Text is cut again, to 71 words. Gone since r5: the two-figure band, the "what
 * comes back" sentence, the waitlist's "two questions" line, and the privacy
 * line — which MOVED to the footer rather than being deleted, because cutting
 * copy may cost words and may not cost a commitment.
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
      <ScreenStage
        altSrc="/frames/base-wave-cut.png"
        consoleClass="sc-console-wrap--inline"
        controls={["pitch"]}
        motion="pointer"
        pitch={24}
        src="/frames/base-wave.png"
      >
        <div className="sc-plate">
          <p className="sc-kicker">{t("kicker")}</p>
          <h1 className="sc-plate-head">{t("title")}</h1>
          <p className="sc-qualifier">{t("qualifier")}</p>
          {/* The one cobalt object on this page. The console is monochrome. */}
          <WaitlistCta compact />
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
