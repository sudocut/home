# brand/print/

Print-ready logo files and the namecard, built from `brand/tokens/` and the
geometry in `brand/logo/README.md`. Nothing here introduces a value that the
brand kit does not already own.

Two things differ from the web assets, both deliberate:

- **The wordmark is outlined.** `brand/logo/lockup-*.svg` use live `<text>` and
  carry the warning *"convert to outlined paths before sending anywhere outside
  our own surfaces."* These are that conversion. No font is required to render
  them, so a printer cannot substitute a face.
- **Colors are literal hex, not CSS variables.** A print file has no cascade.

## The card

**오프린트미 · 글로벌 (OPM) 85 × 55 mm · 라운드 재단**

| | |
|---|---|
| Trim | 85 × 55 mm |
| Artboard | 91 × 61 mm (3 mm bleed all round) |
| Safe area | 79 × 49 mm (3 mm inside trim) |
| Corner | R3 — meets 오프린트미's 3R minimum |
| Output | Vector PDF, fonts embedded, 91.02 × 61.04 mm measured |

Nothing on either face reaches the safe boundary; the closest element clears it by
more than 2 mm. Open [`namecard/preview-proof.png`](namecard/preview-proof.png) to
see trim, safe area, and the cut result at actual size.

### Files

| File | Use |
|---|---|
| `namecard/front.pdf` | Front — lockup, name, role, contact |
| `namecard/back-a.pdf` | Back A — the tagline. **Recommended.** |
| `namecard/back-b.pdf` | Back B — mark alone |
| `namecard/*-stock.pdf` | Same art with **no paper flood** — see below |
| `namecard/preview-*.png` | Review images, 300 dpi |
| `namecard/*.html` | Sources. The PDFs are generated from these. |
| `namecard/card.json` | The card's data. Edit this, not the HTML. |

## Two decisions to make before ordering

### 1. Flood the paper colour, or choose the paper?

`--sc-paper` `#f1f1ec` is a *surface*, and the brand kit is explicit that warmth
comes from paper plus grid rather than from a texture. On screen the surface has
to be painted. On a card it does not.

**Prefer the `-stock` files and a warm uncoated stock.** A pale flood tint across
a whole card is a large area of light ink: it bands, it shows roller marks, and it
makes an uncoated sheet feel coated. Choosing the stock gets the same colour from
the material, which is what the kit describes in the first place.

Use the flood files only if no warm stock is available and the card would otherwise
print on cold white.

### 2. Cobalt will shift, and there is no fix

**`--sc-accent` `#1f55ff` is outside the CMYK gamut.** It is a saturated blue that
four process inks cannot reach. It will print duller and slightly more violet than
it looks on screen, on every press, every time. This is physics, not a settings
mistake, and it is worth knowing before the first box arrives rather than after.

The options are to accept the shift — reasonable, since cobalt appears once per
face and never behind text — or to order a spot colour, which standard namecard
runs do not offer. **Accept it, and judge the real card rather than the screen.**

### Ink values

| Element | Set as | Note |
|---|---|---|
| All ink type, rules, mark bars | **K100** | Not a 4-colour build |
| Cobalt cut line, `cut`, `rm` | **C88 M67 Y0 K0** | Starting point; expect the shift above |
| Paper | stock, or `#f1f1ec` flood | See decision 1 |

K100 rather than a CMYK match of `#24292c` is a print-domain choice, not a token
change. The card carries 0.1 mm hairlines and 2 mm type; a four-colour black puts
every one of them at the mercy of registration, and a fringe on a hairline is far
more visible than the difference between slate and neutral black on paper.

## Round corners and `radius: 0`

The brand kit sets `--sc-radius: 0px` and lists rounded corners under misuse. A
die-cut corner is the shape of the object, not a drawn rectangle, so the two do not
actually conflict — **provided nothing on the card reads as a rounded rectangle.**

That is why both faces sit on paper with no flood-filled panel. A card with an ink
back would have its corner arc trace an ink edge, and the eye would read a rounded
rectangle. On paper the arc is the card, and the brand's square-corner rule is
untouched.

## Before you order

- [ ] Fill in `card.json`. **Phone is intentionally empty** — this repository is
      public, so a mobile number does not belong in it. Add it locally, print, and
      do not commit it.
- [ ] Leave the role as recorded. `company/people.md` in the company brain states
      that **CEO, CTO, and other executive titles have not been ratified**, and that
      a title is recorded only after the founders adopt one. `Cofounder` is the
      recorded relationship. A namecard is the easiest place in a company to mint a
      title nobody agreed to.
- [ ] Replace `name@sudo-cut.com` with the real address.
- [ ] Pick back A or back B.
- [ ] Confirm 오프린트미's own 작업 가이드 for 글로벌 사이즈. These files use a
      standard 3 mm bleed, which every Korean printer accepts, but 오프린트미
      publishes its own working size and theirs should win if it differs.

## Rebuilding

```bash
python3 -m venv .venv && .venv/bin/python -m pip install fonttools
cd brand/print/tools
../../../.venv/bin/python gen_logo.py      # outlines the wordmark from Jost
../../../.venv/bin/python build_card.py    # writes the card HTML
FLOOD=0 ../../../.venv/bin/python build_card.py   # the -stock variants
```

Then print each HTML to PDF at its `@page` size. The card geometry lives at the top
of `build_card.py`; the wordmark outlines are regenerated from
`public/fonts/Jost-Variable.ttf` at weight 400 with the kit's −1.6 tracking, so the
letterforms cannot drift from the shipped face.

Fonts are SIL OFL and embedding them in a PDF is permitted. Licences are vendored at
`public/fonts/OFL.txt`.
