# r4 — brief

> Appended to `design/BRIEF.md`, which carries the brand, the rules, the output
> contract, the paper-texture settings, the moodboard, and the rubric.

**This is the last round.** It converges on a chosen direction rather than
exploring. Three models, one job: take the winning layout and build the site out.

## Start from r3 variant E

**E won.** Read it before you design anything:

```
design/rounds/r3/variants/gpt-sol-a/index.html
```

It is on disk, it is served, and it is the brief's real content. What won, and
what you keep:

1. **Two-column hero** — headline left, the blind A/B proof boxed on the right,
   both above the fold. It is the only r3 variant where the proof is *level with*
   the pitch instead of beneath it. Keep that relationship.
2. **The A/B proof as a display object** — large `A/B`, then *"Viewers couldn't
   tell the difference."* Not a sentence in a paragraph.
3. **Waitlist form inline in the hero**, labelled `CLOSED BETA WAITLIST`. The gate
   is stated at the point of action.
4. **`sudo rm the boring parts.`** as a mono kicker, never the headline.
5. **The 76px grid stays visible.**

You are not copying it pixel for pixel — you are improving it. But if you throw
the two-column proof hero away, you have answered the wrong brief.

## Graft these from the other r3 variants

- **The `80% / 20%` split set as two large numerals side by side** (from Kimi's
  r3 page). Concrete beats prose. Use `--sc-numbers`, tabular.
- **Terra's restraint as the ceiling on length.** Its page was the shortest of
  the five and still complete. Longer is not better.

## New this round

**1. Paper texture is back — at the mandated settings only.**
Standing brief §4b. Copy the values exactly; do not tune them. Ink fibre is what
made r2 read as disabled. Every page gets it, or none do — do not mix.

**2. Four pages, not one.** Use the FILE marker contract in §4:

| file | job |
|---|---|
| `index.html` | the landing page — waitlist signup is the one action |
| `about.html` | why we exist, what we believe, the proof in full |
| `team.html` | how the work gets decided |
| `pricing.html` | beta terms now, launch card later |

Nav links across all four, relative hrefs. Every page carries the same header,
footer, and texture. **Only `index.html` gets a cobalt CTA** — on the other three,
cobalt appears at most once and only if that page genuinely has one required
action. A page with nothing to do gets no cobalt.

## Page content — these are the facts. Do not invent around them.

**`pricing.html`** — two blocks, clearly separated:

*Now — closed beta, Aug–Oct 2026, Korea.* Invite-only, ~10 channels, free. One
600 raw-minute (10h) grant on joining. No subscription. The only payment that
exists is one-time credit top-ups at ₩100/raw-min — packs 300분 ₩30,000 /
600분 ₩60,000 / 1,200분 ₩120,000.

*At launch — target Q4 2026, Korea.* Label it a target; it has not happened.
Nothing on this card can be bought today.

| Tier | Price | Included raw time |
|---|---|---|
| Free | ₩0 | 60 min/mo + 600 min one-time grant |
| Starter | ₩14,900 | 600 min (10h) |
| Pro | ₩49,000 | 1,200 min (20h) |
| Studio | ₩149,000 | 3,600 min (60h) |
| Managed | ₩299,000 | 3,600 min (60h) — publish-ready, human QC, priority |

Overage ₩100/raw-min; re-processing the same source is free. **₩ only** — do not
print USD. No highlighted or "recommended" tier: that would be a second cobalt.

**`team.html`** — **there are no publishable names.** Do not invent people,
photos, headcount, or investors, and do not write "Founder" as a placeholder
card. The roster is not cleared for publication. Build the page around *how the
work gets decided*, drawn from soul.md: we are not artists; direction over
perfection; honesty over polish; AI proposes, humans decide. Leave an obvious
empty slot where the roster will go.

**`about.html`** — why we exist. The chore is real and universal; the last 20% is
where creativity lives; the blind A/B is the evidence; we export FCPXML/SRT so
creators finish in their own tools. No metrics beyond the A/B claim.

**Everywhere** — no product screenshots, no testimonials, no press logos, no
fabricated numbers. `14:32 → 10:47` is illustrative and must read as an example.

## What this round is testing

**Does the winning hero survive being extended into a site?** A layout that works
for one screen can fall apart when it has to carry four pages, a nav, and a
footer. If something in E has to change to make the site cohere, change it and
the verdict will say why.

## Out of scope

FAQ, blog, careers, cookie banner, language switcher, dark mode, a fifth page.
