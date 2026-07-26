# tools/

Five scripts. No dependencies beyond node and python3 — nothing to install.

| Script | Does |
|---|---|
| `build-tokens.mjs` | `brand/tokens/tokens.json` → `tokens.css`. Regenerates only the managed `:root` block; refuses to emit a superseded Option H value. |
| `new-round.sh` | Scaffolds the next round from `design/rounds/_template`. Refuses to clobber an existing round. |
| `generate.mjs` | Fans the brief out to every available model in parallel and writes the variants. |
| `verify-round.mjs` | Enforces `design/CONSTITUTION.md` on every variant, validates `RANKING.md`, and writes the `manifest.json` the board reads. |
| `serve.sh` | Static server rooted at the repo, so variants can resolve `/brand/tokens/tokens.css` and `/fonts/*`. Prints the board URL. |

## Usage

```bash
node tools/build-tokens.mjs             # after editing tokens.json

bash tools/new-round.sh                 # or: bash tools/new-round.sh r4
node tools/generate.mjs --check         # which models are actually reachable?
node tools/generate.mjs r1              # generate variants
node tools/generate.mjs r1 --only opus --force   # redo one
node tools/generate.mjs r1 --letter b   # a second take from each model
node tools/verify-round.mjs r1          # gate + index
bash tools/serve.sh                     # rank at the printed URL
```

`generate.mjs` flags: `--check` · `--force` · `--only a,b` · `--letter x` · `--timeout 300`

## Notes

- **`serve.sh` must be rooted at the repo**, not at `design/`. Variants link
  `/brand/tokens/tokens.css` by absolute path; serving from anywhere else silently
  strips every variant's styling and you would rank unstyled pages.
- **`verify-round.mjs` both gates and indexes.** Fused deliberately: one place
  scans a round, so the board can never disagree with the checker about what a
  round contains.
- **`build-tokens.mjs` is idempotent** — run it twice, get a byte-identical file.
  It only rewrites between the `>>> GENERATED <<<` markers, leaving the
  hand-authored `@font-face` and `@media` blocks alone.
