# Supersession audit — Option H → Brand Kit v2.0

**Date:** 2026-07-26

The founder delivered a brand kit PDF ("Option H — The Cut Point", 2026.07), then
ruled that it is *"just samples"* and ranks **below** the existing repositories:

> soul.md > sudocut/web > the PDF. The most prior resource is soul.md.

This file records every override so the decisions can be audited without reading
the whole kit. The PDF is archived at
[`reference/option-h-exploration-2026-07.pdf`](./reference/option-h-exploration-2026-07.pdf).

---

## Kept from Option H

These conflict with nothing above them, so they carry forward.

| What | Why it survives |
|---|---|
| **The mark** — two blocks split by a single frame line | The strongest idea in the PDF. It is `sudo rm the boring parts` rendered as geometry. `sudocut/web` ships **no mark at all**, only a wordmark, so this is purely additive. |
| **The mark geometry** — 22x / 12x / 4x, 88x tall, 72x wide, 22x clear space, 16px min with the line thickening to 2px | Precise, well-reasoned, and internally consistent. Nothing in the repos contradicts it. |
| **The six-lockup system** | A complete, sensible set. Restated in the shipped palette. |
| **The four misuse rules** | They *agree* with `--radius: 0px` and the no-decoration stance. |
| **The voice section** | Excellent, and a direct expression of soul.md's *"honesty over polish, no hype."* Kept verbatim. |
| **Accent-budget discipline** | Budgeting accent by share-of-surface is a good enforcement mechanism for soul.md's one-point-color law. Recomputed against the real palette rather than copying 60/28/9/3 literally. |

---

## Superseded

| # | Option H | Replaced by | Source | Reason |
|---|---|---|---|---|
| 1 | Signal Blue `#0D57F2` | `#1f55ff` | `bauhaus.css:2702` | Shipped cobalt, already in production across six rounds. Two blues is not a brand, it is a bug. |
| 2 | Ink `#111111` | `#24292c` | `bauhaus.css:2695` | Shipped slate ink. Pure black reads colder than this brand. |
| 3 | Paper `#F5F5F2` | `#f1f1ec` | `bauhaus.css:2698` | Shipped warm paper. soul.md explicitly demands warmth — *"with warmth, not a sterile text dump."* `#F5F5F2` is the cooler value. |
| 4 | Cut Red `#F5342A`, as a second accent | `#ff3b2f`, **demoted to a status token** | `bauhaus.css:2705` | soul.md: *"One point color, for the one thing you must act on."* Red reports machine state; it is not brand identity. Option H was already close to this by restricting it to record/delete/error. |
| 5 | Greys `#3A3A38` / `#8A8A86` / `#E3E3DE` | `--structure #656b6f`, `--muted #666c70`, `--line rgba(36,41,44,.2)`, rail ramp | `bauhaus.css:2696–2711` | The shipped ramp is tuned against the shipped ink and paper. Mixing ramps produces muddy neutrals. |
| 6 | **"Jost + IBM Plex Mono. Never more than these two."** | **Jost + SUIT + Hahmlet**, in three semantic roles | `bauhaus.css:1–23`, `2712` | **Capability failure, not taste.** Neither Option H face sets Hangul, and soul.md mandates Korean-first. SUIT and Hahmlet both carry Hangul, both are SIL OFL, both already vendored. IBM Plex Mono is dropped entirely; the mono role is the system stack. |
| 7 | "No shadows" | **No _blurred_ shadows.** Hard offset, zero blur, zero spread. | `bauhaus.css` `6px 6px 0` idiom | The hard offset shadow is the house signature, used on every recommended action. Option H was reacting to soft Material elevation; the rule needed restating, not deleting. |
| 8 | 400ms `cubic-bezier(0.85, 0, 0.15, 1)` | 120–200ms `ease`; entrances 300–520ms on `cubic-bezier(0.16, 0.78, 0.22, 1)` | `bauhaus.css` transitions | 400ms is too slow for UI. Retained *only* as a candidate logo-animation timing if one is ever built. The **principle** — "transitions are hard cuts, the brand never dissolves" — is kept. |
| 9 | 60 / 28 / 9 / 3 literal ratio | Recomputed against the real palette | — | The idea is good; the numbers referenced a palette we no longer use. |
| 10 | Tagline "LESS FOOTAGE. MORE STORY." as primary | **Secondary** English marketing line | `soul.md` | Primary is soul.md's `sudo rm the boring parts.` **Superseded again 2026-08-21** — the secondary line is now "We take the busywork. You keep the creating." See BRAND-KIT §12. |

---

## Not a conflict

| Option H | Shipped | Note |
|---|---|---|
| "No rounded corners" | `--sc-radius: 0px` | **Agreement.** Both sources independently concur. Still see **Q-RADIUS** — the ranking catalog softens to 14px on its marketing-style surface, which is a genuine open question for a company site. |

---

## Unresolved in the PDF itself

- **Lower-third inset** — page 8 caption says `32PX INSET`; the spec column on the
  same page says `24PX INSET`. The PDF contradicts itself. Not resolved here
  because the company site has no lower third; recorded for whoever builds video
  assets.
- **Vector assets** — the PDF says SVG/PNG/EPS are *"on request"*. We do not have
  them. Every file in [`logo/`](./logo/) is reconstructed from the published
  measurements and recolored. See **Q-VECTORS**.
