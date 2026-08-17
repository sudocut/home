# r6 — verdict

**Ruled by the founder, 2026-08-18.** PLAYHEAD (#12) kept; the other five closed.

## Winner

**PLAYHEAD** — a full-bleed halftone screen panning across a waveform, with the
claim knocked out on paper.

## Three corrections after the ruling, all founder calls

**1. The console goes.** *"Remove the adjust the screen widget or card because I
think it does not matter for right now."*

D10 lasted one round. It is recorded in `CONSTITUTION.md` as proposed-and-reversed
rather than deleted, because the argument for it — soul.md S7, *expose the
criteria* — is still a good one. The lesson worth keeping is narrower than "users
don't want controls": the same brief that asked for the console also said **the
text is too many**, and a console is five labels, five values and a legend.
**Interface is text.** The `console` variant's own PR flagged that risk before the
ruling.

**2. The loop was not a loop.** *"It is not connected from start to the end so
user can feel that it's disconnected."*

The pan was smooth and the founder still saw a break, because the defect was in
the **picture**, not the motion. The waveform was a one-off stretch of signal, so
its end never matched its start, and r6 tried to cover that with a hard reset —
justified at the time by O4, *the brand never dissolves*. That was the wrong rule
for the problem: O4 governs transitions between things that differ, and this was
supposed to be one continuous thing.

The base image now repeats **exactly twice across its width** — every term in the
generator has a whole number of cycles, so the halves are byte-identical at a mean
absolute difference of `0.0000`. The pan sweeps exactly half the image and
subtracts half at the wrap.

Measured on the hero region: `t=3` vs `t=28` (one full period) is **0.0000**;
`t=3` vs `t=10` is **12.89**. Continuous, and provably so.

**3. The gate line goes.** *"Remove this Invite-only · ~10 channels · Korea first
· free during beta."* Off the hero; still on `/pricing` in full. The page lost a
line, the site lost nothing. Copy is now **61 words**, from r4's ~300.

## What r6 proved that outlives it

`u_time` is declared and never read in `halftone-dots`, so `speed` renders
byte-identical frames forever. That is the **third** dead uniform in this library
after D6's `u_image` and D7's `u_inverted`. The standing rule is now in
`design/BRIEF.md` §4e: assume no paper-shaders uniform does what it is called
until a render proves it.

Two of this round's own bugs were caught the same way and neither was visible:
sentinels initialised to `NaN` made every change-check false, so the animation
rendered perfectly and never moved; and headless Chrome fires
`requestAnimationFrame` exactly once, so no screenshot can observe motion at all
without the `?sc-frame=` clock.

## The asterisk, unchanged from r5

Six variants, one model, no blind ranking, no cost table. The thing reviewed was
the thing that would ship, which is the failure `design/README.md` documents — but
the blind is gone, and with it the bias the board exists to remove. Worth
restoring for r7 by fanning out **from the shipped page**.
