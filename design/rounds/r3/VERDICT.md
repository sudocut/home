# r3 — verdict

**Ruled by the founder, 2026-07-27.** Winner picked from the board's blind labels
without lifting the blind first.

## Winner

**E — `gpt-sol-a`, GPT-5.6 Sol.** $1.5672, 385s.

> "design E for round 3 is best design I think."

## Why it won, and the uncomfortable part

E is the variant that **worked hardest**, and it is the only one that did.

Its session ran 12 turns and 10 tool calls: it read the repo tree, read
`design/CONSTITUTION.md`, and — notably — ran `tools/verify-round.mjs` against
its own draft before printing it. Every other model answered from the brief text
alone in a single turn. Terra, on the identical prompt, made zero tool calls in
both rounds.

So the round's clearest finding is about **agency, not tier**: given repo access,
a model that goes and reads the constraints and self-checks against them produces
a better page than one that infers them from a brief. That is worth more than the
model comparison it was supposed to be.

The uncomfortable part: I reported E as a **cost outlier** — "$7.10, 67% of the
round, a runaway repo-reading tier." That was mostly a bug in my own harness
(cached tokens billed twice; see the r2 verdict correction). E actually cost
**$1.5672** — less than Fable's $2.7892. **The behaviour I flagged as waste was
the behaviour that won.** Corrected in `design/models.json`, and the note there
now says a costly Sol session is behavioural and not to be generalised.

## What won specifically

- **Two-column hero** — headline left, blind A/B proof boxed on the right, both
  above the fold. It is the only variant where the proof is *level with* the
  pitch rather than beneath it.
- **A/B set as a display object**, not a sentence. Large `A/B`, then
  *"Viewers couldn't tell the difference."*
- **Waitlist form inline in the hero**, labelled `CLOSED BETA WAITLIST` — the
  gate is stated at the point of action, not discovered later.
- **The 76px grid left visible**, which is what makes the page read as paper
  without a shader.
- **`sudo rm the boring parts.`** as a mono kicker, not the headline.

## What to graft from the losers

- **Kimi (D)** — the `80% / 20%` split set as two large numerals side by side.
  Clearer than a sentence, and the most concrete thing on any of the five pages.
- **Fable (B)** — the dark full-bleed proof band. E's boxed proof is stronger,
  but the band shows the proof can carry a whole section.
- **Terra (A)** — the shortest page of the five and still complete. Its restraint
  is the check on E's density.

## Model observations

- E won on effort, not tier: Sol made 0 tool calls in r2 and produced a mediocre
  page; 10 in r3 and won. Same model, same effort setting.
- Fable was the most expensive variant in both rounds ($2.94, $2.79) and won
  neither.
- Terra remains the value outlier: $0.0898, comparable page, zero tool calls.

## Next brief must say

1. **Build on E's layout.** Two-column hero, proof level with the pitch.
2. **Paper texture is back, at the mandated light settings only** (D6, amended).
3. **Multiple pages** — landing + about + team + pricing, one file each.
4. Graft Kimi's `80/20` numerals and keep Terra's restraint as the ceiling on
   length.

## Promote to the constitution?

**D6 amended** — the texture is unbanned at tested light settings. The r2 ban was
aimed at the wrong thing: the failure was the fibre *colour* (ink), not the
shader. Recorded with the comparison that settled it.
