# brand/print/

Print-ready logo files, built from `brand/tokens/` and the geometry in
`brand/logo/README.md`. Nothing here introduces a value the brand kit does not
already own.

Two things differ from the web assets, both deliberate:

- **The wordmark is outlined.** `brand/logo/lockup-*.svg` use live `<text>` and
  carry the warning *"convert to outlined paths before sending anywhere outside
  our own surfaces."* These are that conversion. No font is required to render
  them, so a printer cannot substitute a face.
- **Colours are literal hex, not CSS variables.** A print file has no cascade.

## Files

| File | Lockup | Use |
|---|---|---|
| `logo/mark.svg` | 3 | The mark alone, on paper |
| `logo/mark-mono.svg` | 6 | Single ink — engraving, stamp, one-colour print |
| `logo/wordmark.svg` | — | Wordmark alone, `sudo` ink + `cut` cobalt |
| `logo/lockup-horizontal.svg` | 1 | Primary lockup |
| `logo/lockup-stacked.svg` | 2 | Narrow columns, square placements |
| `logo/lockup-horizontal-reversed.svg` | 4 | On an ink field |

Minimum print size is **8 mm wide** for the mark. Below that the 4x cut line stops
holding, and the cut disappearing is the one failure the mark cannot survive.

## Ink values

| Element | Set as | Note |
|---|---|---|
| Bars, type, rules | **K100** | Not a four-colour build |
| Cut line, `cut` | **C88 M67 Y0 K0** | Starting point — see below |

K100 rather than a CMYK match of `#24292c` is a print-domain choice, not a token
change. Fine rules and small type at a four-colour black are at the mercy of
registration, and a fringe on a hairline is far more visible on paper than the
difference between slate and neutral black.

**`--sc-accent` `#1f55ff` is outside the CMYK gamut.** It is a saturated blue that
four process inks cannot reach, so it prints duller and slightly more violet than
it looks on screen, on every press. This is physics, not a settings mistake. Accept
it and judge the printed piece, or specify a spot colour where the run supports one.

## Rebuilding

```bash
python3 -m venv .venv && .venv/bin/python -m pip install fonttools
cd brand/print/tools && ../../../.venv/bin/python gen_logo.py
```

The wordmark is regenerated from `public/fonts/Jost-Variable.ttf` at weight 400 with
the kit's −1.6 tracking, so the letterforms cannot drift from the shipped face.
Fonts are SIL OFL and embedding them is permitted; licences are at
`public/fonts/OFL.txt`.

## The namecard is not here

It lives in **`sudocut/company`** at `collateral/namecard/`, because a namecard is
company collateral carrying a person's name, role, and contact details — and this
repository is public. The logo above is public by nature; it is on the website. A
person's card is not.
