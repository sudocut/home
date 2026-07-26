# SudoCut Brand Kit

**v2.0 · 2026-07-26** · supersedes the Option H PDF exploration

> `sudo rm the boring parts.`

---

## 0. Authority order

Read this first. It settles every future argument about where a value comes from.

| Rank | Source | Role |
|---|---|---|
| **1** | `meta/strategy/soul.md` | **The constitution.** Never overridden. Describes conviction. |
| **2** | `sudocut/web` shipped Round 6 — `design/mockups/shared/bauhaus.css` | **The visual system of record.** Six rounds of decisions, tested and selected. |
| **3** | `brand/reference/option-h-exploration-2026-07.pdf` | **An exploration.** Contributes ideas, not values. |

Rule: *a lower layer never overrides a higher one.* When Option H and the shipped
system disagree, the shipped system wins. When the shipped system and soul.md
disagree, soul.md wins.

Why this order: soul.md is the only document that states what we *believe*;
everything else is an attempt to execute it. `sudocut/web` is six rounds of
executed, reviewed, selected decisions running in real code. The PDF is one
unreviewed proposal. Recency does not outrank evidence.

---

## 1. What changed from Option H, and why

Option H was a strong exploration. Its **ideas** largely survive. Its **values**
do not, because they were invented in isolation from the codebase.

| Dimension | Option H proposed | **This kit ships** | Why |
|---|---|---|---|
| Accent | `#0D57F2` | **`#1f55ff`** | Shipped cobalt, `bauhaus.css:2702`. Already in production. |
| Ink | `#111111` | **`#24292c`** | Shipped slate. Pure black is colder than this brand. |
| Paper | `#F5F5F2` | **`#f1f1ec`** | Shipped warm paper. soul.md demands warmth, *"not a sterile text dump."* |
| Alarm | `#F5342A` as a 2nd accent | **`#ff3b2f`, demoted to a status token** | soul.md: **one** point color. Red is a system state, not brand identity. |
| Type | Jost + IBM Plex Mono, *"never more than these two"* | **Jost + SUIT + Hahmlet** | **Neither Option H face sets Hangul.** Disqualifying — see §5. |
| Shadow | *"no shadows"* | **No _blurred_ shadows** | The hard offset zero-blur shadow *is* the house signature. |
| Motion | 400ms `cubic-bezier(.85,0,.15,1)` | **120–200ms `ease`** | Shipped timings. 400ms is too slow for UI. |
| Radius | no rounded corners | **`0px`** | Agreement. Both sources concur. But see **Q-RADIUS**. |
| Tagline | "Less footage. More story." | **Secondary** | Primary is soul.md's `sudo rm the boring parts.` |

**Survives from Option H, intact and valuable:** the mark and its geometry, the
six-lockup system, the four misuse rules, the entire voice section, and the
discipline of budgeting accent by share-of-surface.

Full audit trail: [`SUPERSEDES.md`](./SUPERSEDES.md).

---

## 2. The idea

The mark is a **cut point**: two blocks of footage held apart by a single cobalt
frame line. It is `sudo rm the boring parts` rendered as geometry — the moment
of the cut, held still.

This is why the mark survived the supersession. `sudocut/web` ships a wordmark
and no mark at all, so it fills a real gap and conflicts with nothing.

Everything else follows from it: **hard edges, generous silence, one decisive accent.**

---

## 3. The mark

```
UNIT  x = bar width ÷ 22
BAR   22x     GAP 12x     LINE 4x
TOTAL WIDTH 72x   ·   HEIGHT 88x
```

Laid out across 72 units: `bar[0–22] gap[22–34] line[34–38] gap[38–50] bar[50–72]`.

- **Clear space** — 22x (one bar width) on all four sides. Nothing enters the field.
- **Minimum size** — 16px digital, 8mm print.
- **Below 16px** the cut line thickens to 2px minimum. *The mark is meaningless
  if the cut disappears* — that is the whole idea. `favicon.svg` bakes this in.

Bars are `--sc-ink`. The line is `--sc-accent`. Files in [`logo/`](./logo/).

> **Status:** reconstructed from published measurements and recolored. Not
> official vectors. See **Q-VECTORS**.

### Lockups — six approved forms

| # | Form | Use |
|---|---|---|
| 1 | **Primary — horizontal** | Default. Mark + wordmark + tagline. |
| 2 | **Stacked — centred** | Narrow columns, mobile headers, square placements. |
| 3 | **Mark alone** | Avatar, favicon, app icon. |
| 4 | **Reversed on ink** | Dark field; bars become paper, line stays cobalt. |
| 5 | **On cobalt** | Cobalt field; bars paper, line inverts to ink. |
| 6 | **Single ink** | Engraving, stamp, one-color print. Always correct. |

**Wordmark:** lowercase `sudocut`, Jost 400, tight. `sudo` in ink, `cut` in
cobalt — the color break lands exactly where the product name does.

### Misuse — four ways to break it

1. **Never skew or rotate.**
2. **Never recolor outside the palette.**
3. **No shadows on the mark, no rounded corners.**
4. **Never crowd the clear space.**

> The mark is one object. It is never outlined, gradient-filled, or animated per bar.
> The cut line stays centred. It never moves, tilts, or changes weight ratio.
> **When in doubt, use the single-ink lockup. It is always correct.**

---

## 4. Color

Source: `bauhaus.css:2694–2713`, `body[data-round="6"]` — the layer used by the
selected direction, *Bauhaus Timeline Proof*.

| Token | Value | Role |
|---|---|---|
| `--sc-ink` | `#24292c` | Type, rules, footage |
| `--sc-paper` | `#f1f1ec` | Default surface — warm |
| `--sc-panel` | `#fbfaf5` | Raised / inset panel |
| `--sc-structure` | `#656b6f` | Structural grey |
| `--sc-muted` | `#666c70` | Secondary text |
| `--sc-line` | `rgba(36,41,44,0.2)` | Hairlines, grid texture |
| **`--sc-accent`** | **`#1f55ff`** | **The one point color** |
| `--sc-accent-ink` | `#ffffff` | Text on cobalt |
| `--sc-signal-red` | `#ff3b2f` | **Status only** — error / destructive |
| `--sc-signal-yellow` | `#ffd523` | **Status only** — warning / in-progress |
| `--sc-primary-shadow` | `#000000` | The hard offset shadow |
| rail ramp | `#e5e6e3` `#d4d6d4` `#c9ccca` `#676e72` | Deliberately non-competitive |

### The one-point-color law

> soul.md: *"One point of color marks the required action; everything else stays
> monochrome."* · *"Every flow ends in one button."*

Concretely, per viewport:

- **Cobalt appears at most once**, on the single required action.
- Two cobalt objects in one view is a **bug**, not a style choice.
- Red and yellow are **status semantics**. They report machine state. They are
  never decoration and never a second brand color.
- Everything else is monochrome.

**Budget** (adapted from Option H's ratio discipline, recomputed for this
palette): roughly **paper 60 / ink 28 / structure+rail 9 / accent 3**. If cobalt
is measurably more than a few percent of the pixels, something else is competing
with the one thing that matters.

### Warmth is mandatory

soul.md calls for *watercolor-paper / oriental parchment (양피지)* — content-first,
*"but with warmth, not a sterile text dump."*

In the shipped system that warmth is delivered by **paper color + a 76px hairline
grid**, not by a raster texture. See §9 and **Q-PARCHMENT**.

---

## 5. Type

Three SIL OFL variable faces, self-hosted. Three **semantic roles**.

| Face | File | Carries | Role |
|---|---|---|---|
| **Hahmlet** | `Hahmlet-Variable.ttf` | Latin + Hangul | `--sc-heavy` — display |
| **SUIT** | `SUIT-Variable.woff2` | Latin + Hangul | `--sc-body` — UI + Korean |
| **Jost** | `Jost-Variable.ttf` | Latin | `--sc-numbers` — numerals |

Mono role is the system stack: `ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace`.

### Why IBM Plex Mono was dropped

Option H mandated *"Jost + IBM Plex Mono. Never more than these two."*

**Neither face sets Hangul.** soul.md mandates Korean-first (*"Korean-first is our
home, English in parallel"*). A typographic system that cannot render the primary
language is disqualified on capability, not taste. SUIT and Hahmlet both carry
Hangul, both are SIL OFL, and both are already vendored in `sudocut/web`.

### Variable weights

```
450 520 560 590 600 620 640 650 660 670 680
690 700 720 730 750 760 780 790 800 900
```

Base body weight is **450**. These non-round weights are the house voice — do not
round them to 400/700. Variable fonts make this free.

Root scale: `html { font-size: calc(16px * var(--sc-type)) }`.
Micro/label: mono, `0.61rem`, `letter-spacing: 0.1em`, uppercase.
Use `font-variant-numeric: tabular-nums` for all data and timecode.

> **Honest caveat.** `bauhaus.css:77` statically sets `--heavy` to *Jost*.
> *Hahmlet* is applied at runtime by the Font Lab via `data-default-display` on
> the selected variant. So the selected default is Hahmlet, but it was never
> frozen into CSS. This kit freezes it. See **Q-DISPLAY-FACE**.

---

## 6. Geometry

- **`--sc-radius: 0px`.** No rounded corners, except `50%` circles. Option H's
  misuse rules independently agree.
- Hairline `1px solid var(--sc-line)` — dividers.
- Structural `2px solid var(--sc-ink)` · heavy `3px solid var(--sc-primary-shadow)`.
- Colored top-edge bars `8px` on panels, `9px` on modals.
- Spacing is `calc(Npx * var(--sc-density))`.
- Focus: `:focus-visible { outline: 3px solid var(--sc-ink); outline-offset: 3px }`.

---

## 7. Shadow law

**Always hard offset. Zero blur. Zero spread.** This is the signature.

```css
box-shadow: 6px 6px 0 var(--sc-primary-shadow);   /* action at rest  */
box-shadow: 9px 9px 0 var(--sc-primary-shadow);   /* action on hover */
transform: translate(-2px, -2px);                  /* paired lift     */
```

Offsets in use: 3 4 5 6 7 8 9 10 12 13 14px.

Option H said *"no shadows."* That is wrong for this brand — it was reacting to
soft Material-style elevation. The correct rule: **no _blurred_ shadows, no glow,
no spread.** A solid offset is not elevation, it is a printed second impression.

---

## 8. Motion

- Transitions **120–200ms `ease`** (140ms is the house default).
- Entrances **300–520ms** on `cubic-bezier(0.16, 0.78, 0.22, 1)`.
- Stagger ladder **32–35ms** per row.
- **Transitions between scenes are hard cuts. The brand never dissolves.**
  *(Option H's principle — kept. Only its 400ms number was superseded.)*
- `prefers-reduced-motion: reduce` kills **all** animation and transition
  globally. Non-negotiable.

---

## 9. Texture

```css
background-image:
  linear-gradient(var(--sc-line) 1px, transparent 1px),
  linear-gradient(90deg, var(--sc-line) 1px, transparent 1px);
background-size: 76px 76px;
```

A 76px hairline graph-paper grid. Together with the warm paper color this is how
양피지 warmth is implemented today — there is **no raster paper texture** in the
shipped system. Gradients are permitted **only** for this. Never decorative.

---

## 10. Deriving colors

The shipped system tints with `color-mix`, never with new hex values:

```css
color-mix(in srgb, var(--sc-ink) 5%, transparent)        /* row hover      */
color-mix(in srgb, var(--sc-paper) 94%, transparent)     /* sticky topbar  */
color-mix(in srgb, var(--sc-accent) 18%, var(--sc-panel))/* selected card  */
```

**Rule:** a derived color is *computed* from a token. Never hand-pick a hex to
mean "slightly lighter ink" — that is how palettes rot.

---

## 11. Component idioms

```css
/* PRIMARY ACTION — the one cobalt object in the view */
.action {
  background: var(--sc-action);
  color: var(--sc-action-content);
  border-color: var(--sc-action-shadow);
  box-shadow: var(--sc-shadow-action);
}
.action:hover { box-shadow: var(--sc-shadow-action-hover); transform: var(--sc-lift); }

/* SECONDARY — monochrome, quiet */
.action-secondary { min-height: 52px; border: 1px solid var(--sc-ink); font-weight: 800; }

/* QUIET BUTTON — invert on hover. The house idiom. */
.quiet:hover { background: var(--sc-ink); color: var(--sc-paper); }
```

Keep the runtime contrast guard from `bauhaus.js`: `--sc-accent-ink` is
recomputed to `#000` or `#fff` from accent luminance, so a future accent change
cannot silently produce unreadable text.

---

## 12. Voice

> **Say it, then stop.**

**We write**

- "Four hours of footage. One story. Ninety seconds of work."
- "Trimmed 6:12. Nothing you wanted is gone."
- "Cut it shorter."

**We don't**

- ~~"Revolutionize your creative workflow with AI-powered magic."~~
- ~~"Unlock the full potential of your content journey."~~
- ~~"Effortlessly seamless. Seamlessly effortless."~~

`DIRECT` · `NUMERIC` · `EDITOR TO EDITOR` · `NEVER PRECIOUS` · `SHORTER THAN YOU THINK`

This section survives Option H **intact** — it is a direct expression of soul.md's
*"Honesty over polish. No hype."* Korean register and examples: [`voice.md`](./voice.md).

Primary line: `sudo rm the boring parts.`
Secondary English marketing line: "Less footage. More story."

---

## 13. Accessibility

- Focus ring `3px solid var(--sc-ink)`, offset `3px`. Never removed.
- `prefers-reduced-motion` — global kill switch.
- `prefers-contrast: more` — ink darkens to `#172128`, line to `rgba(23,33,40,0.42)`.
- Touch targets ≥ 44px.
- Cobalt `#1f55ff` on paper `#f1f1ec` — verify ≥ 4.5:1 for any text use.
  It is intended for **fills**, with white text on top.
- Never signal with color alone: red and yellow always carry a label or icon.

---

## 14. Resolved — 2026-07-26

These five were open. They are now **decided at the recommended value** so work is
not blocked. Each is a judgement call, not a fact; all five are cheap to reverse
because every one routes through a single token or file. Revisit any of them by
editing the value and re-running `node tools/build-tokens.mjs`.

| ID | Decision | Reasoning | Cost to reverse |
|---|---|---|---|
| **Q-RADIUS** | **`radius: 0`, hard offset shadows** | The square corner + solid offset *is* the brand signature, and Option H's misuse rules independently agree. The ranking catalog's `14px` was an internal-tool convenience, not a brand decision — it was never reviewed as one. A company site is the brand's front door and should carry the signature, not the convenience. | One token: `--sc-radius` |
| **Q-DISPLAY-FACE** | **Hahmlet for display** | Family continuity with the selected Round 6 direction. Hahmlet also sets Hangul, so Korean and Latin headlines share one face — Jost display would force a face swap mid-headline on a Korean-first site. | One token: `--sc-heavy` |
| **Q-MARK** | **Adopt the cut-point mark** | It is `sudo rm the boring parts` rendered as geometry, and `sudocut/web` ships no mark at all, so it is purely additive — nothing is displaced. Strongest idea in the Option H exploration. | Delete `logo/`, revert to wordmark |
| **Q-PARCHMENT** | **Warm paper + 76px grid. No raster texture.** | This is what the shipped system already does, and soul.md's warmth mandate is satisfied by `#f1f1ec` plus the hairline grid. A raster paper texture would be decoration — and soul.md says subtract by default. | Add one `background-image` |
| **Q-VECTORS** | **Ship the reconstructed vectors** | Geometry is fully specified, so the reconstruction is exact rather than approximate. Verified arithmetically (22+12+4+12+22 = 72) and by rendering. | Drop in official files |

> **Standing request:** if the official SVG/EPS ever arrive, replace `logo/*.svg`
> and delete the "reconstructed" notes. Nothing else changes — the geometry is
> already correct.

---

## Files

```
brand/
├── BRAND-KIT.md          this document
├── SUPERSEDES.md         audit trail of every Option H override
├── voice.md              tone of voice, ko + en
├── tokens/
│   ├── tokens.json       machine source of truth, every value origin-tagged
│   ├── tokens.css        generated — do not hand-edit
│   └── README.md
├── logo/                 all six approved lockups
│   ├── mark.svg          the cut point, on paper
│   ├── mark-reversed.svg on ink — paper bars, cobalt line
│   ├── mark-on-accent.svg on cobalt — line inverts to ink
│   ├── mark-mono.svg     single ink — always correct (inline only)
│   ├── favicon.svg       square field, thickened cut line
│   ├── lockup-horizontal.svg
│   ├── lockup-stacked.svg
│   └── README.md
└── reference/
    └── option-h-exploration-2026-07.pdf    archived, superseded
```
