# r5 — verdict

**Ruled by the founder, 2026-08-18:** *"I think all the designs except billboard
is so bad… Close the issues for this round and I'm going to do a next round."*

## Winner

**BILLBOARD** — the full-bleed screen with the claim knocked out on a plate of
warm paper. One of six, and the only one kept.

All six PRs (#6–#11) are closed. The branches survive, so any of them is
reopenable; `r5-billboard` is the one r6 is built on.

## What won, and the useful part is *why*

Five of the six were rectangles arranged around a screen. Billboard was the only
one where **the screen is the page** rather than an illustration on it — and the
founder's brief had asked for the shader used *aggressively*, which is a
statement about how much of the page it should own, not about how big the dots
should be. The variants that kept a tidy hero and put a screened panel beside it
answered a question nobody asked.

The PR for billboard flagged its own risk — a field of ink that large is the
closest any variant came to r2's rejected ink block. That risk did not land. On a
warm sheet, at a 28px pitch, with the claim on paper over it, the field reads as
print rather than as a dark rectangle. **Worth remembering: r2's failure was
never "large dark area", it was "large dark area with no reason to be there".**

## What r5 got right that r6 keeps

- **The claim as the whole hero.** "AI cut it. We published it. Same views."
- **The knockout plate.** Content never sits on the dots.
- **The measured band.** D7's numbers are what make a screen this large safe.
- **The trust band**, unchanged.

## What r5 got wrong, and r6 fixes

1. **The screen was static.** D7 mandated it. The founder wants motion — D9.
2. **The screen was ours alone.** The founder wants the visitor to be able to
   change it — D10.
3. **The base image was a light field**, chosen for tonal range and meaning
   nothing. r6 screens a **waveform**: the thing SudoCut actually looks at,
   honest, and needing nobody's permission.
4. **Still too much text.** Founder again: *"the text is too many even now."*
   r6 cuts to 71 words.

## The asterisk this round carries

**Six variants, one model, no blind ranking, no cost table.** r1–r4 fanned out to
five models and ranked blind on the board; r5 did not, and neither does r6. The
trade was deliberate — the thing reviewed is the thing that would ship, which is
the failure `design/README.md` documents at length — but it costs the blind, and
the bias the board exists to remove is back.

Worth restoring for r7 by fanning out **from the shipped page** rather than from
a brief.

## What this round proved about the shader, which outlived the designs

Two errors were caught by measurement that no amount of looking would have found,
and both are now permanent in `tools/halftone-probe.mjs`:

- **A tonal inversion.** Every setting in the first run scored fidelity −0.97: a
  perfect reproduction, upside down. `u_inverted` means the opposite of its name.
- **A window that would not shrink.** A whole table of small-panel numbers turned
  out to be Chrome rendering at its minimum size and screenshotting the corner.

That second one changed the API: `u_size` is a dot *count*, so cell **pitch in
CSS pixels** is the honest unit. It is the most reusable thing r5 produced.
