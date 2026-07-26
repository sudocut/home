# Working in sudocut/home

The SudoCut **company website**. Not the product app (that's `sudocut/web`).

## Authority order — settled, do not re-litigate

1. `meta/strategy/soul.md` — the constitution
2. `sudocut/web` shipped Round 6 (`design/mockups/shared/bauhaus.css`, `body[data-round="6"]`)
3. `brand/reference/option-h-*.pdf` — an exploration, values superseded

A lower layer never overrides a higher one. If you think it should, say so and
stop — don't quietly resolve it.

## Hard rules

**Never write a color, font-family, radius, shadow, or easing literal.** Every one
routes through `var(--sc-*)`, defined in `brand/tokens/`. Values enter the codebase
in exactly one file. If you need a new shade, derive it with `color-mix()` against
an existing token — never hand-pick a hex.

- **One point color.** Cobalt `--sc-action` marks the single required action, at
  most **once per view**. Two cobalt objects on one page is a bug.
- `--sc-signal-red` / `--sc-signal-yellow` are **status only**. Never decoration.
- **`radius: 0`.** No rounded corners except `50%` circles.
- **Shadows are hard offset, zero blur.** `6px 6px 0`, `9px 9px 0` on hover.
  A blur radius is a rejection.
- **Three typefaces:** Hahmlet (display) · SUIT (UI/Korean) · Jost (numerals).
  **Never IBM Plex** — it cannot set Hangul, and Korean is a shipped locale.
- **English first, Korean second** (constitution D5, founder 2026-07-26 — this
  REVERSES soul.md's "Korean-first is our home"; the gap is tracked in
  `docs/open-questions.md`). `en` is the default locale; copy lives in
  `messages/`, never hardcoded in components. Korean is written as Korean.
- **Paper texture shader: measured settings only** (constitution D6, rewritten
  2026-07-27). `paperTexture` via `--sc-paper-fibre` / `--sc-paper-lit`, contrast
  .55 / roughness .30 / fibre .70 / fibreSize .40, static, **and a loaded
  `u_image`** — without one `u_imageAspectRatio` stays 0 and the fibre renders
  nothing at any setting. Never tune by eye; run `node tools/shader-probe.mjs` and
  update D6's table with the numbers. Every other shader, animation, and
  `halftone-cmyk` stay banned.
- Gradients only for the 76px hairline grid.
- `prefers-reduced-motion` must kill all animation.

Full list with sources: `design/CONSTITUTION.md`.

## After changing tokens

```bash
node tools/build-tokens.mjs     # regenerates brand/tokens/tokens.css
```

`tokens.css` is generated between the `>>> GENERATED <<<` markers. Don't hand-edit
that region. The `@font-face` and `@media` blocks around it are hand-authored.

## Design rounds

Don't redesign pages by argument — run a round. `design/README.md` has the protocol.
The site's layout is decided by ranked, blind comparison of variants from several
models, not by any single model's taste (including yours).

If you're asked to change the site's visual design, check whether it's a
constitution question first. If it is, it needs a round or a founder decision.

## Verifying

```bash
pnpm lint && pnpm typecheck && pnpm build
node tools/verify-round.mjs          # if you touched design/
# Literal colours or typeface names — both must be empty. `font-family: var(--sc-*)`
# is compliant, so it is filtered out; the old one-liner flagged four correct lines,
# which meant "must be empty" was never true and the check was never really run.
grep -rnE '#[0-9a-fA-F]{6}' app/ src/
grep -rn 'font-family:' app/ src/ | grep -v 'var(--sc-'

node tools/shader-probe.mjs         # if you touched D6's shader settings
```

## Honesty

soul.md says *honesty over polish*. If something is a stub, label it a stub. If a
value is reconstructed rather than official (the logo vectors are), say so. Don't
present placeholder content as real, and don't report work as verified unless you
actually ran it.
