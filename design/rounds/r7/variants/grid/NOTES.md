# r7 · GRID — the quiet one

![preview](preview.png)

A static field of ink circles on a fixed grid: the 76px hairline grid's grammar
with a heavier mark, and the closest of the six to what the brand already does.

**Coverage 0.129** — by some distance the lightest screen in the round. The claim
carries the page almost unaided, which may be exactly right for a page whose brief
has twice been *too much*.

**The cost:** it is a texture, not a picture. It says nothing about the product,
and it does not move.

**Shader:** `dot-grid` · **Base image:** none — procedural · **Coverage:** 0.129

## Try it

```bash
git checkout r7-grid && pnpm install && pnpm dev   # http://localhost:3000/en
```

**The preview is a pinned frame, not the design.** Headless Chrome fires
`requestAnimationFrame` exactly once under `--virtual-time-budget`, so no
screenshot can show motion — or the absence of a seam.

## What this round is testing

**Only the screen differs across all six variants.** The layout is `r6-playhead`
unchanged, because the founder asked whether `halftone-dots` was the right shader
at all, and a round that also moved the layout could not answer that.

Three variants hold the shader and change the base image; two change the shader;
one changes nothing and is the control. That split separates *which shader* from
*which picture*.

Every candidate was rendered and measured before being proposed —
`node tools/shader-survey.mjs`, table in constitution **D11**. Most of the library
never reached the page: `mesh-gradient`, `god-rays`, `metaballs`, `liquid-metal`,
`warp`, `voronoi` and the rest blend many colours or glow, and W5 bans blur while
W8 bans decorative gradients. Not taste rejections — they cannot be expressed in a
three-colour palette.

## The base images

Three, all **periodic across their width**, so any pan loops with no seam. All
built from one speech envelope, so they are three views of the same recording
rather than three unrelated pictures. None is footage or anyone's episode.
