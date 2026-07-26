# logo/

The mark is a **cut point**: two blocks of footage held apart by a single cobalt
frame line.

> **Status: RECONSTRUCTED.** These are not official vectors. They are rebuilt from
> the geometry published in the Option H exploration and recolored to the shipped
> palette. The PDF says SVG/PNG/EPS are *"on request"* — we don't have them.
> Replace these when the originals arrive. See **Q-VECTORS**.

## Geometry

```
UNIT  x = bar width ÷ 22
BAR   22x     GAP 12x     LINE 4x
WIDTH 72x     HEIGHT 88x

bar[0–22]  gap[22–34]  line[34–38]  gap[38–50]  bar[50–72]
```

Clear space **22x** on all four sides. Minimum size **16px** digital / **8mm** print.
Below 16px the cut line thickens to **2px minimum** — the mark is meaningless if
the cut disappears.

## Files

| File | Lockup | Use | Notes |
|---|---|---|---|
| `mark.svg` | 3 — mark alone | Default mark, on paper | Bars `--sc-ink`, line `--sc-accent`, with hex fallbacks |
| `mark-mono.svg` | 6 — single ink | Engraving, stamp, one-color print, or any view that already spends its one point color | `currentColor` — **inline only**, see below |
| `mark-reversed.svg` | 4 — reversed on ink | Dark surfaces | Paper bars, cobalt line |
| `mark-on-accent.svg` | 5 — on cobalt | Social avatar, cobalt panels | Paper bars, **line inverts to ink** — a cobalt line would vanish |
| `favicon.svg` | 3 — mark alone | Favicon, avatar, app icon | Square 88×88 field; cut line thickened to 6 units so it survives at 16px |
| `lockup-horizontal.svg` | 1 — primary | Default lockup | Mark + wordmark + tagline |
| `lockup-stacked.svg` | 2 — stacked | Narrow columns, mobile headers | Mark centred over wordmark |

All six approved lockups now exist as files.

## ⚠️ `currentColor` does not survive `<img>`

An SVG referenced via `<img src>`, a CSS `background-image`, or `og:image` is an
**isolated document**. It inherits nothing from your page — so `currentColor`
resolves to black and `var(--sc-*)` resolves to the hex fallback baked into the file.

Practical consequence:

- **Inlining into the DOM** → `mark-mono.svg` adapts to its surroundings. Use it.
- **`<img>` / background / og:image** → use the explicit file for the surface:
  `mark.svg` on paper, `mark-reversed.svg` on ink, `mark-on-accent.svg` on cobalt.

This is why 4 and 5 are real files instead of "just recolors." Verified by
rendering each on its intended background.

## Wordmark

Lowercase `sudocut`, Jost 400, tight. `sudo` in ink, `cut` in cobalt — the color
break lands exactly where the product name does.

> ⚠️ The lockup SVGs use live `<text>`, so they render correctly only where Jost
> is available. **Convert to outlined paths before sending anywhere outside our
> own surfaces** (press kits, partner decks, print).

## Misuse

1. Never skew or rotate.
2. Never recolor outside the palette.
3. No shadows on the mark, no rounded corners.
4. Never crowd the clear space.

The mark is one object. It is never outlined, gradient-filled, or animated per bar.
The cut line stays centred — it never moves, tilts, or changes weight ratio.

**When in doubt, use `mark-mono.svg`. It is always correct.**
