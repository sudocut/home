# tokens/

`tokens.json` is the source of truth. `tokens.css` is generated from it by
`tools/build-tokens.mjs` — **never hand-edit the CSS.**

## The one rule

> Nothing outside this directory may declare a color, typeface, spacing, radius,
> shadow, or easing literal.

If you find a hex code in a component, that's a bug.

## Two tiers

**Raw** values name what a color *is*:

```css
--sc-accent: #1f55ff;
--sc-paper: #f1f1ec;
```

**Semantic** roles name what a color is *for*:

```css
--sc-action: var(--sc-accent);      /* the one required action */
--sc-surface: var(--sc-paper);
--sc-status-error: var(--sc-signal-red);
```

**Components reference semantic tokens only.** That way "what is our accent" and
"what is an action" stay separate questions, and a palette change is one file.

## Origin tags

Every entry in `tokens.json` carries an `origin`, so no value is ever unsourced:

| Tag | Means |
|---|---|
| `soul` | Mandated by `meta/strategy/soul.md`. |
| `web-shipped` | Verbatim from `sudocut/web`, cited to file and line. |
| `option-h` | Survives the Option H exploration because it conflicts with nothing above it. |
| `derived` | Computed from another token. Derivation shown. |

If you can't tag it, you don't know where it came from — go find out before adding it.

## Deriving colors

Use `color-mix()` against existing tokens, exactly as `bauhaus.css` does:

```css
color-mix(in srgb, var(--sc-ink) 5%, transparent)         /* row hover */
color-mix(in srgb, var(--sc-accent) 18%, var(--sc-panel)) /* selected  */
```

Never hand-pick a hex to mean "slightly lighter ink." That is how palettes rot.

## Naming

`--sc-` prefix on everything, kebab-case, role before modifier:
`--sc-shadow-action`, `--sc-shadow-action-hover`.
