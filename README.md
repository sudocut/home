# sudocut/home

The SudoCut **company website**, and the design system behind it.

> `sudo rm the boring parts.`

Not the product. The product app lives in [`sudocut/web`](https://github.com/sudocut/web);
strategy and meeting logs live in [`sudocut/meta`](https://github.com/sudocut/meta).

---

## Layout

```
brand/      the brand system — tokens, logo, voice. The only place brand values live.
design/     design rounds: brief → generate → rank → verdict → repeat
tools/      five zero-dependency scripts that run the loop
app/ src/   the Next.js site
```

## Quickstart

```bash
pnpm install
pnpm dev                 # site at http://localhost:3000
```

## Design authority

When two sources disagree, the higher one wins. This order is settled — see
[`brand/BRAND-KIT.md`](brand/BRAND-KIT.md).

1. **`meta/strategy/soul.md`** — the constitution. Never overridden.
2. **`sudocut/web` shipped Round 6** — the visual system of record.
3. **`brand/reference/option-h-*.pdf`** — an early exploration. Ideas, not values.

The rules that get things rejected: **one point color** (cobalt marks the single
required action, at most once per view), a **closed palette**, **three typefaces**
(Hahmlet · SUIT · Jost), **`radius: 0`**, **hard offset shadows with zero blur**,
and **Korean-first**. Full list: [`design/CONSTITUTION.md`](design/CONSTITUTION.md).

**Never hardcode a color, font, radius, shadow, or easing.** Everything routes
through `var(--sc-*)` from `brand/tokens/`. Change a value there and run:

```bash
node tools/build-tokens.mjs
```

## Design rounds

We don't design the site by argument. Each round asks one question, answers it
with variants built by **different models** (Opus, Fable, GPT, Kimi), ranks them
**blind**, and writes a verdict that becomes the next round's brief.

```bash
bash tools/new-round.sh              # scaffold the round
$EDITOR design/rounds/r1/BRIEF.md    # say what to design
node tools/generate.mjs r1           # fan out to every available model
node tools/verify-round.mjs r1       # enforce the constitution
bash tools/serve.sh                  # rank blind at the printed URL
$EDITOR design/rounds/r1/VERDICT.md  # what the next round must do
```

`r1` is written and ready to run. Full protocol: [`design/README.md`](design/README.md).

Variants that invent a color or round a corner are rejected mechanically before
you ever see them — so ranking only ever judges *design*, never compliance.

## Scripts

| | |
|---|---|
| `pnpm dev` / `build` / `start` | the site |
| `pnpm lint` / `typecheck` | biome + tsc |
| `pnpm tokens` | regenerate `tokens.css` from `tokens.json` |
| `pnpm design:new` / `generate` / `verify` / `board` | the round loop |

## Status

Skeleton. The brand system is settled and the iteration harness works end to end.
The site's final layout is what the rounds are for — `r1` is written but not yet run.

### Known issues

- **Fonts are unsubsetted.** `Hahmlet-Variable.ttf` is 3.4 MB and
  `SUIT-Variable.woff2` is 612 KB, copied as-is from `sudocut/web` where they were
  only ever used in local mockups. That is far too heavy for a production page and
  will hurt first paint. Both need subsetting to the glyphs we actually use and
  conversion to WOFF2 before launch.
- **Logo vectors are reconstructed**, not official — rebuilt from the published
  geometry. Exact, but replace them if the originals turn up.
- **The waitlist needs three environment variables or it cannot send.** See
  `.env.example`. Without them the form does not fake a success — it tells the
  visitor to email `support@sudo-cut.com` instead — but nothing reaches you, so
  set them before pointing a domain at this.
- **The homepage figures are illustrative, not measured.** `14:32 → 10:47` comes
  from `brand/voice.md`'s examples and is labelled as such on the page. Replace
  it with a real project's numbers when one is publishable — that would be a
  much stronger page.
- **No `Accept-Language` negotiation.** `/` always redirects to `/en`
  (constitution D5), so a Korean visitor lands on English and has to switch.
  Adding negotiation needs a root `middleware.ts`.
