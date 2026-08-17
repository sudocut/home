# r7 · SPECTRO — two dimensions instead of one

![preview](preview.png)

The same dither on a spectrogram: time across, frequency up, energy as ink.

A waveform is one dimension of a recording; a spectrogram is two, and a screen
with structure in both axes reads as a picture rather than a silhouette. It has by
far the most local structure of any image variant here — **grain 21.9 against the
waveform's 6.3 at identical settings**.

**The risk:** it is less legible as an idea. Everyone recognises a waveform; a
spectrogram is a specialist's picture, and a landing page has one screen in which
to be understood.

**Shader:** `image-dithering` · **Base image:** spectrogram · **Coverage:** 0.303

## Try it

```bash
git checkout r7-spectro && pnpm install && pnpm dev   # http://localhost:3000/en
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
