# r3 — brief

> Appended to `design/BRIEF.md`, which carries the brand, the rules, the output
> contract, the moodboard, and the rubric. This file says only what is different.

## Corrections from r2 — violating these is automatic failure

r2 was rejected outright. All five variants. Read these as hard constraints.

1. **FULL LANDING PAGE, not one screen.** r2 asked for above-the-fold only and
   got five fragments. Scroll is expected. Build the whole page.
2. **NO BACKGROUND TEXTURE SHADER.** r2 tested it; the page read as **greyed-out,
   like a disabled control or a modal scrim.** Do not import anything from
   `design/vendor/`. Warmth is the paper colour plus the 76px hairline grid.
3. **ENGLISH FIRST.** `<html lang="en">`. Reversed from r2. Korean may appear as
   a secondary layer, written as Korean — never machine-translated English.
4. **LEAD WITH THE PROOF.** Every r2 variant buried the blind A/B result in a
   footnote. It is the strongest thing we have. It goes high on the page.
5. **The page has exactly one job: closed-beta signups.**

## What to design

**The full landing page**, top to bottom, at 1280 wide. One HTML document.

## What this round is testing

**Can a stranger who has never heard of us decide to join the beta?**

They arrive knowing nothing. They should learn what we do, believe it works, and
join — without being sold to. The blind A/B result is the argument: we shipped a
hand-edited cut and an AI-edited cut side by side and viewers couldn't tell.

Secondary: **how much page does this need?** A landing page can be one screen or
eight sections. `restraint` is scored — the shortest page that does the job wins.

## Must include

1. **A waitlist signup as the one action.** Email capture. One field, one button,
   in cobalt. It is the only cobalt on the page. Reachable without scrolling
   *and* available again at the bottom — the same action, not two different ones.
2. **What we do**, in a sentence a non-technical video creator understands.
3. **The proof, prominently.** The blind A/B result, high on the page.
4. **The 80%.** AI strips the boring 80%; the creative 20% stays with the creator.
   That ratio is the clearest thing we can say. (Carried from Kimi's r2 headline.)
5. **`sudo rm the boring parts.`** as a kicker or wordmark line, not the pitch —
   the audience is creators, not developers. Keep it as the easter egg.
6. **The mark.** `/brand/logo/mark.svg`, `lockup-horizontal.svg`, or
   `lockup-stacked.svg` — absolute paths, they are served.
7. **A nav** linking `/team`, `/pricing`, `/about`. They need not work — the site
   map is being built around this page.

## What is true, and what you must not invent

Honesty over polish is a hard rule. These are the facts:

- **The beta is real and it is closed.** Signup is a waitlist. Do not imply
  instant access.
- **There is no pricing yet.** No plans, no tiers, no "from $X". If you mention
  cost at all, the only true statement is that the beta is free. Do not invent a
  pricing table on this page.
- **No named team members.** Do not invent people, photos, headcount, or investors.
- **No fabricated metrics.** No "10,000 creators", no fake client logos, no
  invented time-saved statistics. The blind A/B result is the one claim we have
  earned. Numbers like `14:32 → 10:47` are illustrative and must read as an
  example, never as a measured benchmark.
- **No product screenshots.** We are not shipping fake UI.

If a section would need invented facts to work, cut the section. That is a correct
answer, not a cop-out.

## Explicitly out of scope

- No testimonials, no press logos, no FAQ accordion, no cookie banner.
- No pricing table (see above).
- No second HTML file — one document.

## Notes

- The moodboard direction (standing brief §4c) is large quiet fields with type
  carrying the page. r2 never really tested it. Push the whitespace.
- One cobalt object: the signup button. A cobalt link *and* badge *and* button is
  a rejection.
- `prefers-reduced-motion` and 390px both matter.
