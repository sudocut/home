/**
 * The channels publishing with SudoCut.
 *
 * Handles and names are locale-invariant identifiers rather than copy, so like
 * WaitlistCta's FORM_URL they live here and not in messages/.
 *
 * Names and handles are from the `add-trusted-partners-section` branch, where
 * each was checked against youtube.com/@{handle} on 2026-08-17 — all five
 * resolved. This file adds the artwork slot; it does not restate the research.
 *
 * WHAT IS REAL HERE AND WHAT IS NOT
 * ---------------------------------
 * The names and profile images are real. Naming a channel is ours to do: they are
 * the channels' own public titles, and the front page already counts them. The
 * profile images are retained same-origin derivatives with public-safe clearance
 * recorded in brand/reference/channels/SOURCE.md.
 *
 * `art` is the normal path. `frame` remains the runtime fallback: an abstract
 * greyscale field from tools/make-frames.mjs, not footage, not a thumbnail, not
 * anything anyone shot. The fallback exists for two reasons, and only the first
 * is about design:
 *
 *   1. Profile delivery can fail at runtime, and a broken image icon is not a
 *      design. ChannelArtwork swaps to the same Halftone screen instead.
 *   2. The fallback keeps us from inventing video stills or episode thumbnails
 *      when only profile-image clearance has been granted.
 *
 * So the normal tiles show cleared public profile images. If one cannot load, the
 * tile falls back to an abstract screen with the channel's real name set in type
 * over it. Nothing on the page pretends to be a frame of anyone's show.
 */

export type Channel = {
  /** YouTube handle, without the @. Links to youtube.com/@{handle}. */
  handle: string;
  /** The channel's own YouTube title. */
  name: string;
  /** Abstract screen source. Runtime fallback only — see the note above. */
  frame: string;
  /** Cleared, same-origin channel profile artwork. Overrides `frame`. */
  art?: string;
};

export const CHANNELS: readonly Channel[] = [
  {
    handle: "eo_korea",
    name: "EO Korea",
    frame: "/frames/frame-01.png",
    art: "/channels/eo_korea.webp",
  },
  {
    handle: "eoglobal",
    name: "EO",
    frame: "/frames/frame-02.png",
    art: "/channels/eoglobal.webp",
  },
  {
    handle: "sudoremove",
    name: "sudoremove",
    frame: "/frames/frame-03.png",
    art: "/channels/sudoremove.webp",
  },
  {
    handle: "chester_roh",
    name: "AI Frontier Korea (노정석)",
    frame: "/frames/frame-04.png",
    art: "/channels/chester_roh.webp",
  },
  {
    handle: "eegirit",
    name: "이기릿 EEgirIT",
    frame: "/frames/frame-05.png",
    art: "/channels/eegirit.webp",
  },
] as const;

/** What a channel tile displays, with the profile preferred over the fallback frame. */
export const channelSource = (channel: Channel) => channel.art ?? channel.frame;
