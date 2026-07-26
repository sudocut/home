# r4 — ranking

Produced by the board (`bash tools/serve.sh`). Paste the exported file here whole.
Validated by `node tools/verify-round.mjs`.

**Judged blind** — model identity is hidden until the ranking is submitted.

## Result

<!-- The board fills this table. Rank 1 = best. -->

| Rank | Variant | Model | Mean | Note |
|---|---|---|---|---|
|  |  |  |  |  |

## Data

The block below is the machine-readable record. `verify-round.mjs` parses it, and
the next round's brief is written from it. Every variant needs a note — a ranking
without reasons cannot brief anything.

```json
{
  "round": "r4",
  "judge": "",
  "date": "",
  "blind": true,
  "criteria": ["clarity", "hierarchy", "voice", "restraint", "proof"],
  "variants": []
}
```

<!-- Shape of one variant entry:

  {
    "id": "opus-a",
    "model": "opus",
    "label": "C",
    "rank": 1,
    "scores": { "clarity": 5, "hierarchy": 4, "voice": 4, "restraint": 5, "proof": 3 },
    "mean": 4.2,
    "note": "Hero states the promise in one line. The proof sits below the fold, which weakens it."
  }

  scores are 1-5. note is required.
-->
