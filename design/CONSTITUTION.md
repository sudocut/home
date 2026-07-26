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
| D4 | 양피지 warmth = warm paper + 76px grid. No *raster* texture. **Amended by D6** — a WebGL paper texture at the mandated settings is now permitted on top. | one `background-image` |
| **D5** | **English first, Korean second.** Reverses S5. | locale default |
| **D6** | **Paper texture shader allowed at mandated light settings only.** Amended 2026-07-27. | see below |

### D5 — English first (2026-07-26, founder)

**This reverses S5, and S5 came from soul.md.** soul.md says *"Korean-first is our
home, English in parallel"*; the founder has ruled English first, Korean second.

The founder outranks every document here, so the rule stands — but soul.md is the
constitution and lives in `sudocut/meta`, where it says *"when our behavior needs
correcting, we correct this."* **Right now this repo and soul.md disagree.** Until
soul.md is updated, that gap is real and is tracked in `docs/open-questions.md`.

Consequence: `en` is the default locale, `ko` secondary. Korean copy is still
written as Korean, never machine-translated English.

### D6 — Paper texture: measured settings only (2026-07-26, rewritten 2026-07-27)

**The founder has ruled the shader is in. This section records the settings that
make it actually visible, and corrects two earlier versions of itself that did not.**

#### What the previous two versions of D6 got wrong

The first version banned the shader after r2. The second unbanned it at
`u_colorFront: #e5e6e3`, contrast .10, and claimed *"grain visible, page stays
bright"*. **Both were written from screenshots and eyesight. Measured, the adopted
setting changed the page by at most 4/255 and moved it DOWNWARD** — invisible, and
slightly grey. The claim was wrong in both halves, and nothing in the repo could
catch it because nothing measured. `tools/shader-probe.mjs` now exists so no
setting can be recorded here again without numbers.

Three independent faults were stacked, and the founder saw the sum of them:

1. **The board could not run the shader at all.** `design/board/board.js` set
   `sandbox="allow-same-origin"` with no `allow-scripts`, so every variant's
   `<script type="module">` was blocked. CSS still applied, so the board looked
   correct while showing every variant with its texture missing. r2 and r4 were
   both judged in that state.
2. **`u_image` was never set, so the fibre never rendered.** `ShaderMount` only
   sets `u_imageAspectRatio` when `u_image` is a loaded `HTMLImageElement`
   (`shader-mount.js:102`, `:250`). `patternUV` — which the fibre, crumples and
   folds are *all* built on — is multiplied by that value, so at its default of 0
   the entire pattern system renders nothing at any setting. Only the screen-space
   `roughness` term survived. Verified: `u_fiberSize` 0.05, 0.7 and 3.0 produced
   **byte-identical** frames.
3. **The colour pair was chosen from a wrong model of the shader.** The output is
   `fgColor*res + bgColor*(1-res)` where `res` is a lighting term that settles near
   **0.41** — so the sheet is roughly `0.41*front + 0.59*back`, and *both* slots
   must sit above paper for the mean to land on paper. Every earlier setting put at
   least one slot below it, which is why every earlier setting greyed. r2 put ink
   there; the second D6 put rail grey there, which is the same mistake made smaller.

#### The measurement

Two failure modes, independent, and a setting must clear both:

- **GREYING** — mean luminance falls. This is what the founder rejected in r2: the
  sheet reads as a disabled control.
- **INVISIBLE** — no local variation. This is what the second D6 shipped.

Measured at 1000×820 against a flat `#f1f1ec` sheet (`node tools/shader-probe.mjs`).
`grain` is mean absolute difference between adjacent pixels; `dMean` is the shift in
mean luminance, where negative is greyer:

| setting | front / back | grain | dMean | |
|---|---|---|---|---|
| r4 as shipped | `#e5e6e3` / `#f1f1ec`, aspect 0 | 0.20 | −3.32 | invisible **and** grey |
| second D6, fibre fixed | `#e5e6e3` / `#f1f1ec` | 0.36 | −5.01 | still invisible, greyer |
| r2's ink fibre | `#24292c` / `#f1f1ec` | 13.88 | −85.40 | **the rejected failure** |
| **adopted** | **`#e0e1dd` / `#fffefa`** | **3.67** | **+0.34** | **grain visible, sheet on paper** |

#### Mandated settings

Colours are tokens — `--sc-paper-fibre` and `--sc-paper-lit` in `brand/tokens/`.
They are **shader lighting inputs, not surface colours**; never paint with them.

```js
const sheet = new Image();
sheet.src = emptyPixel;      // vendored 1x1 transparent GIF
await sheet.decode();        // REQUIRED — without a loaded u_image the fibre is dead

u_colorFront: col(token('--sc-paper-fibre')),   // #e0e1dd
u_colorBack:  col(token('--sc-paper-lit')),     // #fffefa
u_contrast: 0.55, u_roughness: 0.30, u_fiber: 0.70, u_fiberSize: 0.40,
u_crumples: 0.10, u_crumpleSize: 0.5, u_folds: 0, u_foldCount: 0, u_drops: 0,
u_image: sheet,
// speed 0, frame 0 — static. The brand does not animate its background.
```

`await u_noiseTexture.decode()` before mounting or `ShaderMount` throws.

**Do not tune these by eye — that is how both previous versions shipped wrong.**
Re-run `node tools/shader-probe.mjs` and change the table above with it.

**Still banned:** any other shader as a page background, animation, the texture
carrying the point colour, and `halftone-cmyk` — it is an image filter whose
`u_colorC/M/Y/K` inks fall outside the closed palette.

Full reasoning: `design/rounds/r2/VERDICT.md`.

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
