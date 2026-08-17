# r5 — brief

> Appended to `design/BRIEF.md`, which carries the brand, the rules, the output
> contract, the shader settings, the moodboard and the rubric.

**Founder, 2026-08-18.** Three instructions, quoted rather than paraphrased
because two of them change the constitution:

1. *"I found out nice tool called paper design shader … I want you to use
   halftone-dots shader aggressively."*
2. *"Now, there are too many text so users cannot read important message. The
   important message is that AI edits the video, and publish, views are same as
   human edited video."*
3. *"On the bottom column, trusted partners and already uploaded youtube channels
   that uses our service, will be showed up, it should be shown to users at once
   they landed. Logo or youtube thumbnail should be shown, and it flows."*

## What this round changes in the constitution

Two amendments, both founder decisions, both recorded rather than resolved
quietly — see `design/CONSTITUTION.md`.

- **D7** admits `halftone-dots` as a foreground screen. D6 ended *"still banned:
  any other shader as a page background"*, so this is an amendment to the layer
  directly under soul.md. It survives where `halftone-cmyk` does not because it
  has two colour slots rather than four inks, so it runs entirely on
  `--sc-content` and `--sc-surface` and is inside the closed palette by
  construction.
- **D8** admits one continuous marquee, on the channel band only. W6 covers
  transitions and entrances; a marquee is neither, and stretching W6 to fit would
  have made it mean nothing.

Both are measured, not eyeballed. `tools/halftone-probe.mjs` is to D7 what
`tools/shader-probe.mjs` is to D6, and it caught two errors that would have
shipped looking fine — a tonal inversion, and a whole table of small-box numbers
that turned out to be Chrome refusing to make its window small. D7 records both.

## The three jobs

**1. One claim, and cut everything competing with it.** The hero is
*"AI cut it. We published it. Same views."* The 60-word lede is now 28 words that
say what the product does **and** refuse the overclaim in the same breath. The
standing brief is explicit that this is a view count on one channel and must
never be written as *"viewers couldn't tell the difference"* — so the honesty
lives in the hero, not in a footnote.

The r4 A/B proof card is gone from every variant. It argued in prose for what the
headline now says outright, and keeping both was saying it twice.

**2. Use the screen aggressively.** Every variant puts real ink on the page. What
differs is *how*: a plate beside the story, a full-bleed field, a matched pair, a
disc, three bands, or ten tiles. Pitch is the variable, 6–32px, always ink on
paper and never cobalt.

**3. The trust band, above the fold, flowing.** Five channels, named. Where the
band sits is the sharpest disagreement between the variants: `ticker` puts it
first, above the headline; the rest put it directly under a hero built tight
enough to clear the fold at 1280×800.

## What is real on this page, and what is not

- **The five channel names are real** — the channels' own public titles, each
  checked against `youtube.com/@{handle}` on 2026-08-17 (that research came from
  the `add-trusted-partners-section` branch; this round adds the artwork slot, not
  the names).
- **The pictures are not.** `public/frames/*.png` are abstract luminance fields
  from `tools/make-frames.mjs` — a key light and a falloff. Not footage, not
  thumbnails, not anything anyone shot.

Two reasons, and the design one is the smaller: a cross-origin YouTube thumbnail
taints the canvas and fails the WebGL texture upload outright, so real artwork has
to be a same-origin file whatever we decide. The real reason is that **nobody has
been asked.** Publishing a partner's channel art or a still from their episode is
theirs to grant. The band says so on the page rather than leaving a visitor to
assume. Drop-in path: `public/channels/<handle>.jpg` and one line in
`src/content/channels.ts`.

**This is the open question the round cannot answer.** The founder asked for
"logo or youtube thumbnail". What is shipped is the real name over an abstract
screen, because consent is a founder call and not a design one.

## How this round differs from r1–r4, and what that costs

Rounds 1–4 fanned out to five models, produced self-contained HTML in
`variants/*/index.html`, and were ranked blind on the board. **r5 does none of
that.** Six variants, one model, no blind, no cost table — each one implemented
in `app/` on its own branch, as a working page.

That is a deliberate trade against the failure `design/README.md` documents at
length: for three rounds the board showed one thing and `app/` served another, so
the rankings decided nothing. Here the thing being reviewed *is* the thing that
would ship. Check one out and run `pnpm dev`.

What it costs, stated plainly so the next round can decide differently:

- **No blind.** The reviewer knows which variant is which, so the bias the board
  exists to remove is back.
- **No model comparison.** One model wrote all six. Nothing here is evidence
  about which model designs better.
- **No cost accounting.** `usage.json` and the board's price column do not apply.

If the founder wants the r1–r4 protocol back for r6, the way to get both is to
port the winner first and fan out from the shipped page.

## The variants

| id | idea | screen |
|---|---|---|
| `press` | Newspaper front page. Type carries it; the screen is the picture beside the story. | 14px plate |
| `billboard` | The screen is the whole hero, full bleed. The claim is knocked out of it on paper. | 28px field |
| `ab` | The layout is the argument: two identical screens, one rule, `A` and `B`. | 16px pair |
| `ticker` | The trust band is the hero — first thing on the page, above the headline. | 12px tiles |
| `stamp` | One screened disc, printed like a proof stamp. The only circle the system allows. | 20px disc |
| `bands` | Three full-bleed bands at three pitches, content knocked out on paper plates. | 26 / 7 / 11px |

## Ranking this round

The board cannot show these — they are Next.js routes, not standalone documents,
and `tools/verify-round.mjs` reads `variants/*/index.html`. Rank them by checking
out each branch, or from the previews in each variant's `NOTES.md`.

The rubric is unchanged: **clarity · hierarchy · voice · restraint · proof**.
Write the verdict into `design/rounds/r5/VERDICT.md`. A round is finished when
`app/` matches the winner — which here means merging one PR and closing five.
