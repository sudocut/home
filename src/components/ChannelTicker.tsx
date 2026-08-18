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
 *   1. **The list is repeated, and the copies are `aria-hidden`.** A seamless
 *      loop needs more than one run; a large desktop needs enough run length to
 *      avoid showing an empty right edge near the wrap. A screen reader needs the
 *      five channels once, so only the first cycle is semantic and tabbable.
 *   2. **Stopped, it is still complete.** The track scrolls with `overflow-x`
 *      available, so when prefers-reduced-motion kills the animation — or when
 *      hover pauses it — the band is a scrollable list rather than a row that has
 *      been cut off at the viewport edge. A marquee that is unreadable when
 *      stopped is an accessibility failure wearing a design.
 *
 * Hover and focus pause it. An infinitely moving link is a target you have to
 * chase, and every tile here is a link.
 *
 * The tile chrome stays ink on paper. The cleared profile image is the narrow
 * D8 media-pixel exception; it may bring its own pixels, but the border,
 * background, text, motion and hover language still spend only tokens. The card
 * is now a partner chip rather than a video-thumbnail tile: profile on the left,
 * identity on the right.
 *
 * The pictures are public channel profiles, not video thumbnails. If a local
 * profile image fails to load, ChannelArtwork falls back to the abstract
 * Halftone frame described in src/content/channels.ts.
 *
 * WHAT THIS COSTS, SO IT IS NOT DISCOVERED LATER. The normal path is twenty
 * image elements — five channels, four cycles, for the large-screen seam — plus
 * the hero screen and D6 paper texture. The old all-Halftone path stays
 * available only as an isolated runtime fallback for a failed profile image, so
 * the usual page no longer burns WebGL contexts for the trust band.
 */
export function ChannelTicker({ pitch = 8 }: { pitch?: number }) {
  const t = useTranslations("home.channels");
  const cycles = [0, 1, 2, 3] as const;

  const run = (cycle: number) =>
    CHANNELS.map((channel) => (
      <li
        aria-hidden={cycle > 0 ? true : undefined}
        className="sc-tick-item"
        key={`${cycle}-${channel.handle}`}
      >
        <a
          className="sc-tick"
          href={`https://www.youtube.com/@${channel.handle}`}
          rel="noopener noreferrer"
          tabIndex={cycle > 0 ? -1 : undefined}
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
        <ul className="sc-tick-track">{cycles.flatMap((cycle) => run(cycle))}</ul>
      </div>

      <p className="sc-trust-note">{t("note")}</p>
    </section>
  );
}
