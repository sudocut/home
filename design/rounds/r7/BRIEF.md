# r7 — brief

> Appended to `design/BRIEF.md`. Starts from `r6-playhead`, which the founder kept.

**Founder, 2026-08-18:** *"the design now are using halftone dots. I think it is
not the best way to this design so you can just look around the shaders and pick a
best one with best parameters. Also, you can just add some base images and do the
next round for six different designs."*

## The question this round asks

**Is `halftone-dots` the right shader, or just the first one that fit?**

It is the second. It was never chosen against alternatives — it was the first
shader in the library that could be driven from two brand colours, and D7 froze it
by writing its settings down. That is an accident, not a decision.

## Why the layout does not move

**Only the screen differs across all six variants.** r6 settled the layout and the
founder kept it; a round that moved both could not attribute the result to either.

Three variants hold the shader constant and change the base image; two change the
shader; one changes nothing and is the control. That split is the experiment — it
separates *which shader* from *which picture*, which six free-form designs cannot.

## The palette decides what is even a candidate

Most of the library is ineligible before anyone looks at it. `mesh-gradient`,
`god-rays`, `metaballs`, `liquid-metal`, `warp`, `smoke-ring`, `voronoi`,
`neuro-noise`, `heatmap` and the gradient shaders blend many colours or **glow** —
W5 bans blur, W8 bans decorative gradients, and a shader with four inks cannot be
expressed in a three-colour palette at all. `halftone-cmyk` remains out for the
reason it always was.

What is left was rendered and measured: `node tools/shader-survey.mjs`. Full table
in constitution **D11**.

## The recommendation

**`image-dithering`, 8×8 Bayer, `u_pxSize` 3, `u_inverted: true`, on the looping
waveform** — variant `dither`.

`halftone-dots` reduces the signal to round dots on a fixed grid, and the
waveform's fine vertical peaks are exactly what a dot grid throws away. The dither
keeps them: **coverage 0.321 against 0.210 on the same source**, so it carries more
of the picture rather than just printing darker.

## The base images

Three, all **periodic across their width** so any pan loops with no seam — the
lesson from r6, now permanent. All from one speech envelope, so they are three
views of the same recording rather than three unrelated pictures.

| file | what it is | mean |
|---|---|---|
| `base-wave.png` | the waveform | 208 |
| `base-spectrogram.png` | time across, frequency up, energy as ink | 219 |
| `base-timeline.png` | clips end to end, dead air as the gaps | 189 |

None of them is footage, a thumbnail, or anyone's episode. They need no
permission, which is still the constraint that rules real stills out.

## The six variants

| id | shader | base image | coverage | |
|---|---|---|---|---|
| `dither` | `image-dithering` | wave | 0.321 | **the recommendation** |
| `spectro` | `image-dithering` | spectrogram | 0.303 | most structure (grain 21.9) |
| `timeline` | `image-dithering` | timeline | 0.458 | most literal, heaviest ink |
| `drift` | `dithering` | none — procedural | 0.403 | the only working `u_time` |
| `grid` | `dot-grid` | none | 0.129 | the quiet one |
| `halftone` | `halftone-dots` | wave | 0.210 | **the control — r6 as it stands** |

## Two things the survey caught that reading could not

1. **`u_inverted` means the opposite of its name in `image-dithering` too.** At
   `false` it rendered an ink field with the waveform reversed out — coverage
   0.70, the dark rectangle r2 was rejected for. Second shader in this library
   with that exact trap.
2. **`u_time` is per-shader, not per-library.** `dithering` animates itself.
   `halftone-dots`, `image-dithering` and `dot-grid` declare `u_time` and never
   read it, so a screen built on them must be moved from outside — and one built
   on `dithering` must not be.

## Reviewing

Previews in each variant's `NOTES.md`, or check the branch out and `pnpm dev`.
**Previews are pinned frames** — headless Chrome fires `requestAnimationFrame`
once, so no screenshot can show motion or the absence of a seam.

Rubric unchanged: **clarity · hierarchy · voice · restraint · proof**. Merging any
r7 PR supersedes #12.
