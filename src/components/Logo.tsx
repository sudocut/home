import { readFileSync } from "node:fs";
import { join } from "node:path";

export type LogoVariant = "horizontal" | "stacked" | "mark";

/**
 * Renders an approved lockup from brand/logo/. brand/ is the source of truth —
 * nothing here re-draws the geometry.
 *
 * Why the SVG is inlined into the DOM instead of `<img src="/logo/mark.svg">`:
 * an SVG referenced through <img>, a CSS background or og:image is an ISOLATED
 * DOCUMENT. It inherits nothing from the page, so
 *   - `currentColor` resolves to black, and
 *   - `var(--sc-*)` falls back to the hex baked into the file, and
 *   - the `Jost Local` @font-face declared by brand/tokens/tokens.css does not
 *     exist, so the wordmark in the two lockups silently renders in a system
 *     sans — which is a misuse of the mark.
 * Inlining fixes all three. If you ever do need an <img>, use the explicit
 * per-surface file instead of hoping currentColor carries: mark.svg on paper,
 * mark-reversed.svg on ink, mark-on-accent.svg on cobalt. That is exactly why
 * those exist as separate files — see brand/logo/README.md.
 *
 * `tone` defaults to "mono", lockup 6, the single-ink form. This is not a style
 * preference: soul.md allows ONE cobalt object per view and this site spends it
 * on the single required action (ActionButton). A cobalt cut line in the header
 * would be the second one, i.e. a bug. Pass tone="accent" only on a view that
 * has no action at all.
 */
export type LogoProps = {
  variant?: LogoVariant;
  tone?: "mono" | "accent";
  className?: string;
};

const FILES: Record<LogoVariant, string> = {
  horizontal: "lockup-horizontal.svg",
  stacked: "lockup-stacked.svg",
  mark: "mark.svg",
};

const LOGO_DIR = join(process.cwd(), "brand", "logo");

/** `<?xml ... ?>` and the authoring comments are not valid inline HTML. */
const XML_PROLOG = /<\?xml[\s\S]*?\?>/g;
const COMMENT = /<!--[\s\S]*?-->/g;
/** Drop the intrinsic size from the root <svg> only; the wrapper sizes it. */
const ROOT_SIZE = /(<svg\b[^>]*?)\s+width="\d+"\s+height="\d+"/;
/** Single ink: every token-driven fill collapses to the inherited ink. */
const TOKEN_FILL = /fill="var\([^"]*\)"/g;

const cache = new Map<string, string>();

function loadLockup(variant: LogoVariant, tone: "mono" | "accent"): string {
  const key = `${variant}:${tone}`;
  const cached = cache.get(key);
  if (cached) return cached;

  // mark-mono.svg already ships as pure currentColor, so use it directly.
  const file = variant === "mark" && tone === "mono" ? "mark-mono.svg" : FILES[variant];
  let svg = readFileSync(join(LOGO_DIR, file), "utf8")
    .replace(XML_PROLOG, "")
    .replace(COMMENT, "")
    .replace(ROOT_SIZE, "$1")
    .trim();

  if (tone === "mono") svg = svg.replace(TOKEN_FILL, 'fill="currentColor"');

  cache.set(key, svg);
  return svg;
}

export function Logo({ variant = "mark", tone = "mono", className }: LogoProps) {
  const svg = loadLockup(variant, tone);
  return (
    <span
      className={className ? `sc-logo ${className}` : "sc-logo"}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: build-time read of our own brand/logo/*.svg, no user input reaches this path, and inlining is the only way the tokens and the Jost face resolve — see the note above.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
