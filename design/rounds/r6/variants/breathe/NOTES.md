# r6 · BREATHE — resolves and dissolves in place

![preview](preview.png)

The dot pitch swings, so the whole field resolves into a picture and dissolves
back without anything moving across the page. The slider sets the centre of the
swing rather than a fixed value.

**The bet:** it is the most purely visual of the six, and the one that best shows
what a halftone *is*.
**The risk, and it is the one to weigh:** this is the only motion in the round
with no meaning behind it. A pan is a playhead and a cut is an edit; a breath is
decoration, which is the thing soul.md keeps telling us to remove.

**Motion:** dot pitch swings between fine and coarse
**Controls:** dot size, speed
**Screen:** 14px centre of the swing, waveform

## Try it — and you have to, for this round

```bash
git checkout r6-breathe && pnpm install && pnpm dev   # http://localhost:3000/en
```

**The preview above is a pinned frame, not the design.** Headless Chrome fires
`requestAnimationFrame` exactly once under `--virtual-time-budget` — measured, one
frame per virtual second — so an unpinned screenshot of an animated page is always
frame zero and looks identical to a page that does not move. `?sc-frame=<seconds>`
draws one deterministic frame instead, which is what these previews are. A
screenshot cannot show you motion.

## Shared with every r6 variant

Built on `r5-billboard`, the only r5 variant kept
(`design/rounds/r5/VERDICT.md`). Same copy, same components, same constitution —
only the motion and the console differ, which is what makes the six comparable.

- **The screen moves** (D9) and **the visitor can change it** (D10), inside ranges
  that measured inside D7's band.
- **The base image is a waveform** — what SudoCut actually looks at — plus the
  same signal with its dead air removed, 26.2% of it.
- **71 words of copy**, down from r5's ~180. The privacy line moved to the footer
  rather than being deleted.
- One cobalt object: the waitlist button. The console is monochrome.

### `u_time` is dead in this shader

It is declared and never read. `speed: 1` renders byte-identical frames at 0, 2000
and 8000 while a `u_size` change does not — so the motion is driven from our own
loop over uniforms the shader actually reads. Full detail in constitution D9.
