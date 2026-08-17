# r6 · POINTER — nothing moves until someone does

![preview](preview.png)

The screen follows the cursor. The page responds to a visitor rather than
performing at them, and it is completely still until someone does something.

One knob only — the motion control is absent on purpose, because here the visitor
already *is* the motion control.

**The bet:** the least intrusive way to satisfy *animate it*, and the most
directly interactive way to satisfy *let users adjust it*.
**The risk:** on touch there is no pointer, so a phone gets a still page. That is
a complete design rather than a degraded one — and the same state a
reduced-motion visitor gets — but it does mean the idea does not exist on
mobile.

**Motion:** follows the cursor
**Controls:** dot size
**Screen:** 24px, waveform

## Try it — and you have to, for this round

```bash
git checkout r6-pointer && pnpm install && pnpm dev   # http://localhost:3000/en
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
