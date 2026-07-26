# r2 — brief

> Appended to `design/BRIEF.md`, which carries the brand, the rules, the output
> contract, the paper-texture shader, the moodboard, and the rubric. This file
> says only what is different about this round.

## What to design

**The homepage above the fold** — everything a first-time visitor sees before
scrolling, at 1280×800.

Not the whole page. One screen.

## What this round is testing

**Does real paper texture earn its place?**

soul.md has asked for 양피지 / watercolor-paper warmth since the beginning, and
every system so far has approximated it with a warm flat colour. `paperTexture`
(see the standing brief §4b) can render it for real, vendored and offline.

The question is not "can we" — it renders. It is **should we**: does the texture
make the page feel like paper worth keeping, or is it decoration that competes
with the one thing that matters? `restraint` is a scored criterion, and the honest
answer may be that the flat colour was already enough.

So: **use it if you believe it earns its place, and don't if you don't.** Both are
correct answers to this brief. What is *not* acceptable is using it decoratively —
turned up so it draws the eye, or animated.

Secondary question, from the moodboard (§4c): its direction is large quiet fields
with type carrying the page. Our r1 skeleton is quieter than the app but has never
been tested against that reference. Push the whitespace further than feels
comfortable and see whether it reads as confident or as empty.

## Must include

1. **The positioning line.** `sudo rm the boring parts.` — or a Korean line
   carrying the same idea. Your call how prominent.
2. **What we do, in one sentence a non-technical creator understands.** The main
   audience is Korean video creators, not developers.
3. **Exactly one call to action.** One. In cobalt. Decide what it should be and
   make that decision legible.
4. **The mark.** `/brand/logo/mark.svg`, `lockup-horizontal.svg`, or
   `lockup-stacked.svg` — absolute paths, they are served.

## Explicitly out of scope

- No pricing, no feature grid, no team section, no footer nav, no testimonials.
- No second screen. If it needs scrolling, it is out of scope.
- **No product screenshots and no invented metrics.** We are not shipping fake UI
  or fake numbers. Honesty over polish — this is a hard rule, not a preference.
- No signup form fields. One button is enough.

## Notes

- Korean is primary. A Korean visitor must never feel like they are reading a
  translation.
- If you cite the blind A/B proof — we shipped a hand-edited cut and an AI-edited
  cut side by side and viewers couldn't tell — cite it as the claim it is. Any
  specific figure you use is **illustrative**, and must be labelled as such.
- `restraint` is scored. A screen with four things on it usually beats one with
  nine.
