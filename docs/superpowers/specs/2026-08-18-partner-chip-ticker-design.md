# Partner Chip Ticker Design

Status: founder-approved direction, 2026-08-18

## Goal

Fix the homepage "Publishing with SudoCut" trust band so the cleared YouTube
profile images read as partner identities, not as small circles floating inside
oversized video-thumbnail cards.

## Chosen direction

Use horizontal partner chips:

- circular profile image on the left;
- channel name and handle on the right;
- fixed card height for every channel;
- one shared gap token for item spacing and the track start;
- one continuous ticker track with enough repeated cycles to cover large
  desktop viewports without exposing an empty right edge.

The first five channels remain the semantic list. Repeated cycles exist only for
the visual seam and are removed from tab order and assistive technology.

## Design rationale

The channel image is a profile, not a video thumbnail. Keeping a 16:9 media slot
around a circular avatar creates false affordance and visible dead space. A
partner chip states the truth directly: this is a channel identity attached to a
YouTube source link.

This preserves the site constitution:

- card chrome remains ink/paper and tokenized;
- the only rounded shape is the permitted `50%` profile circle;
- profile pixels stay inside the already-approved narrow media exception;
- cobalt remains reserved for the single waitlist action;
- reduced motion still removes animation while preserving horizontal access.

## Browser contract

The browser verifier should reject regressions where:

- card heights differ;
- the avatar sits inside a 16:9 slot rather than a square chip slot;
- start gap and inter-item gap diverge;
- large screens expose a blank right edge during the ticker cycle;
- duplicate visual cycles become keyboard or screen-reader targets.

