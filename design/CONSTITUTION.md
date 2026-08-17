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
| **D7** | **`halftone-dots` is admitted as a foreground screen.** Two colours, ink on paper, never cobalt. Amends D6's "no other shader, ever". Decided 2026-08-18. | see below |
| **D8** | **The trust band flows.** One continuous marquee, the channel band only. Narrows W6. Decided 2026-08-18. | delete the keyframes |
| **D9** | **The screen moves.** D7's `static` is lifted for the hero screen only, driven by uniforms — never by `speed`. Decided 2026-08-18. | set `motion` to `still` |
| **D10** | **The visitor can adjust the screen**, inside the measured band. Decided 2026-08-18. | remove the console |

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

**Still banned:** animation, the texture carrying the point colour, and
`halftone-cmyk` — it is an image filter whose `u_colorC/M/Y/K` inks fall outside
the closed palette. **"Any other shader as a page background" was amended by D7**;
that clause now reads *any other shader as the page's own background field*, which
`halftone-dots` is not.

Full reasoning: `design/rounds/r2/VERDICT.md`.

### D7 — `halftone-dots` as a foreground screen (2026-08-18, founder)

**This amends D6, and D6 is the layer directly under soul.md.** D6 ended with
*"Still banned: any other shader as a page background"*. The founder has ruled
`halftone-dots` in, and asked for it used **aggressively**, so the rule changes.
It is recorded here rather than resolved quietly, because a founder decision that
overrides a written rule is exactly the thing this file exists to keep visible.

**What is not in tension.** `halftone-cmyk` stays banned and D7 does not touch it.
Its ban was never about halftoning — it was about `u_colorC/M/Y/K`, four inks that
are not in the closed palette. `halftone-dots` has exactly **two** colour slots,
`u_colorFront` and `u_colorBack`, so it can be driven entirely from
`--sc-content` and `--sc-surface`. A two-colour screen is inside the palette by
construction. That is the whole reason this one can be admitted and that one
cannot.

**What D7 permits.** `halftone-dots` as a **foreground object** — a panel, a
band, a tile, a hero plate. It screens a picture; it is content, not wallpaper.

**What D7 does not permit**, and these are the parts that keep S1 and D6 intact:

| | |
|---|---|
| Never `--sc-action` | The screen may not carry cobalt in either colour slot. Cobalt marks the one required action; a field of cobalt dots spends the point colour on decoration and breaks S1 in the most literal way available. |
| Never red or yellow | W2 — status only. |
| Never the page's background field | The sheet stays `--sc-surface` + the D6 paper texture + the 76px grid. D7 puts screens **on** the sheet; it does not replace it. |
| Static | `speed 0`, `frame 0`. O4: the brand never dissolves. |
| `u_grainOverlay: 0` | Measured below: at 0.4 it moves fidelity by nothing (0.982 either way) and it mixes the output toward `vec3(step(0., v))` — pure black and pure white speckle, which is neither token. A knob that costs palette compliance and buys nothing measurable is off. |

#### The measurement

`node tools/halftone-probe.mjs` (with `bash tools/serve.sh 4173 &` running). Ink
`#24292c` on paper `#f1f1ec`, an 880x495 plate, against
`public/frames/frame-hero.png`.

A halftone fails differently from a paper texture, so D6's grain/dMean pair does
not apply. A screen is a **reproduction**, and it has three failure modes:

- **FLOODED** — `coverage` climbs past ~0.5, dots merge, the panel becomes a solid
  ink block. This is r2's rejected failure in new clothes: a large dark rectangle
  on a warm sheet reads as a foreign object whatever drew it.
- **WASHED** — `coverage` under ~0.12. Speckled paper, not a picture.
- **DESTROYED** — the ink is on the page and the picture is not. `fidelity` is the
  signed Pearson correlation between the screened output and the same source
  rendered flat through the same pipeline, both reduced to tiles. Floor 0.9.

| setting | u_size | radius | contrast | type | coverage | grain | fidelity | |
|---|---|---|---|---|---|---|---|---|
| poster, `u_inverted: true` | 0.62 | 1.0 | 0.5 | classic | 0.251 | 24.21 | **−0.975** | **INVERTED** |
| fine (newsprint) | 0.20 | 1.0 | 0.5 | classic | 0.405 | 36.72 | 0.984 | ok |
| medium | 0.35 | 1.0 | 0.5 | classic | 0.380 | 38.86 | 0.982 | ok |
| coarse | 0.50 | 1.0 | 0.5 | classic | 0.367 | 36.22 | 0.981 | ok |
| poster | 0.62 | 1.0 | 0.5 | classic | 0.360 | 31.35 | 0.979 | ok |
| billboard | 0.75 | 1.0 | 0.5 | classic | 0.350 | 23.91 | 0.980 | ok |
| billboard+ | 0.88 | 1.0 | 0.5 | classic | 0.350 | 14.13 | 0.963 | ok |
| radius 1.3 | 0.50 | 1.3 | 0.5 | classic | **0.544** | 20.44 | 0.982 | **FLOODED** |
| radius 0.7 | 0.50 | 0.7 | 0.5 | classic | 0.162 | 33.36 | 0.981 | ok |
| contrast 0.25 | 0.50 | 1.0 | 0.25 | classic | 0.232 | 44.11 | 0.991 | ok |
| contrast 0.8 | 0.50 | 1.0 | 0.8 | classic | 0.444 | 30.03 | 0.967 | ok |
| hex grid | 0.50 | 1.0 | 0.5 | classic hex | 0.354 | 33.82 | 0.981 | ok |
| soft | 0.50 | 1.0 | 0.5 | soft | **0.526** | 12.81 | 0.980 | **FLOODED** |
| gooey | 0.50 | 1.0 | 0.5 | gooey | **0.538** | 12.74 | 0.962 | **FLOODED** |
| holes | 0.50 | 1.0 | 0.5 | holes | **0.554** | 25.17 | 0.946 | **FLOODED** |
| `u_grainOverlay: 0.4` | 0.50 | 1.0 | 0.5 | classic | 0.383 | 37.22 | 0.980 | no measurable gain |

**The first row is the reason this table exists.** Every setting in the probe's
first run scored about **−0.97** — a near-perfect reproduction, upside down. In
the shader a dot's radius grows as sampled luminance *falls*, so `u_inverted`,
which reads like the switch that gives you a positive image, is the switch that
gives you a negative one. On an abstract test frame a tonal inversion looks
completely fine. Nobody would have caught it by eye, and the sign of a correlation
catches it instantly. This is the same class of error as D6's dead `u_image`, and
it is the second time a paper-shaders uniform has meant the opposite of what its
name suggests.

#### `u_size` is not a setting. Cell pitch is.

`u_size` sets a dot COUNT across the image box — `cellsPerSide = mix(300., 7.,
pow(u_size, .7))`, halved for `classic` — so **the same value is a different
design in a different sized box.** Held at 0.60 and varying nothing but the box
(`node tools/halftone-probe.mjs --box`):

| box | cell pitch | coverage | mean | fidelity | |
|---|---|---|---|---|---|
| 880x495 | 10.4px | 0.359 | 168.5 | 0.980 | ok |
| 640x360 | 7.6px | 0.370 | 166.9 | 0.981 | ok |
| 480x270 | 5.7px | 0.387 | 164.4 | 0.983 | ok |
| 360x203 | 4.3px | 0.427 | 159.9 | 0.984 | ok |
| 280x158 | 3.3px | 0.478 | 153.4 | 0.985 | ok |
| 220x124 | 2.6px | **0.513** | 145.6 | 0.986 | **FLOODED** |
| 176x99 | 2.1px | **0.541** | 138.3 | 0.974 | **FLOODED** |

One setting, a photograph at the top of the table and a mud slick at the bottom.
The cause is in `getCircle`: `float aa = fwidth(d)` — a **screen-space** derivative
— so a dot's soft edge is a fixed number of pixels wide however small the cell
gets. Shrink the cell and the edge is most of the dot, every dot bleeds, and the
panel darkens.

Hold the **pitch** instead and the boxes agree (`--pitch`):

| pitch | u_size @880 | coverage @880 | u_size @176 | coverage @176 | grain @176 |
|---|---|---|---|---|---|
| 4px | 0.086 | 0.461 | 0.799 | 0.460 | **2.79** |
| 6px | 0.331 | 0.381 | 0.876 | 0.384 | 37.70 |
| 8px | 0.484 | 0.394 | 0.915 | 0.398 | 29.15 |
| 12px | 0.653 | 0.373 | 0.954 | 0.374 | 25.93 |
| 16px | 0.744 | 0.349 | 0.974 | 0.357 | 22.47 |
| 24px | 0.837 | 0.353 | 0.994 | 0.372 | fidelity **0.803** |

Coverage matches to within 0.008 across a 5x difference in box size. **Pitch is the
honest unit**, and it is what `<Halftone>` takes; `u_size` is derived from the
element's measured height and recomputed on resize.

Two floors fall out of that table, and they bound from opposite ends:

- **Pitch ≥ 6px.** At 4px the ink is still there (coverage 0.46) and the dots are
  not — grain 2.79 against 37.70 at 6px. The screen has become flat tone.
- **At least 8 cells down the box.** The 176px tile at a 24px pitch is four cells
  tall and scores fidelity 0.803: ink on the page, picture gone.

Together they mean a screen shorter than about **80px** cannot be one, and the
usable pitch ceiling for any box is `height / 8`.

#### A note on how two of these tables were wrong first

Both mistakes are recorded because both would have been invisible in review.

1. **The two runs were different crops.** `u_fit` is cover, so a canvas of a
   different aspect screens a different part of the source, and a crop that lands
   on the bright half of the frame genuinely has less ink in it. Comparing a
   900x560 plate against a 176x99 tile was not comparing settings.
2. **Chrome would not make the window small.** `--window-size=176,99` does not
   give a 176x99 viewport; it gives the minimum, renders across all of it, and
   screenshots the top-left corner. Every small-box number produced that way was
   a crop of a large render, and it read as a clean finding — coverage appearing
   to collapse below 480px, which looks exactly like an antialiasing cliff and is
   the opposite of the real effect. The probe now sizes the **element**, keeps the
   window comfortable, and crops to the element.

#### Mandated settings

```js
u_colorFront: col(token('--sc-content')),   // ink — the dots
u_colorBack:  col(token('--sc-surface')),   // paper — the sheet behind them
u_type: 0,            // classic. soft, gooey and holes all flood at radius 1.0
u_grid: 0,            // square. hex is permitted; it measures the same
u_inverted: false,    // MEASURED, not guessed — true reverses the tone
u_radius: 1.0,        // hard ceiling. 1.3 floods
u_contrast: 0.5,
u_grainMixer: 0, u_grainOverlay: 0, u_grainSize: 0.5,
u_fit: 2,             // cover — a screen is a crop, never a letterbox
u_image: <a decoded HTMLImageElement>,   // REQUIRED, same as D6
u_size: derived from the element's height and the chosen pitch — never written
// speed 0, frame 0 — static
```

**The one free variable is the cell pitch, in CSS pixels. Permitted band 6–32px,
and never coarser than the box height over 8.** Do not set `u_size` by hand and do
not tune any of this by eye: change the sweep in `tools/halftone-probe.mjs`,
re-run it, and replace the tables above with the numbers it prints.



### D8 — the trust band flows (2026-08-18, founder)

**W6 does not cover this, and pretending it did would be the dishonest move.** W6
says motion is 120–200ms `ease` and entrances 300–520ms. Those are *transitions* —
a thing changing state. A marquee is a third category: continuous, stateless, and
by construction longer than 200ms. The founder asked for the partner band to flow.
Rather than stretch W6 until it means nothing, D8 admits the exception and fences
it.

**Permitted:** exactly one continuous loop, on the **channel trust band only**.
`linear`, `infinite`, no easing, no fade, no parallax, no scroll-driven animation.

**Required, all four:**

1. `prefers-reduced-motion` kills it. Already global in `globals.css`.
2. **Stopped, the band is still complete** — the rail scrolls, so a paused or
   motion-reduced visitor can reach every channel. A marquee that is unreadable
   when stopped is an accessibility failure with a design on top.
3. **Hover and focus pause it.** Every tile is a link, and an infinitely moving
   link is a target you have to chase.
4. The duplicated run is `aria-hidden`. It exists to hide the seam, not to
   announce five channels ten times.

**Not permitted:** a second marquee anywhere, motion on any other band, and the
band carrying cobalt. It is a row of monochrome screens; the point colour stays on
the one action.

**What reverses it:** delete the keyframes. The band becomes a static row and
nothing else on the page depends on the movement.

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

### D9 — the screen moves (2026-08-18, founder)

**D7 said `static`, and this lifts it.** Founder: *"I want you to use that shader
to animate that effect."* The static rule came from O4 — the brand never
dissolves — and from D6's ban on an animated background. D9 keeps the reason and
narrows the rule: the **hero screen** may move; the paper sheet under it, the 76px
grid and every other surface stay still.

#### `u_time` is dead in this shader. Animating with `speed` renders nothing.

This is the one thing about D9 that has to be read before anything is built.

`halftone-dots` declares `uniform float u_time` and **never reads it in
`main()`**. `ShaderMount` faithfully advances it and uploads it every frame, so
`speed: 1` produces a `requestAnimationFrame` loop that runs forever, on every
visitor's battery, drawing the identical picture.

Measured, with a positive control so the harness is known to be able to see a
difference at all:

| render | sha256 |
|---|---|
| `speed 1, frame 0` | `fdc436b8…` |
| `speed 1, frame 2000` | `fdc436b8…` |
| `speed 1, frame 8000` | `fdc436b8…` |
| `speed 0, u_size 0.50` | `fdc436b8…` |
| `speed 0, u_size 0.55` | `4a1bfdec…` |

Three different times are **byte-identical**, and identical to the still frame; a
0.05 change in `u_size` is not. So the difference is visible to the measurement
and absent from time.

**This is the third dead uniform in this library.** D6's `u_image` made the paper
fibre render nothing at any setting. D7's `u_inverted` means the opposite of what
its name says. Now `u_time`. The rule this repo should carry away is not about any
one of them: **assume no paper-shaders uniform does what it is called until a
render proves it.**

#### So animation is driven from our own loop

`ShaderMount` stays at `speed 0` — which also means it schedules no frames of its
own — and `setUniforms` is called from one `requestAnimationFrame` loop.
`setUniforms` calls `render()` synchronously, so one write is one frame. Only
uniforms the shader actually reads may be animated: `u_offsetX`, `u_offsetY`,
`u_size`, `u_scale`, `u_contrast`, `u_rotation`.

**Required:**

1. **`prefers-reduced-motion` stops the loop dead** — not slows it. The screen
   holds its frame, which is a complete design. Watched live, not read once.
2. **`document.hidden` stops it.** At `speed 0` the vendor's own visibility pause
   never fires, so this is ours to do.
3. **A loop point is a hard cut, never an ease back.** O4 survives D9 intact: the
   `playhead` pan resets, and the `cut` mode swaps its source image on a frame
   boundary. Nothing crossfades.
4. **One moving screen per page.** The trust band's marquee (D8) is the only other
   motion allowed, and no page may add a third.

#### D10 — the visitor can adjust the screen (2026-08-18, founder)

Founder: *"there is farriers parameters for effect so on the user website user
could adjust parameters to use that effect funny or interestingly… if I can adjust
the background effect of that page it might be better page for users."*

This sits oddly next to D6 and D7's central rule — *do not tune by eye* — and the
resolution is that the two apply to different people. **We** may not choose
settings by eye; the numbers in D7 are how the defaults were picked. A **visitor**
is not choosing our defaults, they are playing with ours.

What makes that safe is that **every control is clamped to a range that measured
inside the band**:

| control | range | why it stops there |
|---|---|---|
| dot pitch | 6–32px | 4px measured grain 2.79 — flat tone, no dots left |
| contrast | 0.25–0.80 | 0.80 measured coverage 0.444, the last setting before the midtones crush |
| motion | 0–1.6 | 0 is off, and off is a legitimate choice |
| grid | square / hex | hex measured 0.333 against square's 0.341 — a real choice with no cost |
| source | raw / cut | the same waveform with its dead air removed |

`u_radius`, `u_type`, and both colour slots are **not exposed**. Radius 1.3
measured coverage 0.544 and `soft`/`gooey`/`holes` all flood; the colours are the
palette. A visitor can change how the page looks, not whether it still reads as
SudoCut, and cannot reach a setting outside the closed palette.

There is also a reason to want this beyond novelty. soul.md S7 is **expose the
criteria — reviewable, never a black box**, and it is the same instinct that puts
every cut on an editable timeline. A front page that hands over its own controls
is making that argument in the only way a landing page can.

**Not permitted:** a control that leaves the band, a control that touches a colour,
persisting the visitor's settings across pages (the default is the design, and the
next page starts there), and any control rendered in cobalt — the point colour
belongs to the waitlist action.
