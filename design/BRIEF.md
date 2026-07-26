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
