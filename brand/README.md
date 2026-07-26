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

## Decided 2026-07-26

The five open questions are resolved at their recommended values so work isn't
blocked. All five are judgement calls, and all five are cheap to reverse.

| ID | Decision | Reverse by |
|---|---|---|
| **Q-RADIUS** | `radius: 0` + hard offset shadows | editing `--sc-radius` |
| **Q-DISPLAY-FACE** | Hahmlet for display | editing `--sc-heavy` |
| **Q-MARK** | Adopt the cut-point mark | deleting `logo/` |
| **Q-PARCHMENT** | Warm paper + 76px grid, no raster texture | adding one `background-image` |
| **Q-VECTORS** | Ship the reconstructed vectors | dropping in official files |

Reasoning for each: [`BRAND-KIT.md` §14](./BRAND-KIT.md#14-resolved--2026-07-26).

**Still wanted from the founder:** the official SVG/EPS for the mark. Ours are
reconstructed from published measurements — exact, but not the originals.
