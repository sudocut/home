# Design Constitution

Rules that are **already decided**. No round may re-litigate these. A variant that
breaks one is not a bold interpretation — it is a spec violation, and
`tools/verify-round.mjs` rejects it before a human ever sees it.

**Authority order:** `soul.md` → `sudocut/web` shipped Round 6 → the archived
Option H exploration. A lower layer never overrides a higher one.

---

## S — from soul.md (the constitution)

| # | Rule | Since |
|---|---|---|
| S1 | **One point color.** Cobalt marks the single required action. At most **one per viewport**. Everything else is monochrome. | soul.md |
| S2 | **Every flow ends in one button.** A first-time user should not have to decide what to look at. | soul.md |
| S3 | **When in doubt, subtract.** Everything on screen competes with the one thing that matters. | soul.md |
| S4 | **Warmth, not sterility.** Paper is warm `#f1f1ec`, never clinical white. | soul.md |
| S5 | **Korean-first, English in parallel.** Any type decision that cannot set Hangul is disqualified. | soul.md |
| S6 | **Honesty over polish.** No hype. Never show a capability we don't have. Show the failures. | soul.md |
| S7 | **Expose the criteria.** Reviewable, restorable. Never a black box. | soul.md |
| S8 | **Understanding is the bottleneck.** Optimise for cognitive load, not feature count. | soul.md |

## W — from sudocut/web shipped Round 6

Source: `web/design/mockups/shared/bauhaus.css`, `body[data-round="6"]` — the layer
used by the selected *Bauhaus Timeline Proof* direction.

| # | Rule | Since |
|---|---|---|
| W1 | **Palette is fixed.** ink `#24292c` · paper `#f1f1ec` · panel `#fbfaf5` · cobalt `#1f55ff` · red `#ff3b2f` · yellow `#ffd523`. No other color exists. | 2026-07 |
| W2 | **Red and yellow are status only.** Error/destructive and warning/in-progress. Never decoration, never a second accent. | 2026-07 |
| W3 | **Three typefaces.** Hahmlet (display) · SUIT (UI/Korean) · Jost (numerals). Plus the system mono stack. Nothing else. | 2026-07 |
| W4 | **`radius: 0`.** No rounded corners except `50%` circles. | 2026-07 |
| W5 | **Shadows are hard offset, zero blur, zero spread.** `6px 6px 0` at rest, `9px 9px 0` on hover, paired with `translate(-2px,-2px)`. No blur, no glow. | 2026-07 |
| W6 | **Motion is 120–200ms `ease`.** Entrances 300–520ms. `prefers-reduced-motion` kills everything. | 2026-07 |
| W7 | **Derive colors with `color-mix()`** against existing tokens. Never hand-pick a hex. | 2026-07 |
| W8 | **Gradients only for the 76px hairline grid.** Never decorative. | 2026-07 |

## O — survives the Option H exploration

| # | Rule | Since |
|---|---|---|
| O1 | **Mark geometry:** bar 22x · gap 12x · line 4x · height 88x · width 72x. Clear space 22x. | 2026-07 |
| O2 | **Mark misuse:** never skew, rotate, recolor, outline, gradient-fill, or crowd. The cut line never moves or changes weight ratio. | 2026-07 |
| O3 | **Voice:** direct · numeric · editor-to-editor · never precious · shorter than you think. | 2026-07 |
| O4 | **Transitions are hard cuts. The brand never dissolves.** | 2026-07 |

## D — decided 2026-07-26

| # | Rule | Reverse by |
|---|---|---|
| D1 | `radius: 0` governs the company site too, not the ranking catalog's `14px`. | `--sc-radius` |
| D2 | Hahmlet is frozen as the display face. | `--sc-heavy` |
| D3 | The cut-point mark is adopted as the official mark. | delete `brand/logo/` |
| D4 | 양피지 warmth = warm paper + 76px grid. No raster texture. | one `background-image` |

---

## What rounds ARE for

The visual system is settled. Rounds explore **layout, information architecture,
copy, and rhythm** inside it. That is the whole point: hold the variables constant
so the comparison means something.

## Adding a rule

A rule enters here when a round **verdict** settles a question that keeps recurring.
Add it with a date and a source, and state what would reverse it. If a rule cannot
be checked — by `verify-round.mjs` or by a human in ten seconds — it is a preference,
not a rule. Leave it out.
