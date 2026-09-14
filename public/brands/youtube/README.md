# YouTube brand assets

Third-party brand files. **Not ours, and not editable.** They are here so the
homepage can name the YouTube integration the way YouTube's own rules require,
and so the YouTube API Services audit has a real page to screenshot.

Constitution **D12** is the rule that lets a file in this directory carry colours
from outside the palette. Read it before adding anything here.

## What is in this directory

| File | Variant | Canvas | Bytes | SHA-256 |
|---|---|---|---|---|
| `yt_logo_fullcolor_almostblack_digital.png` | Core logo · full colour · Almost Black wordmark · digital | 1705×573 | 19896 | `9d9674fdc18083dad15563ef34773ec5337db21aa4ce75c45977a894784d728f` |

The file is **byte-identical to the one inside YouTube's official archive.** It
was copied out of the zip and not opened in an editor, not resaved, not
recompressed, not cropped, not recoloured.

## Source

- Page: <https://brand.youtube/youtube-logo> — "Core YouTube logo" download.
- Archive: `https://www.gstatic.com/marketing-cms/52/7d/637fef5a4788a97747e6feabc4aa/youtube-logo.zip`
  · SHA-256 `d4b6177de68158c8153d524da9d79045a9551bc8dc10cfc0244f754b13a02b7d`
- Path inside the archive: `YouTube_Logo/Digital/01 Full Color/yt_logo_fullcolor_almostblack_digital.png`
  (file timestamp 2025-06-04)
- Downloaded: **2026-09-14**

Re-download before assuming this is current. brand.youtube says so itself, and
it has already moved once: *"**NEW** The hex value of the red in the YouTube icon
was recently updated to (#FF0033) please ensure to download the latest logo files
above."* Anything still carrying `#FF0000` is a stale asset.

## Why this variant

Three choices, each one forced rather than picked.

**Standard YouTube logo, not "Developed with YouTube".** The
[API branding guidelines](https://developers.google.com/youtube/terms/branding-guidelines)
reserve the *Developed with YouTube* logo for an application that is "entirely
dependent on curating YouTube content or on its integration with YouTube."
SudoCut cuts video and hands back an MP4 and a project file; remove the YouTube
integration and the product still works. The standard logo is the one for
identifying "a specific application feature or component that uses YouTube
content", which is exactly what the homepage band does.

**Full colour, not monochrome.** brand.youtube offers a monochrome logo for when
"it's difficult to see the full-color logo over a specific color or image."
Ours is warm paper `--sc-paper`; the full-colour logo is perfectly legible on it,
so the condition for reaching for monochrome is not met. Founder call,
2026-09-14.

**Almost Black wordmark, not White.** The white wordmark is for dark backgrounds.

**PNG, because the official archive contains no SVG.** It ships PNG, AI, EPS and
PDF only. Hand-tracing an SVG from the PNG would be exactly the "redrawn logo"
the guidelines prohibit, so the PNG is used directly.

## Geometry, measured from this file

Measured rather than quoted, because a rendered size has to come from the file
that is actually on the page:

```
canvas         1705 × 573
logo ink       1294 × 289 at (204, 141)     aspect 4.478 : 1
baked padding  L 204  R 207  T 141  B 143
colours        #212121 wordmark · #FF0033 icon · #FFFFFF triangle
```

**The clear space is already inside the file.** brand.youtube defines it as "the
triangle within our icon", and that margin is baked into the 1705×573 canvas —
which is why the canvas is 2.976:1 while the logo itself is 4.478:1. So the rule
is kept by *not cropping the PNG*, and the page adds its own margin on top of
that. Do not trim the transparent edges to make it sit tighter.

## Minimum size — what is official, and what is ours

Official, quoted from brand.youtube:

> To ensure our logos are always legible, their height should never be smaller
> than the following:
> Digital: 100px
> Print: 3.1mm

**That page does not say whether the 100px is the logo's height or the delivered
file's height, and the two differ by a factor of 1.98 here.** We read it as the
delivered file, so `.sc-yt-logo` renders the PNG at a **canvas height of 120px on
desktop and 100px at ≤880px**, never below 100. Logo ink is then 60.5px and 50.5px
tall, 271px and 226px wide.

The other reading — logo ink ≥ 100px — would put the logo at 448px wide and, at
1705/289 scaling, 590px of canvas. On the 1160px content column that makes the
YouTube logo the largest object on the page, which the same set of guidelines
forbids: *"Do not display the logo as the most prominent element on your web
page."* And at 390px it cannot fit at all — the content column there is 346px.
When two official rules cannot both hold, the narrower reading of the ambiguous
one is the one that keeps the explicit rule intact.

**This is our interpretation, recorded as an interpretation.** It is not a
YouTube-published number and must not be cited as one.

## Rules for anything on this page

- Never recolour, filter, mask, blend, rotate, skew, crop or outline it.
- Never put it inside a SudoCut lockup, or next to the SudoCut wordmark closely
  enough to read as one combined mark.
- Never let it be the most prominent element on the page.
- It must link to YouTube content or to a YouTube component of the app. The
  guidelines name the YouTube homepage as an acceptable destination, and that is
  what `YouTubeConnect` uses.
- Never write copy around it that implies YouTube sponsors, endorses, certifies
  or partners with SudoCut.
- Never use "YouTube", or an abbreviation of it, as part of a SudoCut product
  name.
