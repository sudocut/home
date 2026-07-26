# Design rounds

A round asks **one question**, answers it with several variants built by
**different models**, ranks them **blind**, and writes a **verdict** that becomes
the next round's brief.

The visual system is already settled (`brand/`, `CONSTITUTION.md`). Rounds explore
**layout, information architecture, copy, and rhythm** inside it. Holding the
variables constant is what makes the comparison mean anything.

---

## Run a round

```bash
bash tools/new-round.sh              # 1. scaffold r<n> from the template
$EDITOR design/rounds/r1/BRIEF.md    # 2. say what to design, and what NOT to
node tools/generate.mjs r1           # 3. fan out to every available model
node tools/verify-round.mjs r1       # 4. enforce the constitution, index for the board
bash tools/serve.sh                  # 5. rank blind at the printed URL
$EDITOR design/rounds/r1/VERDICT.md  # 6. write what the next round must do
```

Steps 3–5 are the loop. Step 6 is the part that makes it iteration rather than
repetition — skip it and round 2 repeats round 1's mistakes.

## Worked example

```
$ bash tools/new-round.sh
created design/rounds/r1

$ node tools/generate.mjs r1
round r1 — generating with 4 model(s)
  ✓ opus-a       11.4kb (48s)
  ✓ fable-a       9.2kb (31s)
  ✓ gpt-a        13.1kb (72s)
  ✓ kimi-a        8.8kb (55s)
4 written, 0 skipped, 0 failed

$ node tools/verify-round.mjs r1
round r1 — 4 variant(s)
  ✓ opus-a
  ✗ fable-a
      colour #4a90d9 is outside the palette — use a var(--sc-*) token
      blurred shadow — must be hard offset, zero blur: box-shadow: 0 2px 8px rgba(0,0,0,.1)
  ✓ gpt-a
  ✓ kimi-a
1 problem(s). Fix them before ranking.

$ node tools/generate.mjs r1 --only fable --force     # retry just that one
$ node tools/verify-round.mjs r1
round r1 is ready to rank.

$ bash tools/serve.sh
  board →  http://localhost:4173/design/board/?round=r1
```

---

## The board

Live previews side by side, five criteria at 1–5, and a required note per variant.

- **Blind by default.** Model identity is hidden until you export. Manifest order
  is shuffled deterministically, so screen position carries no signal either.
- **Fullscreen A/B:** click a preview. `←`/`→` flips variants in place, `1`–`5`
  scores and auto-advances, `esc` closes. Flipping in place is the fastest way to
  see a real difference.
- **Progress is saved** to `localStorage` per round — a half-finished session
  survives a reload.
- **Export** copies to clipboard *and* downloads `RANKING.md`. Save it to
  `design/rounds/<r>/RANKING.md` and re-run `verify-round.mjs` to validate it.

The board cannot write files (it's a static page), so that last save is manual.
It tells you the exact destination path.

## The rubric

| Criterion | Question |
|---|---|
| **clarity** | Does a first-time visitor understand what SudoCut does within one screen? |
| **hierarchy** | Is there exactly one required action, and does it read first? |
| **voice** | Direct, numeric, editor-to-editor — or drifting into hype? |
| **restraint** | Would removing anything improve it? |
| **proof** | Does it show evidence rather than claim capability? |

Derived from `soul.md`. Change them in `design/models.json` → `criteria` if a round
needs different ones, but changing them mid-experiment makes rounds incomparable.

## Models

`design/models.json` is the registry. Check what's actually reachable:

```bash
node tools/generate.mjs --check
```

Verified on this machine 2026-07-26, all at **maximum reasoning effort**:

| id | model | effort | $/1M in | $/1M out | driver |
|---|---|---|---|---|---|
| `opus5` | Claude Opus 5 | `max` | 5.00 | 25.00 | `claude -p --effort max` |
| `fable5` | Claude Fable 5 | `max` | 10.00 | 50.00 | `claude -p --effort max` |
| `gpt-sol` | GPT-5.6 Sol | `xhigh` | 5.00 | 30.00 | `codex exec -c model_reasoning_effort` |
| `gpt-terra` | GPT-5.6 Terra | `xhigh` | 2.50 | 15.00 | `codex exec -c model_reasoning_effort` |
| `kimi-k3` | Kimi K3 | `high` | 3.00 | 15.00 | `kimi -m kimi-code/k3 -p` |

`opencode` is installed but disabled — it routes across providers, so which model
answered would be ambiguous, which defeats the point.

> **Kimi is not literally comparable.** It has no per-invocation effort flag; its
> ceiling is `effort = "high"` in `~/.kimi-code/config.toml`. The other four are
> set to their true maximum per call. Don't read a Kimi result as "K3 at max".
>
> Its **cost is comparable**, though — that was a harness gap, not a Kimi one.
> The CLI records token usage in its session log rather than on stdout, so r2 and
> r3 first recorded `null`. Both are now recovered: **r2 $0.1898, r3 $0.2777.**

## Cost

**One design = one session.** `generate.mjs` captures each session's token usage
from the CLI's own structured output and prices it against the rates above,
writing `variants/<id>/meta.json` and the round's `usage.json`.

The board shows cost per variant and a round total — but **only after the blind is
lifted**. Price tiers identify the vendor as surely as the name does, so revealing
cost during judging would break the blind. Both reveal together.

Where the numbers are unavailable the field is `null`, never `0` — an unknown cost
is never silently priced as free. Anthropic's CLI also self-reports a cost, which
is recorded alongside ours as a cross-check.

Prices are list API rates as of 2026-07-26 ([Anthropic](https://www.aipricing.guru/anthropic-pricing/),
[OpenAI](https://www.aipricing.guru/openai-pricing/), [Moonshot](https://benchlm.ai/moonshot/api-pricing)).
They move — re-check `design/models.json` before quoting them anywhere that matters.
Note these are *list API* prices; the CLIs may run on a subscription, in which case
the figure is what the session *would* cost via API, not what you were charged.

### Three tokens are called "input"

They differ by 10× in price, and the three CLIs disagree about which one they mean:

| class | billed at | codex | claude | kimi |
|---|---|---|---|---|
| fresh input | 1× | inside `input_tokens` | `input_tokens` | `inputOther` |
| cache read | ~0.1× | `cached_input_tokens` — **also inside `input_tokens`** | `cache_read_input_tokens` | `inputCacheRead` |
| cache write | 1.25–2× | — | `cache_creation_input_tokens` | `inputCacheCreation` |

`tools/lib/cost.mjs` normalises all three to the **disjoint** form before pricing.
Each model declares its convention as `usageBasis` in `models.json`; one on the
`inclusive` convention gets its cache reads subtracted from `input` exactly once.

This is not a footnote. Getting it wrong bills the cached tokens twice, at ten
times the right rate, and the result looks entirely plausible. r2 and r3 shipped
that way: **GPT-5.6 Sol's r3 session was reported at $7.10 and actually cost
$1.57.**

So the round total is not a leaderboard of who thought hardest. **The output
column measures effort; the cost column measures price. They are only loosely
related.** The board and `RANKING.md` print fresh and cached input separately so
that difference is visible rather than inferred.

### Turn count, not model tier, is what makes a session expensive

`codex exec` is an agent: it has shell access, the repo, and a skills directory,
and every turn resends the whole conversation, so input grows superlinearly in
turns. Whether it takes them is a *behavioural* choice that varies run to run:

| | turns | tool calls | cumulative input | cost |
|---|---|---|---|---|
| Sol, r2 | 1 | 0 | 23,657 | $0.1892 |
| Sol, r3 | 12 | 10 | 672,851 | $1.5672 |
| Terra, r2 | 1 | 0 | 20,734 | $0.0592 |
| Terra, r3 | 1 | 0 | 20,843 | $0.0898 |

Same CLI, same flags, same prompt. In r3 Sol spent its first three turns reading
76KB of `~/.codex/skills/gstack/design-html/SKILL.md` — a file from an unrelated
toolchain, not this repo — then read the tree, then ran `tools/verify-round.mjs`
against its own draft. Terra, given the identical brief, answered in one shot.

Two things follow. **An expensive Sol run is an outlier, not a tier property** —
don't generalise from one round. And **the models are not receiving identical
context** even though they receive an identical prompt, because two of the five
CLIs can go and fetch more. That is a real limit on what a round can conclude
about "which model designs better", and it is not fixable by editing the brief.

### The models can write to your repo, and one did

The output contract says *print the document to stdout, never write files*. That
is a sentence in a prompt, and a prompt is not a permission system. On
**2026-07-26 a `kimi -p` run asked for a new variant instead overwrote
`design/rounds/r3/variants/kimi-k3-a/index.html`** — a variant from a finished,
committed round. Rounds are supposed to be immutable. Nothing reported it; it
surfaced only because the cost attribution started naming the wrong session.

`tools/lib/repo-guard.mjs` now fingerprints the working tree before each fan-out
and compares after:

- files **clean before, dirty after**, that this run was not entitled to write →
  restored from `HEAD`, and named on stderr;
- files **already dirty** before the run → never touched, so your work in
  progress is safe;
- **untracked** files a model created → reported, never deleted.

Two things it does *not* do. It cannot attribute the write to a specific model
when several run in parallel — it tells you a model did it, not which. And it
only protects what is committed: **run a round from a clean tree.** If a variant
is uncommitted when a model overwrites it, there is nothing to restore it from.

### Re-pricing a finished round

```bash
node tools/recost.mjs r3            # one round
node tools/recost.mjs --all --dry   # preview every round
```

Rounds are immutable, but `usage.json` is *derived*. `recost.mjs` replays the
current rates and counting rules over counts already on disk. It never re-runs a
model, never touches a variant's HTML, and is idempotent. Use it when a published
rate moves or a counting bug is found.

It also **backfills usage from a CLI's own session log**. Kimi's cost was `null`
for two rounds — not because the CLI fails to measure it, but because
`--output-format stream-json` does not print it. It is in
`~/.kimi-code/sessions/**/wire.jsonl` as per-turn `usage.record` events, which
sum. Sessions are attributed **by the document they produced**, never by clock:
r2's Kimi variant came from a session that began 19 minutes before the file was
written, and the nearest-in-time session was a later retry carrying 8× the tokens.

### `verified` vs `assumed` rates

Only Anthropic's CLI reports a cost of its own, so only its rates are reconciled.
`cacheWrite` there is **2× input — the 1-hour cache**, not the 1.25× 5-minute
rate first assumed; at 2× our figure equals `total_cost_usd` to the cent on all
four Anthropic sessions run so far. OpenAI and Moonshot rates are marked
`assumed`: list prices we applied with nothing to check them against. The board
labels those variants `list rate, unreconciled` rather than showing them with the
same confidence.

Every model gets the identical prompt (`design/BRIEF.md` + the round brief) and
**prints one HTML document to stdout**. The runner extracts and writes it. Models
never write files themselves — that's what keeps four different CLIs interchangeable.

**Degrades honestly.** With one model reachable it runs one and says so. For a
model with no CLI, `generate.mjs` prints the exact manual procedure instead of
pretending — paste the brief in, save the HTML to
`design/rounds/<r>/variants/<model>-a/index.html`, and it joins the round like any
other variant.

**Resumable.** Existing variants are skipped; `--force` regenerates. `--letter b`
takes a second run from the same model, which is how you tell a model's *range*
from a single lucky sample.

## Files in a round

```
design/rounds/r1/
├── BRIEF.md         what to design this round (you write)
├── variants/
│   └── <model>-<letter>/index.html
├── manifest.json    generated — blind labels + paths, read by the board
├── RANKING.md       exported from the board, machine-validated
└── VERDICT.md       what the next round must do (you write)
```

Rounds are **immutable once run** and live in git as readable text. `new-round.sh`
refuses to overwrite one.

## Why blind

Model attribution biases judgement, in both directions — you go easy on the model
you like and hunt for faults in the one you don't. Since a second thing being
measured here is *which model designs well against a fixed brief*, that bias would
corrupt the finding. Reveal happens on export, after the scores are locked.

## Why verify before ranking

A variant that invented a colour or rounded a corner isn't a bold interpretation,
it's a variant that ignored the brief. Ranking it against compliant ones compares
two different questions. `verify-round.mjs` enforces `CONSTITUTION.md` mechanically
so the human only ever judges *design*, never *compliance*.
