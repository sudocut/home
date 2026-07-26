# r4 — verdict

**Ruled by the founder, 2026-07-27:** *"kimi 를 우승안으로 채택하고, app 에다가
구현해 두자."*

## Winner

**Kimi K3 — `kimi-k3-a`.** $0.2903, 453s: the cheapest variant in the round, and
the second round running in which the cheapest variant won.

## The round has an asterisk, and it belongs at the top

**This round was ranked on pages whose paper texture was not rendering.** Three
faults stacked, all in the harness rather than the models:

1. The board set `sandbox="allow-same-origin"` with no `allow-scripts`, so no
   variant's shader ever ran inside it.
2. Every variant omitted `u_image`, so `u_imageAspectRatio` stayed 0, `patternUV`
   collapsed, and the fibre rendered nothing even outside the board.
3. The mandated colours were on the wrong side of the shader's lighting model, so
   what little did render was invisible and slightly grey.

All three are fixed and the settings are now measured, not eyeballed — see D6. But
it means **the texture was not a variable in this comparison**; all three variants
were effectively judged flat. Kimi did not win on its shader, because none of them
had one. If the texture changes how these read, that is a question for r5.

## What won, and why

- **The hero does not claim the viewport.** `padding-top: 88px`, `align-items:
  start`, no `100svh`. fable and Sol both pinned a full-height hero; kimi lets the
  page start scrolling immediately and the 80/20 band arrives sooner.
- **The proof card is light, not inverted.** `2px solid` ink border on
  `--sc-surface-raised` instead of fable/Sol's filled ink block. On a paper sheet
  the ink block reads as a foreign object; the bordered card reads as printed on
  the same page.
- **The headline is concrete.** *"Four hours of footage. One story. Ninety seconds
  of work."* — three nouns and a number, versus the other two variants' shared
  *"Cut the boring 80%. Keep the creative 20%."* The percentages still appear, but
  as the 80/20 band where they carry more weight than they would in a headline.
- **Mono carries the structure.** 13 uses of `--sc-mono` against fable's 7 and
  Sol's 2 — labels, nav, notes, the example line. It reads as an editor's tool
  rather than a marketing page, which is the voice soul.md asks for.
- **One cobalt object, and it is the only interactive thing above the fold.**
  Sol also managed one; fable shipped two.
- **The only variant that made the form work.** Client-side validation and a
  success state, so the waitlist is a real control rather than a picture of one.

## What to graft from the losers

- **GPT-5.6 Sol — the `01 → 04` workflow strip** (`Long spoken footage → AI cut
  proposal → FCPXML + SRT → Your editor`). Kimi has no equivalent, and the page
  never says what you actually get back. It should sit between the 80/20 band and
  the example line.
- **Fable 5 — the `example:` line inside the proof card.** Kimi's example lives at
  the very bottom of the page, far from the claim it qualifies. Fable puts
  `14:32 → 10:47` directly under *"Viewers couldn't tell the difference"*, where it
  is evidence rather than a footnote.
- **Both — the `mark-mono.svg` in the header.** Kimi ships a text-only wordmark;
  the brand has a mark and this is the surface for it.

## What failed, and why

**The texture, and it was the brief's fault, not the models'.** D6 handed all three
variants a settings block with "do not tune these", and all three pasted it
faithfully — including the `u_image` omission that made it inert. When three models
break identically, the brief is broken. The same tell appeared in r4's first run
with the `href=\"` escaping bug.

**The team page is still a stub in every variant,** which is correct — the roster
is a consent decision, not a copy task — but it means `/team` has now been designed
three times without being answerable.

## Model observations

Kimi is now two rounds' worth of evidence that its output is not "cheap tier,
cheap result": it produced the winning page at 1/16th of Fable's cost. Worth
holding lightly — it is one round, and its ceiling is config-level `high` rather
than a true per-call maximum, so this is not K3 at full effort.

The cheapest variant has now won r3 and r4. That is the harness's most durable
finding so far, and it is about effort and restraint rather than price.

## Next brief must say

1. **The texture is live now.** r5 is the first round where it is actually a
   variable. Do not re-litigate D6's settings; use them and design around them.
2. **Say what comes back.** Every variant sold the removal and none named the
   deliverable. FCPXML + SRT into the editor you already use — that is the
   product, and it belongs above the fold.
3. **Put the example next to the claim it qualifies,** not at the foot of the page.
4. `/team` stays a stub until the founders rule on publishing. Do not design it a
   fourth time.

## Promote to the constitution?

**Yes, one thing, and it is not a design rule:** *no setting may be recorded in the
constitution without a measurement that reproduces it.* D6 was written twice from
screenshots and was wrong both times. That is now enforced by
`tools/shader-probe.mjs` and stated in D6.

The design questions this round settled — light proof card over inverted, hero that
does not claim the viewport — are **not** promoted. One round with the texture
disabled is not enough to freeze them.
