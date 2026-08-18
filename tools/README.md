# tools/

Repository-local design and verification scripts. Most scripts use only Node;
channel artwork verification also uses the pinned `sharp` and `playwright-core`
dev dependencies from `package.json`.

| Script | Does |
|---|---|
| `build-tokens.mjs` | `brand/tokens/tokens.json` → `tokens.css`. Regenerates only the managed `:root` block; refuses to emit a superseded Option H value. |
| `new-round.sh` | Scaffolds the next round from `design/rounds/_template`. Refuses to clobber an existing round. |
| `generate.mjs` | Fans the brief out to every available model in parallel and writes the variants. |
| `verify-round.mjs` | Enforces `design/CONSTITUTION.md` on every variant, validates `RANKING.md`, and writes the `manifest.json` the board reads. |
| `recost.mjs` | Re-prices a finished round's `usage.json` from counts already on disk. Never re-runs a model. |
| `serve.sh` | Static server rooted at the repo, so variants can resolve `/brand/tokens/tokens.css` and `/fonts/*`. Prints the board URL. |
| `build-channel-art.mjs` | Builds deterministic channel profile WebP derivatives from cleared retained originals; `--finalize` records measured served hashes and byte counts. |
| `verify-channel-art.mjs` | Verifies channel image provenance, dimensions, checksums, served byte ceiling, deterministic regeneration, and configured `art` paths. |
| `verify-channel-browser.mjs` | Runs the built Next site in Chrome and checks the channel profile image browser contract across locales, viewports, motion settings, and image fallback. |
| `lib/cost.mjs` | Token counts → dollars, in one place. Normalises three CLIs' disagreeing definitions of "input", and recovers Kimi's usage from its session log since it prints none. |
| `lib/repo-guard.mjs` | Restores anything a model wrote to the repo that it wasn't asked to write. The print-to-stdout contract is a prompt, not a permission system. |
| `lib/channel-art.mjs` | Shared channel profile manifest parser, hashing, deterministic transform, finalization, and verification helpers. |

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

node tools/recost.mjs --all --dry       # preview a re-price of every round
node tools/recost.mjs r3                # apply it to one

pnpm channels:finalize-assets           # one-time source manifest -> served WebPs + final hashes
pnpm channels:build-assets              # regenerate served WebPs from a final manifest
pnpm channels:verify-assets             # verify provenance, hashes, dimensions and configured art paths
pnpm channels:test                      # run channel-art and browser-helper unit tests
pnpm build && pnpm channels:verify-browser
```

`generate.mjs` flags: `--check` · `--force` · `--only a,b` · `--letter x` · `--timeout 300`

## Notes

- **`serve.sh` must be rooted at the repo**, not at `design/`. Variants link
  `/brand/tokens/tokens.css` by absolute path; serving from anywhere else silently
  strips every variant's styling and you would rank unstyled pages.
- **A busy port is usually your own server.** `serve.sh` fetches `board.js` from
  whatever is listening and compares it byte for byte. Same bytes → it prints the
  board URL and exits 0, because starting a second one is not what you wanted.
  Different bytes → it says another worktree is serving there, which in a repo
  with sibling worktrees is the answer you actually need.
- **`verify-round.mjs` both gates and indexes.** Fused deliberately: one place
  scans a round, so the board can never disagree with the checker about what a
  round contains.
- **`build-tokens.mjs` is idempotent** — run it twice, get a byte-identical file.
  It only rewrites between the `>>> GENERATED <<<` markers, leaving the
  hand-authored `@font-face` and `@media` blocks alone.
- **`recost.mjs` is idempotent too**, and deliberately weaker than it looks: it
  re-derives `usage.json` and nothing else. Rounds stay immutable — no variant
  HTML is read except to identify which CLI session produced it.
- **Pricing lives in `lib/cost.mjs`, not in `generate.mjs`.** Both the live
  runner and the re-pricer import it, so a finished round and a fresh one can
  never be priced by two different rules. `design/README.md` § Cost explains the
  rules and why they are not obvious.
- **Run a round from a clean tree.** `generate.mjs` restores files a model
  wrongly wrote by checking them out of `HEAD` — which only works if they were
  committed. An uncommitted variant overwritten by a model is gone.
