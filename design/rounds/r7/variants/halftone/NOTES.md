# r7 · HALFTONE — the control

![preview](preview.png)

**r6-playhead exactly as it stands**, at a 22px pitch on the waveform.

It is in the round so the round can answer the question that was actually asked.
*Is `halftone-dots` the best shader for this?* is not answerable by looking at five
alternatives — it needs the incumbent on the same page, with the same copy, judged
the same way.

**If this wins, that is a real result:** it would mean the survey found nothing
better and the shader was right all along.

**Shader:** `halftone-dots` · **Base image:** waveform · **Coverage:** 0.210

## Try it

```bash
git checkout r7-halftone && pnpm install && pnpm dev   # http://localhost:3000/en
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
