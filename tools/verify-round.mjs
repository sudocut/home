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

const PALETTE = new Set([
  "#24292c", "#f1f1ec", "#fbfaf5", "#656b6f", "#666c70",
  "#1f55ff", "#ffffff", "#fff", "#000000", "#000",
  "#ff3b2f", "#ffd523", "#dfe3ec", "#aeb2b3",
  "#e5e6e3", "#d4d6d4", "#c9ccca", "#676e72",
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

function checkVariant(id, html) {
  const problems = [];
  const warn = [];

  if (!/href\s*=\s*["']\/brand\/tokens\/tokens\.css["']/i.test(html)) {
    problems.push('does not link /brand/tokens/tokens.css — it cannot be using the token system');
  }

  // strip comments so commented-out examples don't trip the checks
  const css = html.replace(/<!--[\s\S]*?-->/g, "").replace(/\/\*[\s\S]*?\*\//g, "");

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

  for (const g of css.match(/(linear|radial|conic)-gradient\([^)]*\)/gi) || []) {
    // gradients are allowed only to draw the 76px hairline grid
    if (!/1px,\s*transparent\s+1px/i.test(g)) warn.push(`gradient that is not the hairline grid: ${g.slice(0, 60)}…`);
  }

  // Rule S1: one point colour per view. Cobalt as a *background* is the action.
  const cobalt = (css.match(/var\(--sc-action\b/g) || []).length
    + (css.match(/var\(--sc-accent\b/g) || []).length
    + (css.match(/#1f55ff/gi) || []).length;
  if (cobalt > 3) warn.push(`cobalt referenced ${cobalt}× — soul.md allows ONE required action per view; check this is not decoration`);

  if (!/lang\s*=\s*["']ko["']/i.test(html)) warn.push('html lang is not "ko" — Korean is the default locale');

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
  const file = join(variantsDir, id, "index.html");
  if (!existsSync(file)) {
    console.error(`  ✗ ${id}: no index.html`);
    failed++;
    continue;
  }
  const r = checkVariant(id, readFileSync(file, "utf8"));
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
