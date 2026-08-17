# r6 · CUTDEMO — the background is the demo

![preview](preview.png)

Every 2.6 seconds the background hard cuts between the recording and the same
recording with its dead air removed — 26.2% of it, measured by the generator that
built both images from one signal.

That is the product, stated without a sentence. The two images come from
index-remapping the same envelope rather than being drawn twice, so the cut is
provably the same audio; two separately generated waveforms would have made the
swap a lie about what changed. The source toggle stops the cycle and holds either
state.

**The bet:** this is the only variant where the background makes the argument.
**The risk:** a hard cut every 2.6 seconds beside a paragraph you are trying to
read is a real cost, and it never stops.

**Motion:** **hard cuts** between the recording and the cut, every 2.6s
**Controls:** dot size, source
**Screen:** 20px, waveform ↔ cut waveform

## Try it — and you have to, for this round

```bash
git checkout r6-cutdemo && pnpm install && pnpm dev   # http://localhost:3000/en
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
