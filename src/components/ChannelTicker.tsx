import { useTranslations } from "next-intl";
import { ChannelArtwork } from "@/components/ChannelArtwork";
import { CHANNELS } from "@/content/channels";

/**
 * The trust band — the channels publishing with SudoCut, screened and flowing.
 *
 * Founder's brief, 2026-08-18: the partner channels should be visible the moment
 * someone lands, and the band should flow. Constitution D8 records the motion
 * exception that "flow" needs, and the two conditions on it are both implemented
 * here rather than left to the caller:
 *
 *   1. **The list is duplicated, and the copy is `aria-hidden`.** A seamless loop
 *      needs the run twice; a screen reader needs it once. Without the second
 *      half the band visibly jumps at the wrap, and without aria-hidden every
 *      channel is announced twice.
 *   2. **Stopped, it is still complete.** The track scrolls with `overflow-x`
 *      available, so when prefers-reduced-motion kills the animation — or when
 *      hover pauses it — the band is a scrollable list rather than a row that has
 *      been cut off at the viewport edge. A marquee that is unreadable when
 *      stopped is an accessibility failure wearing a design.
 *
 * Hover and focus pause it. An infinitely moving link is a target you have to
 * chase, and every tile here is a link.
 *
 * MONOCHROME, ALWAYS. Every tile is ink on paper. The one cobalt object on the
 * page is the waitlist action, and nothing in this band may become a second one.
 *
 * The pictures are abstract screens, not thumbnails — src/content/channels.ts
 * explains why, and the band says so in a line of its own rather than leaving a
 * visitor to assume they are looking at real frames.
 *
 * WHAT THIS COSTS, SO IT IS NOT DISCOVERED LATER. Ten tiles is ten WebGL
 * contexts — five channels, twice, for the seam — plus one for the hero screen
 * and one for the D6 paper texture. Twelve renders fine and stays under Chrome's
 * per-process cap of sixteen, but it is not free: headless needed roughly three
 * times the settle time to reach a first frame with the band on the page than
 * without it. If a variant ever wants a second row, or the band moves onto a page
 * that already has screens, pre-render the tiles to PNG instead of raising the
 * count. Every one of them is a static image of a static shader.
 */
export function ChannelTicker({ pitch = 8 }: { pitch?: number }) {
  const t = useTranslations("home.channels");

  const run = (duplicate: boolean) =>
    CHANNELS.map((channel) => (
      <li className="sc-tick-item" key={`${duplicate ? "dup-" : ""}${channel.handle}`}>
        <a
          className="sc-tick"
          href={`https://www.youtube.com/@${channel.handle}`}
          rel="noopener noreferrer"
          tabIndex={duplicate ? -1 : undefined}
          target="_blank"
        >
          <ChannelArtwork art={channel.art} frame={channel.frame} pitch={pitch} />
          <span className="sc-tick-name">{channel.name}</span>
          <span className="sc-tick-handle">@{channel.handle}</span>
        </a>
      </li>
    ));

  return (
    <section aria-label={t("label")} className="sc-trust">
      <p className="sc-trust-label">
        {t("label")}
        <span className="sc-trust-count">{t("count")}</span>
      </p>

      <div className="sc-tick-rail">
        <ul className="sc-tick-track">{run(false)}</ul>
        {/* The seam. Hidden from assistive tech — it is the same five channels. */}
        <ul aria-hidden="true" className="sc-tick-track">
          {run(true)}
        </ul>
      </div>

      <p className="sc-trust-note">{t("note")}</p>
    </section>
  );
}
