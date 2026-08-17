# r7 · DRIFT — the only shader whose own clock works

![preview](preview.png)

`dithering` is procedural — no base image at all — and it is the one candidate that
actually reads `u_time` in `main()`, measured at **71.2** mean absolute difference
over nine seconds. So this variant runs on the shader's native speed and our pan
loop is not involved at all.

That is a real engineering argument: no periodic source to maintain, no wrap to get
right, and no constraint on the hero's aspect ratio.

**The cost is meaning.** It is a beautiful dithered cloud with nothing to do with
audio, video or editing — where the waveform, spectrogram and timeline all show a
visitor what the product works on.

**Shader:** `dithering` · **Base image:** none — procedural · **Coverage:** 0.403

## Try it

```bash
git checkout r7-drift && pnpm install && pnpm dev   # http://localhost:3000/en
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
