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
  **Never IBM Plex** — it cannot set Hangul, and Korean is the default locale.
- **Korean-first.** `ko` is the default locale; copy lives in `messages/`, never
  hardcoded in components.
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
grep -rnE '#[0-9a-fA-F]{6}|font-family:' app/ src/    # must be empty
```

## Honesty

soul.md says *honesty over polish*. If something is a stub, label it a stub. If a
value is reconstructed rather than official (the logo vectors are), say so. Don't
present placeholder content as real, and don't report work as verified unless you
actually ran it.
