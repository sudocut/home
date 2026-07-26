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
| `kimi-k3` | Kimi K3 | `high` | 3.00 | 15.00 | `kimi -p --auto` |

`opencode` is installed but disabled — it routes across providers, so which model
answered would be ambiguous, which defeats the point.

> **Kimi is not literally comparable.** It has no per-invocation effort flag; its
> ceiling is `effort = "high"` in `~/.kimi-code/config.toml`. The other four are
> set to their true maximum per call. Don't read a Kimi result as "K3 at max".

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
