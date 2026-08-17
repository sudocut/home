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
 * The names are real, and naming a channel is ours to do: they are the channels'
 * own public titles, and the front page already counts them.
 *
 * **The pictures are not.** `frame` points at an abstract greyscale field from
 * tools/make-frames.mjs — a key light and a falloff, not footage, not a
 * thumbnail, not anything anyone shot. Two reasons, and only the first is about
 * design:
 *
 *   1. A cross-origin YouTube thumbnail cannot be screened. The halftone uploads
 *      its source to a WebGL texture, and an image served without CORS taints the
 *      canvas and fails the upload outright. Any real artwork has to be a
 *      same-origin file in public/ regardless.
 *   2. **Nobody has been asked.** Publishing a still from a partner's video, or
 *      their channel art, on our marketing site is their call to grant and it has
 *      not been sought. soul.md's "never show a capability we don't have" covers
 *      the claim; this is the same instinct applied to the picture.
 *
 * So the tiles are screens of an abstract field with the channel's real name set
 * in type over them. Nothing on the page pretends to be a frame of anyone's show.
 *
 * TO DROP IN REAL ARTWORK: put a same-origin file at public/channels/<handle>.jpg
 * and set `art` to that path. `frame` stays as the fallback. Nothing else changes.
 */

export type Channel = {
  /** YouTube handle, without the @. Links to youtube.com/@{handle}. */
  handle: string;
  /** The channel's own YouTube title. */
  name: string;
  /** Abstract screen source. NOT footage — see the note above. */
  frame: string;
  /** Cleared, same-origin channel artwork, once it exists. Overrides `frame`. */
  art?: string;
};

export const CHANNELS: readonly Channel[] = [
  { handle: "eo_korea", name: "EO Korea", frame: "/frames/frame-01.png" },
  { handle: "eoglobal", name: "EO", frame: "/frames/frame-02.png" },
  { handle: "sudoremove", name: "sudoremove", frame: "/frames/frame-03.png" },
  { handle: "chester_roh", name: "AI Frontier Korea (노정석)", frame: "/frames/frame-04.png" },
  { handle: "eegirit", name: "이기릿 EEgirIT", frame: "/frames/frame-05.png" },
] as const;

/** What a channel tile actually screens. */
export const channelSource = (channel: Channel) => channel.art ?? channel.frame;
