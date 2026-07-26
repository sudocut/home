# Standing brief

Handed to every model, every round, verbatim. The round's own `BRIEF.md` is
appended after this and says *what to design*. This file says *who we are and
what the rules are*.

---

## 1. What SudoCut is

We take long, raw footage and hand back a cut worth keeping.

Every long-form creator does the same low-value chore by hand: cutting dead air —
fillers, fumbles, silences, tangents, NG takes. It's slow, repetitive, and nobody's
creativity lives there. So we `sudo rm` it. AI strips the boring 80%. The last 20%
— the creative control — stays with the creator.

We shipped a hand-edited cut and an AI-edited cut side by side. Viewers couldn't
tell the difference. That evidence is why SudoCut is a product and not a pitch.

We export editor-ready FCPXML/SRT so creators finish in their own tools. **AI
proposes; humans decide.**

**For:** long-form spoken-video creators drowning in raw footage — solo YouTubers,
podcast and interview editors, lecture makers, talk-heavy streamers. Korea first.

**Not for:** anyone wanting a maximalist do-everything suite, or a one-button
machine that ships a finished film with no human in the loop.

## 2. What you are designing

**The company website** — `sudocut/home`. Who we are, why we exist, the proof.
This is **not** the product app and **not** a feature tour. Someone landing here
should understand what we believe within one screen.

## 3. Non-negotiable rules

Full list in `design/CONSTITUTION.md`. The ones that get variants rejected:

1. **One point color.** Cobalt `#1f55ff` marks the single required action —
   **at most once per viewport**. Everything else is monochrome. Two cobalt
   objects is a rejection, not a style.
2. **Palette is closed.** ink `#24292c` · paper `#f1f1ec` · panel `#fbfaf5` ·
   cobalt `#1f55ff` · red `#ff3b2f` · yellow `#ffd523` · greys `#656b6f` `#666c70`.
   Red and yellow are **status only** — do not use them decoratively.
3. **Three typefaces only.** Hahmlet (display) · SUIT (UI/Korean) · Jost (numerals).
   Plus the system mono stack. No IBM Plex, no Inter, no Google Fonts import.
4. **`border-radius: 0`.** No rounded corners, except `50%` circles.
5. **Shadows are hard offset, zero blur.** `6px 6px 0 #000`, `9px 9px 0` on hover.
   **Never** a blur radius. Never a glow. `box-shadow: 0 4px 12px rgba(...)` is a rejection.
6. **No decorative gradients.** Gradients are permitted only to draw the 76px
   hairline grid.
7. **Motion 120–200ms `ease`.** Honour `prefers-reduced-motion`.
8. **Korean-first.** Korean copy primary, English secondary or parallel.
9. **Subtract by default.** If removing something improves the page, remove it.

## 4. Output contract

Write **one complete HTML document** and print it to stdout. Nothing else — no
explanation, no commentary, no markdown fences around it. Start at `<!DOCTYPE html>`
and end at `</html>`.

**You must link the token stylesheet and use only its variables:**

```html
<link rel="stylesheet" href="/brand/tokens/tokens.css">
```

Then reference tokens — never literals:

```css
color: var(--sc-content);          /* not #24292c */
background: var(--sc-surface);     /* not #f1f1ec */
font-family: var(--sc-heavy);      /* not "Hahmlet" */
box-shadow: var(--sc-shadow-action);
border-radius: var(--sc-radius);
```

Available: `--sc-surface` `--sc-surface-raised` `--sc-content` `--sc-content-muted`
`--sc-rule` `--sc-action` `--sc-action-content` `--sc-shadow-action`
`--sc-shadow-action-hover` `--sc-lift` `--sc-status-error` `--sc-status-warning`
`--sc-heavy` `--sc-body` `--sc-numbers` `--sc-mono` `--sc-radius` `--sc-fast`
`--sc-ease` `--sc-hover` `--sc-grid-size` `--sc-measure`

Fonts are served from `/fonts/` and declared by the token stylesheet. Do **not**
add `@font-face` or a Google Fonts `<link>`.

**Constraints:** self-contained single file. No JS frameworks, no CDN, no build
step, no external images. Inline `<style>` is fine. A little vanilla JS is fine if
it earns its place. Assume it is opened at 1280×800 inside an iframe, and must not
break at 390px.

`tools/verify-round.mjs` mechanically checks rules 1–7. Run it before ranking.

## 4b. The paper texture shader (optional, vendored locally)

soul.md asks for *watercolor-paper / oriental parchment (양피지)* warmth. The
shipped system only approximates it with a warm flat colour plus a 76px grid.
[Paper Shaders](https://github.com/paper-design/shaders) is vendored in this repo
at `design/vendor/paper-shaders/` — no CDN, no install, works offline — and its
`paperTexture` shader renders real paper fibre. **Verified rendering on this
machine at 900×420.**

```html
<div id="bg" style="position:fixed;inset:0;z-index:-1"></div>
<script type="module">
  import { ShaderMount } from '/design/vendor/paper-shaders/shader-mount.js';
  import { paperTextureFragmentShader } from '/design/vendor/paper-shaders/shaders/paper-texture.js';
  import { getShaderColorFromString } from '/design/vendor/paper-shaders/get-shader-color-from-string.js';
  import { getShaderNoiseTexture } from '/design/vendor/paper-shaders/get-shader-noise-texture.js';

  const u = {
    u_colorFront: getShaderColorFromString('#24292c'),   // fibre — ink
    u_colorBack:  getShaderColorFromString('#f1f1ec'),   // sheet — paper
    u_contrast: 0.12, u_roughness: 0.25, u_fiber: 0.45, u_fiberSize: 0.6,
    u_crumples: 0.15, u_crumpleSize: 0.5, u_folds: 0, u_foldCount: 0,
    u_drops: 0, u_seed: 3, u_fade: 0,
    u_noiseTexture: getShaderNoiseTexture(),
    u_scale: 1, u_rotation: 0, u_offsetX: 0, u_offsetY: 0,
    u_originX: 0.5, u_originY: 0.5, u_worldWidth: 0, u_worldHeight: 0, u_fit: 0,
  };
  await u.u_noiseTexture.decode();          // REQUIRED — mounting before the
  new ShaderMount(document.getElementById('bg'),  // noise image decodes throws
                  paperTextureFragmentShader, u, undefined, 0, 0);
</script>
```

**Rules if you use it.** Speed `0` — a *static* texture; the brand does not
animate its background. Only palette colours in `u_colorFront`/`u_colorBack`.
Keep it faint: it is the paper the content sits on, not a feature. If it competes
with the type for attention, you have turned it up too far — the values above are
already near the ceiling. It must never carry the point colour.

**Using it is optional and it is being tested this round** — a variant without it
is a legitimate answer, and "the flat colour was enough" is a legitimate finding.
Other shaders exist in `design/vendor/paper-shaders/shaders/` (`grain-gradient`,
`dithering`, `halftone-dots`, …) but anything that reads as a decorative gradient
violates rule 6. `paperTexture` is the one with a mandate behind it.

## 4c. Moodboard

34 reference images the team collected live in `design/moodboard/`, with the
per-image accents recorded in `design/moodboard/SOURCE.md`. Board direction, in
their own words: *"minimal, generous whitespace, single accent color."*

What the recorded accents actually show: the base is overwhelmingly **near-white
and off-white** (`#f8f8f8`, `#f3f3f3`, `#efefef`, `#ece8e5`), with a warm
**taupe/parchment** family recurring (`#cec4bc`, `#d6c5b5`, `#d2d1cf`, `#725d45`)
and **near-black** as the contrast note (`#2d3039`, `#222223`). Cool slate-greys
(`#a1aab1`, `#bbc4cb`) appear but never dominate. Almost nothing is saturated.

Read that as a brief for **rhythm, not palette** — our palette is already fixed.
It says: large quiet fields, type carrying the page, one dark anchor, warmth in
the neutrals rather than a colour. The images are for the human judge to compare
against; you are being handed their distilled direction.

## 5. Voice

> **Say it, then stop.**

**We write** — "Four hours of footage. One story. Ninety seconds of work." ·
"Trimmed 6:12. Nothing you wanted is gone." · "Cut it shorter."

**We don't** — ~~"Revolutionize your creative workflow with AI-powered magic."~~ ·
~~"Unlock the full potential of your content journey."~~

`DIRECT` · `NUMERIC` · `EDITOR TO EDITOR` · `NEVER PRECIOUS` · `SHORTER THAN YOU THINK`

Numbers are the argument. Say **6:12**, not "significant time savings." Say
**14:32 → 10:47**, not "dramatically shorter." If a sentence has no number, ask
whether it needs to exist.

Korean register: `-습니다`/`-예요`, not `-하십시오`. Numerals stay numerals. Avoid
외래어 padding (솔루션, 플랫폼, 최적화 are usually deletable).

Positioning line: `sudo rm the boring parts.`
Secondary English line: "Less footage. More story."

## 6. How you will be judged

A human ranks variants **blind** — they will not know which model produced which.
Five criteria, 1–5 each:

| Criterion | Question |
|---|---|
| **clarity** | Does a first-time visitor understand what SudoCut does within one screen? |
| **hierarchy** | Is there exactly one required action, and does it read first? |
| **voice** | Direct, numeric, editor-to-editor? Or does it drift into hype? |
| **restraint** | Would removing anything improve it? Does every element earn its place? |
| **proof** | Does it show evidence rather than claim capability? |

Design for a judge who will spend thirty seconds on the first impression and then
look hard for a reason to reject it.
