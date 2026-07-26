#!/usr/bin/env node
/**
 * verify-round.mjs — check a round is well-formed, enforce the constitution,
 * and write the manifest the board reads.
 *
 *   node tools/verify-round.mjs [round]     # default: newest round
 *
 * Two jobs, deliberately fused so there is exactly one place that scans a round:
 *
 *   1. VERIFY  — mechanically enforce design/CONSTITUTION.md so spec-violating
 *                variants never reach a human. A model that invents a colour or
 *                rounds a corner has not been bold, it has ignored the brief.
 *   2. INDEX   — write rounds/<r>/manifest.json, assigning each variant a blind
 *                label (A, B, C...) in a deterministic but non-obvious order so
 *                screen position never correlates with which model produced it.
 *
 * Exit 0 = ready to rank. Exit 1 = fix something first.
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ROUNDS = join(ROOT, "design/rounds");

/* ---------- the constitution, as checks ---------- */

// Derived from brand/tokens/tokens.json, never hand-copied. A second transcription
// of the palette is a second place for it to drift — and it is the tooling's job to
// enforce "values enter the codebase in exactly one file", not to break it.
const TOKEN_COLOURS = (() => {
  const json = JSON.parse(readFileSync(join(ROOT, "brand/tokens/tokens.json"), "utf8"));
  const out = new Set();
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    if (typeof node.value === "string" && node.value.startsWith("#")) {
      out.add(node.value.toLowerCase());
    }
    for (const v of Object.values(node)) walk(v);
  };
  walk(json.color);
  return out;
})();

const PALETTE = new Set([
  ...TOKEN_COLOURS,
  // CSS allows either form of pure black and white.
  "#ffffff", "#fff", "#000000", "#000",
  // Inverted-surface shades the shipped Round 6 system sets inline in bauhaus.css
  // rather than as tokens. Kept explicit so their absence from tokens.json reads
  // as a known gap rather than an oversight.
  "#172128", "#313d44",
]);

const SUPERSEDED = {
  "#0d57f2": "#1f55ff (shipped cobalt)",
  "#111111": "#24292c (shipped slate ink)",
  "#f5f5f2": "#f1f1ec (shipped warm paper)",
  "#f5342a": "#ff3b2f (status token, not an accent)",
  "#3a3a38": "the shipped structure/muted ramp",
  "#8a8a86": "the shipped structure/muted ramp",
  "#e3e3de": "the shipped line/rail ramp",
};

const ALLOWED_FONTS = [
  "hahmlet", "suit", "jost",
  "ui-monospace", "sfmono-regular", "menlo", "consolas", "monospace",
  "sans-serif", "serif", "inherit", "var(",
];

/** Split a box-shadow value on top-level commas (not those inside rgba(...)). */
function splitShadows(value) {
  const parts = [];
  let depth = 0;
  let cur = "";
  for (const ch of value) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(cur);
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) parts.push(cur);
  return parts;
}

/**
 * Rule W5: a shadow is `Npx Npx 0 <color>` — hard offset, zero blur, zero spread.
 * The third length is the blur radius; anything non-zero is a violation.
 * Colour functions are stripped first so the digits inside rgba() aren't counted
 * as lengths, and bare `0` counts as a length (that was a real bug once).
 */
function findBlurredShadows(css) {
  const out = [];
  const re = /box-shadow\s*:\s*([^;}]+)/gi;
  let m;
  while ((m = re.exec(css))) {
    const value = m[1].trim();
    if (/^(none|inherit|initial|unset)$/i.test(value)) continue;
    if (value.includes("var(")) continue; // token reference, already compliant
    for (const part of splitShadows(value)) {
      if (/\binset\b/i.test(part)) continue; // inset rings are used by the shipped system
      const stripped = part
        .replace(/(rgba?|hsla?|color-mix|oklch|oklab|lab|lch)\([^)]*\)/gi, " ")
        .replace(/#[0-9a-fA-F]{3,8}\b/g, " ");
      const lengths = stripped.match(/-?\d*\.?\d+(px|rem|em|%)?/g) || [];
      if (lengths.length >= 3 && Number.parseFloat(lengths[2]) !== 0) out.push(part.trim());
    }
  }
  return out;
}

/**
 * Every `--sc-*: value` in the generated tokens.css, so a check can ask what a
 * token IS rather than only that it looks like one.
 */
const TOKEN_VALUES = (() => {
  const css = readFileSync(join(ROOT, "brand/tokens/tokens.css"), "utf8");
  const out = new Map();
  for (const m of css.matchAll(/(--sc-[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    out.set(m[1], m[2].trim());
  }
  return out;
})();

/**
 * Rule W5, second half: a `var(--sc-*)` in box-shadow is only compliant if the
 * token is actually a shadow. `box-shadow: var(--sc-lift)` passed every check we
 * had, but --sc-lift is `translate(-2px,-2px)` — a transform. The declaration is
 * invalid, the browser drops it, and the element silently renders with no shadow.
 * Checking the syntax of a token reference proves nothing about its type.
 */
function findMistypedShadowTokens(css) {
  const out = [];
  for (const m of css.matchAll(/box-shadow\s*:\s*([^;}]+)/gi)) {
    for (const ref of m[1].matchAll(/var\(\s*(--sc-[a-z0-9-]+)/gi)) {
      const name = ref[1];
      const value = TOKEN_VALUES.get(name);
      if (value === undefined) {
        out.push(`box-shadow references ${name}, which is not a token`);
      } else if (/^(translate|rotate|scale|matrix|skew)/i.test(value)) {
        out.push(`box-shadow: var(${name}) — that token is a TRANSFORM (${value}); the declaration is invalid and renders no shadow`);
      } else if (!/\d/.test(value)) {
        out.push(`box-shadow: var(${name}) — that token is not a shadow (${value})`);
      }
    }
  }
  return out;
}

/**
 * Rule S1 counted the wrong thing. It counted how many times the STYLESHEET
 * mentions cobalt, which is a property of the CSS, not of the rendered page: one
 * `.signup button` rule reused by two forms is one mention and two cobalt objects.
 * That is exactly what shipped, and it is the constitution's most important rule.
 *
 * This estimates rendered instances instead: find the selectors that paint a
 * cobalt background, then count how many elements in the document each one hits.
 * Selector matching is approximated by the left-most class in the selector, which
 * is right for the shapes that occur here (`.signup button`, `.btn`, `.sc-action`)
 * and errs toward reporting more rather than fewer.
 */
function countCobaltObjects(html) {
  const body = html.slice(html.search(/<body[\s>]/i));
  // Comments must go first. A comma inside a comment splits into fake selectors,
  // and a comment mentioning cobalt makes the rule above it look like a hit.
  const stripped = html.replace(/<!--[\s\S]*?-->/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  const hits = [];

  for (const rule of stripped.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = rule[1].trim();
    const decls = rule[2];
    if (selector.startsWith("@") || !decls) continue;
    // Only a FILLED cobalt object spends the point colour. Cobalt text or border
    // on an otherwise plain element is not the required action.
    if (!/background(-color)?\s*:\s*[^;]*(var\(\s*--sc-(action|accent)\b|#1f55ff)/i.test(decls)) continue;
    // :hover / :focus restate an existing object rather than adding a new one.
    if (/:(hover|focus|active|visited|focus-visible)/i.test(selector)) continue;

    for (const part of selector.split(",")) {
      const classes = [...part.trim().matchAll(/\.([a-z0-9_-]+)/gi)].map((m) => m[1]);
      let n = 0;
      if (classes.length) {
        // Class attributes are space-separated token lists, so `\bhero\b` also
        // matches `hero-grid` — a hyphen is a word boundary. Match whole tokens.
        const countOf = (cls) => {
          let c = 0;
          for (const attr of body.matchAll(/class\s*=\s*["']([^"']*)["']/gi)) {
            if (attr[1].split(/\s+/).includes(cls)) c++;
          }
          return c;
        };
        // A descendant chain is bounded by its rarest part: `.hero .signup button`
        // cannot match more often than `.hero` occurs. Without a DOM this can
        // under-count when one ancestor holds several matches, so it is a floor,
        // not a proof — but it is the difference between counting the page and
        // counting the stylesheet, which is the mistake that mattered.
        n = Math.min(...classes.map(countOf));
      } else {
        const tag = part.trim().match(/^([a-z][a-z0-9]*)/i);
        if (tag) n = (body.match(new RegExp(`<${tag[1]}[\\s>]`, "gi")) || []).length;
      }
      if (n > 0) hits.push({ selector: part.trim(), n });
    }
  }

  const total = hits.reduce((s, h) => s + h.n, 0);
  return { total, hits };
}

function checkVariant(id, html) {
  const problems = [];
  const warn = [];

  if (!/href\s*=\s*["']\/brand\/tokens\/tokens\.css["']/i.test(html)) {
    problems.push('does not link /brand/tokens/tokens.css — it cannot be using the token system');
  }

  // Strip comments so commented-out examples don't trip the checks, and strip
  // HTML numeric entities so they don't look like hex colours: `&#8361;` is ₩
  // (U+20A9), and the colour regex happily matched `#8361` inside it — flagging
  // a Korean price as an out-of-palette colour.
  const css = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/&#x?[0-9a-fA-F]+;?/g, " ");

  for (const hex of css.match(/#[0-9a-fA-F]{3,8}\b/g) || []) {
    const h = hex.toLowerCase();
    if (SUPERSEDED[h]) problems.push(`superseded Option H colour ${hex} — use ${SUPERSEDED[h]}`);
    else if (!PALETTE.has(h)) problems.push(`colour ${hex} is outside the palette — use a var(--sc-*) token`);
  }

  for (const decl of css.match(/font-family\s*:\s*[^;}]+/gi) || []) {
    const v = decl.toLowerCase();
    if (/ibm\s+plex/.test(v)) problems.push("IBM Plex is not part of this brand — it cannot set Hangul");
    else if (!ALLOWED_FONTS.some((f) => v.includes(f))) problems.push(`font outside the three faces: ${decl.trim()}`);
  }

  for (const decl of css.match(/border-radius\s*:\s*[^;}]+/gi) || []) {
    const v = decl.split(":")[1].trim().toLowerCase();
    if (v.includes("var(")) continue;
    if (!/^(0|0px|0rem|50%|inherit)$/.test(v)) problems.push(`border-radius must be 0 or 50%: ${decl.trim()}`);
  }

  for (const s of findBlurredShadows(css)) {
    problems.push(`blurred shadow — must be hard offset, zero blur: box-shadow: ${s}`);
  }

  // Gradients are allowed only to draw the 76px hairline grid. Match the whole
  // declaration, not `gradient(...)` — a `[^)]*` body stops at the `)` inside
  // `var(--sc-rule)` and never sees the `1px, transparent 1px` signature, which
  // flagged every compliant grid as a violation.
  for (const decl of css.match(/background(-image)?\s*:[^;}]+/gi) || []) {
    if (!/(linear|radial|conic)-gradient/i.test(decl)) continue;
    if (!/1px,\s*transparent\s+1px/i.test(decl)) {
      warn.push(`gradient that is not the hairline grid: ${decl.trim().slice(0, 70)}…`);
    }
  }

  for (const s of findMistypedShadowTokens(css)) problems.push(s);

  // Rule S1: one point colour per view — counted as RENDERED OBJECTS, not as
  // stylesheet mentions. See countCobaltObjects for why that distinction matters.
  const cobalt = countCobaltObjects(html);
  if (cobalt.total > 1) {
    const where = cobalt.hits.map((h) => `${h.selector}×${h.n}`).join(", ");
    problems.push(`${cobalt.total} cobalt objects (${where}) — soul.md allows ONE required action per view`);
  }

  // Constitution D5 (2026-07-26) reversed this: English first, Korean second.
  if (!/lang\s*=\s*["']en["']/i.test(html)) warn.push('html lang is not "en" — English is the default locale (constitution D5)');

  return { id, problems, warn };
}

/* ---------- deterministic blind ordering ---------- */

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* ---------- ranking artifact ---------- */

function checkRanking(file) {
  const md = readFileSync(file, "utf8");
  const m = md.match(/```json\s*([\s\S]*?)```/);
  if (!m) return { ok: false, why: "no ```json block — the board emits one; paste the whole file" };
  let data;
  try {
    data = JSON.parse(m[1]);
  } catch (e) {
    return { ok: false, why: `the json block does not parse: ${e.message}` };
  }
  for (const k of ["round", "judge", "date", "blind", "criteria", "variants"]) {
    if (!(k in data)) return { ok: false, why: `ranking json is missing "${k}"` };
  }
  if (!Array.isArray(data.variants)) return { ok: false, why: "ranking json: variants must be an array" };
  // an untouched template is "not filled in yet", not a failure
  if (!data.variants.length) return { ok: null };
  for (const v of data.variants) {
    for (const k of ["id", "rank", "scores"]) {
      if (!(k in v)) return { ok: false, why: `variant ${v.id ?? "?"} is missing "${k}"` };
    }
    for (const c of data.criteria) {
      const s = v.scores[c];
      if (typeof s !== "number" || s < 1 || s > 5) {
        return { ok: false, why: `variant ${v.id}: score "${c}" must be a number 1-5, got ${JSON.stringify(s)}` };
      }
    }
    if (!v.note || !String(v.note).trim()) {
      return { ok: false, why: `variant ${v.id} has no note — a ranking without reasons cannot brief the next round` };
    }
  }
  return { ok: true, data };
}

/* ---------- main ---------- */

function newestRound() {
  const dirs = readdirSync(ROUNDS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^r\d+$/.test(d.name))
    .map((d) => d.name)
    .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
  return dirs.at(-1);
}

const round = process.argv[2] || newestRound();
if (!round) {
  console.error("no rounds yet — create one with: bash tools/new-round.sh");
  process.exit(1);
}

const roundDir = join(ROUNDS, round);
if (!existsSync(roundDir)) {
  console.error(`round not found: design/rounds/${round}`);
  process.exit(1);
}

const variantsDir = join(roundDir, "variants");
const models = JSON.parse(readFileSync(join(ROOT, "design/models.json"), "utf8"));

const variantIds = existsSync(variantsDir)
  ? readdirSync(variantsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()
  : [];

console.log(`\nround ${round} — ${variantIds.length} variant(s)\n`);

if (!variantIds.length) {
  console.error("no variants yet. Generate them with:  node tools/generate.mjs " + round);
  process.exit(1);
}

let failed = 0;
const results = [];

for (const id of variantIds) {
  const vDir = join(variantsDir, id);
  const file = join(vDir, "index.html");
  if (!existsSync(file)) {
    console.error(`  ✗ ${id}: no index.html`);
    failed++;
    continue;
  }
  // A round may ask for several pages. Every one is held to the constitution —
  // checking only index.html would let a pricing page invent a colour unseen.
  const pages = readdirSync(vDir).filter((f) => /\.html?$/i.test(f)).sort();
  const merged = { id, problems: [], warn: [] };
  for (const page of pages) {
    const one = checkVariant(id, readFileSync(join(vDir, page), "utf8"));
    const tag = pages.length > 1 ? `${page}: ` : "";
    for (const x of one.problems) merged.problems.push(tag + x);
    for (const x of one.warn) merged.warn.push(tag + x);
  }
  const r = merged;
  if (pages.length > 1) console.log(`  · ${id} — ${pages.length} pages: ${pages.join(", ")}`);
  results.push(r);
  if (r.problems.length) {
    failed++;
    console.error(`  ✗ ${id}`);
    for (const p of r.problems) console.error(`      ${p}`);
  } else {
    console.log(`  ✓ ${id}`);
  }
  for (const w of r.warn) console.warn(`      ! ${w}`);
}

// index — blind labels in a deterministic, non-obvious order
const ordered = [...variantIds].sort((a, b) => hash(round + a) - hash(round + b));
const manifest = {
  round,
  criteria: models.criteria,
  variants: ordered.map((id, i) => ({
    id,
    model: id.replace(/-[a-z]$/, ""),
    label: String.fromCharCode(65 + i),
    path: `variants/${id}/index.html`,
  })),
};
writeFileSync(join(roundDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`\n  manifest.json written — ${manifest.variants.length} variant(s), blind labels assigned`);

// ranking, if the judge has already produced one
const rankingFile = join(roundDir, "RANKING.md");
if (existsSync(rankingFile) && /```json/.test(readFileSync(rankingFile, "utf8"))) {
  const r = checkRanking(rankingFile);
  if (r.ok === null) console.log("  · RANKING.md not filled in yet — rank at  bash tools/serve.sh");
  else if (r.ok) console.log(`  ✓ RANKING.md is valid — ${r.data.variants.length} variant(s) judged`);
  else {
    console.error(`  ✗ RANKING.md: ${r.why}`);
    failed++;
  }
} else {
  console.log("  · RANKING.md not filled in yet — rank at  bash tools/serve.sh");
}

if (failed) {
  console.error(`\n${failed} problem(s). Fix them before ranking — a variant that broke the brief would poison the comparison.\n`);
  process.exit(1);
}
console.log(`\nround ${round} is ready to rank.\n`);
