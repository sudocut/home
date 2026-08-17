# r6 — brief

> Appended to `design/BRIEF.md`. Starts from `r5-billboard`, the only r5 variant
> the founder kept (`design/rounds/r5/VERDICT.md`).

**Founder, 2026-08-18**, quoted rather than paraphrased because three of these
change the constitution or the copy:

1. *"the halftone effect is just image, but I want you to use that shader to
   animate that effect."*
2. *"there is farriers parameters for effect so on the user website user could
   adjust parameters to use that effect funny or interestingly… if I can adjust
   the background effect of that page it might be better page for users."*
3. *"I need some base image… you just have to make a base image and that effect
   with that base image will be better design for that page."*
4. *"the text is too many even now so reduce more text and remain important
   message only."*

## What this round changes in the constitution

- **D9 — the screen moves.** D7 mandated `static`. Lifted for the hero screen
  only; the paper sheet, the 76px grid and every other surface stay still.
- **D10 — the visitor can adjust the screen**, inside the measured band.

D10 sits oddly next to D6 and D7's central rule — *never tune by eye* — and the
resolution is that they apply to different people. **We** may not pick settings by
eye; that is what the numbers are for. A visitor is not picking our defaults.
What makes it safe is that every control is clamped to a range that measured
inside the band, and `u_radius`, `u_type` and both colour slots are not exposed at
all.

There is a reason to want it beyond novelty. soul.md S7 is **expose the criteria —
reviewable, never a black box**, and it is the same instinct that puts every cut
on an editable timeline. A front page that hands over its own controls makes that
argument in the only way a landing page can.

## `u_time` is dead. This is the finding the round turns on.

`halftone-dots` declares `uniform float u_time` and **never reads it in
`main()`**. Setting `speed` on `ShaderMount` spins a `requestAnimationFrame` loop
forever and renders the identical picture every frame.

Measured, with a positive control:

| render | sha256 |
|---|---|
| `speed 1, frame 0` | `fdc436b8…` |
| `speed 1, frame 2000` | `fdc436b8…` |
| `speed 1, frame 8000` | `fdc436b8…` |
| `speed 0, u_size 0.50` | `fdc436b8…` |
| `speed 0, u_size 0.55` | `4a1bfdec…` |

So animation is driven from our own loop over the uniforms the shader *does*
read, at `speed 0`. Full reasoning in D9.

**This is the third dead uniform in this library** — D6's `u_image`, D7's
`u_inverted`, now `u_time`. The rule to carry forward is not about any one of
them: assume no paper-shaders uniform does what it is called until a render
proves it.

## The base image

`public/frames/base-wave.png` — a speech waveform, and `base-wave-cut.png`, the
**same signal** with its dead air removed (26.2% of it).

A waveform is the one image this company can put on its own front page that is
both honest and about the product: it is literally what SudoCut looks at. It
invents no footage, impersonates nobody's episode, and needs no one's permission
— which the r5 abstract fields achieved only by meaning nothing at all.

The two images come from **index-remapping one envelope**, not from drawing two
waveforms. That matters: a variant that hard cuts between them is demonstrating
the product, and two separately generated waveforms would make the cut a lie
about what changed.

## The copy, cut again

**71 words**, from r5's ~180 and r4's ~300.

Gone since r5: the two-figure band, the "what comes back" sentence, the
waitlist's "two questions" line, and the privacy line — which **moved to the
footer** rather than being deleted. Cutting copy may cost words; it may not cost
a commitment.

**The qualifier survives both cuts** and is not negotiable. The claim above it is
a view count on one channel, and the standing brief forbids publishing it without
saying so.

## The six variants

All six are billboard's geometry — full-bleed screen, claim knocked out on paper.
What differs is **what the motion means** and **how much control the visitor
gets**.

| id | motion | controls | the idea |
|---|---|---|---|
| `playhead` | pans, then hard resets | dot size, speed | a tape running |
| `cutdemo` | hard cuts raw ↔ cut every 2.6s | dot size, source | the background is the demo |
| `console` | slow drift | all five | the controls are the feature |
| `breathe` | dot pitch swings | dot size, speed | resolves and dissolves in place |
| `pointer` | follows the cursor | dot size | nothing moves until someone does |
| `drift` | slow drift | dot size | the restrained control case |

`drift` exists to answer the question the round would otherwise beg: whether all
this movement and interface beats a page that does almost none of it.

## Reviewing this round

Previews in each variant's `NOTES.md`, or check out the branch and `pnpm dev`.

**The previews are pinned frames.** Headless Chrome fires `requestAnimationFrame`
exactly once under `--virtual-time-budget` — measured, 1 frame per virtual
second — so an unpinned screenshot of an animated page is always frame zero and
indistinguishable from a still one. `?sc-frame=<seconds>` draws one deterministic
frame instead. **A screenshot cannot show you the motion; run it.**

Rubric unchanged: **clarity · hierarchy · voice · restraint · proof**. Verdict
into `design/rounds/r6/VERDICT.md`. The round is finished when `app/` matches the
winner — one PR merged, five closed.
