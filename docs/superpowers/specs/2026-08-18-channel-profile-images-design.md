# Channel Profile Images in the Trust Band

Status: founder-selected direction, 2026-08-18

## Goal

Replace the five abstract screened images in the homepage trust band with each
channel's official YouTube profile image. Preserve the existing channel order,
names, handles, links, continuous ticker, reduced-motion behavior, and the
selected r7 DRIFT hero.

The section continues to answer one question: **who publishes with SudoCut?** It
does not become a feed of recent videos.

## Chosen visual direction

Each existing 16:9 artwork slot remains a wrapper and becomes a neutral paper
field with one centered circular profile image. The inner image is separate from
the 16:9 wrapper so it is never stretched: 88px on the current desktop card and
64px when the mobile card narrows to 140px. The circle receives a 2px ink rule.
The image keeps its original color; channel name and handle remain below it.

This is a narrow media exception, not a palette change:

- profile images are third-party content inside `.sc-tick-art`;
- no new CSS color, shadow, radius, font, or easing literal enters the product;
- `50%` is already the constitution's permitted circle exception;
- faithful, cleared third-party media pixels are exempt from the UI palette
  count; all surrounding chrome remains tokenized ink and paper and never spends
  cobalt, red, or yellow as decoration.

The relevant D8 wording and the `CLAUDE.md` hard-rule summary must be amended from
"monochrome screens" to this content-image exception. D7 continues to govern the
abstract fallback only. Reversing the exception means removing the five `art`
values and assets, restoring the old copy, and reverting both policy edits.

## Asset contract and provenance

Do not load images from YouTube at runtime and do not call the YouTube API in the
browser or at build time. Remote avatar URLs can change, CORS behavior can drift,
and a runtime dependency would make the marketing page less deterministic.

After clearance, retain one non-served original per channel for reproducible
provenance:

```text
brand/reference/channels/original/eo_korea.jpg
brand/reference/channels/original/eoglobal.jpg
brand/reference/channels/original/sudoremove.jpg
brand/reference/channels/original/chester_roh.jpg
brand/reference/channels/original/eegirit.jpg
```

Serve one optimized same-origin derivative per channel:

```text
public/channels/eo_korea.webp
public/channels/eoglobal.webp
public/channels/sudoremove.webp
public/channels/chester_roh.webp
public/channels/eegirit.webp
```

The selected public sources are the channels' 900x900 YouTube profile images as
observed on 2026-08-18. Add the non-served provenance record
`brand/reference/channels/SOURCE.md` with, for each file:

- handle and channel name;
- source channel URL and exact image URL;
- retrieval date;
- retained original path, dimensions, and checksum;
- served derivative path, dimensions, byte size, and checksum;
- permission grantor, grant date, permitted scope, evidence location, and
  clearance status;
- relationship basis for the separate "publishing with SudoCut" claim.

Public visibility does not itself establish permission to republish an image on
a third-party marketing site. This repository is public, so committing an image
already republishes it through GitHub. **All five images are an all-or-nothing
pre-commit gate:** no original bytes, derivative bytes, or `art` paths may be
committed or pushed until all five grants are recorded as cleared in `SOURCE.md`.
Uncleared exploration assets stay untracked outside the repository. The site
must not claim that permission was granted unless it was.

Preserve the cleared 900x900 originals and serve a 256x256 WebP derivative, at
most 100KB. `pnpm channels:build-assets` runs a pinned cross-platform image
dependency and performs only orientation normalization, metadata stripping, and
an sRGB resize from 900x900 to 256x256 at a fixed quality—no crop, filter, color
change, or creative alteration. It writes all five derivatives from the retained
originals. That is sufficient for the 88px display at 2x density without shipping
a 900px source to every visitor. Images are local, explicitly sized, eagerly
available in the above-the-fold ticker, and decoded asynchronously; the duplicate
run reuses the same five URLs from browser cache.

## Rendering and data flow

`src/content/channels.ts` remains the source of channel identity and receives an
`art` path only after the all-five clearance gate passes. `frame` remains the
deterministic configuration and runtime fallback.

`ChannelTicker` renders:

1. a 16:9 `.sc-tick-art` wrapper;
2. a small client `ChannelArtwork` that renders the square `<img>` for
   `channel.art`, with explicit intrinsic dimensions and an empty alt because the
   adjacent name and handle already label the enclosing link;
3. the existing `Halftone` when `art` is absent or when the image emits an error.

The duplicated ticker run keeps `aria-hidden="true"` and its links remain out of
the tab order. The five same-origin assets must be verified at build/test time,
so a cleared `art` path cannot silently ship as a broken image.

With all five assets healthy, this removes ten WebGL contexts from the normal
homepage (five channel tiles, duplicated for the seamless loop). A delivery
failure creates fallback contexts only for the affected original and duplicate
tile. The hero screen and paper texture remain.

## Copy changes

The current note says the names are real and the screens are abstract. That will
be false and must change in both locales.

Exact meaning to preserve in both localized strings:

- `en`: `Public channel profiles · each card opens its YouTube source.`
- `ko`: `공개 채널 프로필 · 각 카드는 해당 YouTube 채널로 연결됩니다.`

This identifies provenance and link behavior. It does not say that YouTube, the
channel, or the profile image endorses SudoCut, and it does not substitute for
the separately recorded basis for calling the channels publishing partners or
testbeds.

Do not add subscriber counts, testimonials, performance claims, or a new CTA.

## Failure and fallback behavior

- The profile-image launch is all-five or none. If any clearance is missing, the
  current abstract band, copy, constitution, and `CLAUDE.md` remain unchanged.
- A configured local asset must exist, decode, and meet the image contract before
  the change passes verification.
- A configured image that fails at runtime switches that tile to its existing
  `Halftone` frame through `ChannelArtwork` instead of showing a broken icon.
- WebGL failure still affects only the hero/paper/fallback effects; healthy
  profile images are plain same-origin media and remain visible.
- Reduced motion continues to stop the ticker while horizontal scrolling keeps
  all five channels reachable.

## Verification

Add three named, executable asset/browser surfaces:

- `pnpm channels:build-assets` runs `tools/build-channel-art.mjs`; it applies the
  fixed transform above to every retained original and writes all five served
  derivatives.
- `pnpm channels:verify-assets` runs `tools/verify-channel-art.mjs`; it decodes
  all five retained originals and derivatives, validates 900x900 source and
  256x256 served dimensions plus the 100KB ceiling, verifies local original and
  served checksums against `SOURCE.md`, requires all clearance fields and
  relationship basis, and rejects missing/extra configured `art` paths. It also
  regenerates every derivative into a temporary directory with the same build
  function and requires byte-for-byte equality with the committed served file.
  This makes source-to-derivative correspondence and the absence of unrecorded
  image edits executable without fetching YouTube. The build and verifier share
  the same pinned cross-platform decoder/encoder rather than relying on macOS
  `sips`.
- `pnpm channels:verify-browser` runs a Playwright-core probe against a built
  local server. It checks both locales, five unique images and ten DOM instances,
  empty decorative alts, links, hidden duplicate semantics/tab order,
  hover/focus pause, reduced-motion scrolling, desktop and 390px geometry,
  runtime image-error fallback, trust-band canvas count, and continuing hero
  motion. The command owns server startup/shutdown and accepts an explicit Chrome
  path for CI/local portability.

Before completion:

1. Run `pnpm channels:build-assets` and require a clean asset diff.
2. Run `pnpm channels:verify-assets`.
3. Run `pnpm lint`, `pnpm typecheck`, and `pnpm build`.
4. Run `pnpm channels:verify-browser` against that build.
5. Run the constitution/design
   verifier, and the literal color/typeface guards from `CLAUDE.md`.

## Out of scope

- latest or representative video thumbnails;
- runtime synchronization with YouTube;
- banners, subscriber counts, or video titles;
- changing ticker geometry, speed, order, or channel membership;
- changing the r7 DRIFT hero or other pages.

## Rollback

Rollback is one atomic revert: remove all five `art` values and served assets,
restore the old localized abstract-screen note, and revert the D8/`CLAUDE.md`
media exception. The existing `frame` values then restore the current abstract
band without changing layout, motion, order, or links. Partial rollback is not a
supported public state.
