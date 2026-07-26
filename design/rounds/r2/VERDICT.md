# r2 — verdict

**Ruled by the founder, 2026-07-26, without scoring the board.** All five variants
rejected. Recorded here because a rejection that settles a question is worth more
than a ranking that doesn't.

## Winner

**None.** Every variant answered the wrong brief.

## What failed, and why

The failure is mostly **mine, not the models'** — r2's brief asked the wrong
question. It scoped one screen above the fold and framed the round around a
texture experiment, when what the company actually needs is a site: a landing
page that captures closed-beta signups, plus the pages around it. Five models
executed a narrow brief faithfully and produced five narrow answers.

1. **Wrong job.** The brief said "above the fold, one screen." The site needs to
   convert a stranger into a beta signup, and needs team/pricing around it.
2. **Proof was too quiet.** Every variant buried the blind A/B result in a
   footnote. It is the strongest thing we have and it read as a caption.
3. **Wrong language.** The brief mandated Korean-first, per soul.md. The founder
   has since reversed this — English first, Korean second. See D5.

## Q-PARCHMENT — settled: no texture

The round existed to answer whether real paper texture earns its place.
**It does not.** The founder's words:

> "shader effect is bad... too dark so it seems like page is disabled such as
> pop-up effect."

That is precise, and it is a *legibility* failure rather than a taste one: at the
settings the variants chose, the page reads as **greyed-out — the visual language
of a disabled control or a modal scrim.** A landing page whose default state looks
disabled is broken no matter how well the fibre is simulated.

Four of five models used the shader and all four landed in the same grey. That is
not four bad guesses; it is a shader whose honest settings are wrong for a surface
that must look active and inviting. The one variant that declined it —
**GPT-5.6 Terra, also the cheapest at $0.1090** — was right.

**Rule D6: no background texture shader.** Warmth comes from the paper colour and
the 76px grid, as the shipped system always did. The vendored library stays for a
future round with a real use (a hero-only treatment, a print asset), but it is off
by default and banned in the brief.

Cost of learning this: **$4.2020**. Worth it — the question had been open since
soul.md was written and had been deferred twice.

## What to graft from the losers

- **GPT-5.6 Terra** — the restraint call. Flat paper, visible grid, no shader,
  30s, $0.1090. Cheapest and least wrong.
- **Kimi K3** — the strongest headline: *"지루한 80%는 잘라내고, 이야기만 남깁니다."*
  It states the ratio, which is more concrete than "the boring parts." Carry the
  **80%** forward, in English.
- **Opus 5** — the mono `sudo rm the boring parts.` kicker above a plain-language
  headline. Keeps the developer joke as an easter egg rather than the pitch,
  which is what soul.md's open brand-tone question suggested.
- **GPT-5.6 Sol** — CTA placed away from the headline so the two don't compete.

## Model observations

The blind was never lifted because scoring never happened, so these are
observations about *behaviour*, not quality — and one round is not evidence.

- Spend spread **24×**: Terra $0.1090 → Fable $2.5758. The most expensive variant
  was not the most correct one; the cheapest made the one call that survived.
- Four of five reached for the new capability. Offering it in the brief read as
  endorsing it, even with "optional" stated twice. **The next brief states the ban
  instead of offering the option.**
- Kimi's usage is unmeasurable through its CLI, so its cost-effectiveness is
  unknown — not zero, unknown.

## Next brief must say

1. **Full landing page, not one screen.** Scroll is allowed and expected.
2. **The one action is joining the closed-beta waitlist.** Everything serves it.
3. **English first. Korean second.** Reversed from r2.
4. **No background texture shader.** Not "optional" — banned.
5. **Lead with the proof.** The blind A/B result is the argument, not a footnote.
6. **Say 80%.** Concrete beats vague.

## Promote to the constitution?

Yes — **D5** (English-first) and **D6** (no background texture). Both reverse a
prior position, so both cite the reversal.
