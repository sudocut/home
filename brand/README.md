# brand/

The SudoCut brand system. **This is the only place brand values enter the codebase.**

## Authority order

1. `meta/strategy/soul.md` — the constitution. Never overridden.
2. `sudocut/web` shipped Round 6 (`design/mockups/shared/bauhaus.css`, `body[data-round="6"]`) — the visual system of record.
3. `brand/reference/option-h-exploration-2026-07.pdf` — an exploration. Ideas, not values.

A lower layer never overrides a higher one.

## What's here

| File | What it is |
|---|---|
| [`BRAND-KIT.md`](./BRAND-KIT.md) | **Start here.** The complete kit v2.0. |
| [`SUPERSEDES.md`](./SUPERSEDES.md) | Every Option H override, with reasons. Audit this. |
| [`voice.md`](./voice.md) | Tone of voice, Korean and English. |
| [`tokens/tokens.json`](./tokens/tokens.json) | Machine source of truth. Every value origin-tagged. |
| [`tokens/tokens.css`](./tokens/tokens.css) | Generated. Do not hand-edit. |
| [`logo/`](./logo/) | The mark and lockups, as SVG. |
| [`reference/`](./reference/) | The archived Option H PDF. Superseded. |

## The one rule

> Nothing outside `brand/tokens/` may declare a color, typeface, spacing, radius,
> shadow, or easing literal.

Components reference **semantic** tokens (`--sc-action`, `--sc-surface`), not raw
ones (`--sc-accent`, `--sc-paper`). That way a palette change is one file.

Derive new shades with `color-mix()` against existing tokens. Never hand-pick a
hex to mean "slightly lighter ink."

## Changing a token

```bash
$EDITOR brand/tokens/tokens.json     # edit the value, keep its origin tag honest
node tools/build-tokens.mjs          # regenerates tokens.css
node tools/verify-round.mjs          # checks nothing hardcoded a literal
```

## Outstanding from the founder

- **Q-VECTORS** — official SVG/EPS for the mark. Ours are reconstructed from
  published measurements.
- **Q-RADIUS** — `radius: 0` (app) vs `radius: 14px` (the ranking catalog's
  marketing-style surface). Which governs a company site?
- **Q-DISPLAY-FACE** — Hahmlet or Jost for display on a marketing surface?
- **Q-MARK** — adopt the cut-point mark as official?
- **Q-PARCHMENT** — is warm paper + 76px grid enough 양피지 warmth?

Full context in `docs/open-questions.md`.
