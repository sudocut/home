#!/usr/bin/env node
/**
 * build-tokens.mjs — brand/tokens/tokens.json  ->  brand/tokens/tokens.css
 *
 * Regenerates ONLY the :root block, between the GENERATED markers in tokens.css.
 * The @font-face rules and the @media blocks stay hand-authored, because they
 * encode CSS semantics that would be contorted by round-tripping through JSON.
 *
 * tokens.json holds values + provenance. This file holds the JSON -> CSS mapping,
 * because that mapping is irregular (type.roles.heavy -> --sc-heavy,
 * shadow.actionRest -> --sc-shadow-action) and encoding it as data would be worse.
 *
 * Idempotent: running twice produces a byte-identical file.
 * Exits non-zero if a token is missing, unsourced, or carries a superseded value.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const JSON_PATH = resolve(ROOT, "brand/tokens/tokens.json");
const CSS_PATH = resolve(ROOT, "brand/tokens/tokens.css");

const BEGIN = "  /* >>> GENERATED FROM tokens.json — DO NOT EDIT BELOW <<< */";
const END = "  /* >>> END GENERATED <<< */";

/** Values Option H proposed that must never reappear as live values. */
const SUPERSEDED = {
  "#0d57f2": "#1f55ff (shipped cobalt)",
  "#111111": "#24292c (shipped slate ink)",
  "#f5f5f2": "#f1f1ec (shipped warm paper)",
  "#f5342a": "#ff3b2f (--signal-red, demoted to status)",
  "#3a3a38": "the shipped structure/muted ramp",
  "#8a8a86": "the shipped structure/muted ramp",
  "#e3e3de": "the shipped line/rail ramp",
  "ibm plex mono": "SUIT + Hahmlet (Plex cannot set Hangul)",
};

/**
 * Explicit emit table: [cssVar, jsonPath, trailingComment]
 * Order here is the order in the stylesheet.
 */
const EMIT = [
  ["SECTION", "RAW BRAND VALUES — web-shipped, bauhaus.css body[data-round=\"6\"]"],
  ["--sc-ink", "color.raw.ink"],
  ["--sc-structure", "color.raw.structure"],
  ["--sc-shadow-grey", "color.raw.shadowGrey"],
  ["--sc-paper", "color.raw.paper"],
  ["--sc-panel", "color.raw.panel"],
  ["--sc-muted", "color.raw.muted"],
  ["--sc-line", "color.raw.line"],
  ["--sc-accent", "color.raw.accent"],
  ["--sc-accent-ink", "color.raw.accentInk"],
  ["--sc-accent-soft", "color.raw.accentSoft"],
  ["--sc-signal-red", "color.raw.signalRed"],
  ["--sc-signal-yellow", "color.raw.signalYellow"],
  ["--sc-primary-shadow", "color.raw.primaryShadow"],
  ["--sc-rail", "color.raw.rail"],
  ["--sc-rail-hover", "color.raw.railHover"],
  ["--sc-rail-current", "color.raw.railCurrent"],
  ["--sc-rail-strong", "color.raw.railStrong"],

  ["SECTION", "TYPEFACES"],
  ["--sc-face-jost", "type.faces.jost"],
  ["--sc-face-suit", "type.faces.suit"],
  ["--sc-face-hahmlet", "type.faces.hahmlet"],
  ["--sc-mono", "type.faces.mono"],

  ["SECTION", "TYPE ROLES — Round 6 selected defaults"],
  ["--sc-heavy", "type.roles.heavy"],
  ["--sc-body", "type.roles.body"],
  ["--sc-numbers", "type.roles.numbers"],

  ["SECTION", "GEOMETRY"],
  ["--sc-radius", "geometry.radius"],
  ["--sc-density", "geometry.density"],
  ["--sc-type", "geometry.type"],
  ["--sc-measure", "geometry.measure"],

  ["SECTION", "SHADOW LAW — hard offset, zero blur, zero spread"],
  ["--sc-shadow-action", "shadow.actionRest"],
  ["--sc-shadow-action-hover", "shadow.actionHover"],
  ["--sc-shadow-widget", "shadow.widget"],
  ["--sc-lift", "shadow.lift"],

  ["SECTION", "MOTION"],
  ["--sc-fast", "motion.fast"],
  ["--sc-ease", "motion.ease"],
  ["--sc-entrance", "motion.entrance"],
  ["--sc-entrance-ease", "motion.entranceEase"],
  ["--sc-stagger", "motion.stagger"],

  ["SECTION", "SEMANTIC ROLES — components reference THESE, never the raw values"],
  ["--sc-surface", "color.semantic.surface"],
  ["--sc-surface-raised", "color.semantic.surfaceRaised"],
  ["--sc-content", "color.semantic.content"],
  ["--sc-content-muted", "color.semantic.contentMuted"],
  ["--sc-rule", "color.semantic.rule"],
  ["--sc-action", "color.semantic.action"],
  ["--sc-action-content", "color.semantic.actionContent"],
  ["--sc-action-shadow", "color.semantic.actionShadow"],
  ["--sc-status-error", "color.semantic.statusError"],
  ["--sc-status-warning", "color.semantic.statusWarning"],
  ["--sc-hover", "color.semantic.hover"],

  ["SECTION", "TEXTURE — how soul.md's 양피지 warmth is implemented"],
  ["--sc-grid-size", "texture.gridSize"],
];

function dig(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function main() {
  const tokens = JSON.parse(readFileSync(JSON_PATH, "utf8"));
  const errors = [];
  const warnings = [];
  const lines = [];

  for (const [a, b] of EMIT) {
    if (a === "SECTION") {
      lines.push("");
      lines.push(`  /* ===== ${b} ===== */`);
      continue;
    }
    const node = dig(tokens, b);
    if (node === undefined) {
      errors.push(`missing token: ${b} (needed for ${a})`);
      continue;
    }
    const value = node.value;
    if (value === undefined) {
      errors.push(`token ${b} has no "value"`);
      continue;
    }
    if (!node.origin) warnings.push(`token ${b} has no origin tag`);

    const flat = String(value).toLowerCase();
    for (const [bad, replacement] of Object.entries(SUPERSEDED)) {
      if (flat.includes(bad)) {
        errors.push(`token ${b} carries superseded Option H value "${value}" — use ${replacement}`);
      }
    }
    lines.push(`  ${a}: ${value};`);
  }

  const css = readFileSync(CSS_PATH, "utf8");
  const i = css.indexOf(BEGIN);
  const j = css.indexOf(END);
  if (i === -1 || j === -1) {
    console.error(`error: markers not found in ${CSS_PATH}`);
    console.error(`  expected:\n${BEGIN}\n  ...\n${END}`);
    process.exit(1);
  }

  const next = css.slice(0, i + BEGIN.length) + "\n" + lines.join("\n") + "\n" + css.slice(j);

  if (errors.length) {
    console.error("build-tokens: FAILED\n");
    for (const e of errors) console.error(`  ✗ ${e}`);
    process.exit(1);
  }

  const changed = next !== css;
  if (changed) writeFileSync(CSS_PATH, next);

  const count = lines.filter((l) => l.trim().startsWith("--")).length;
  console.log(`build-tokens: ${count} tokens -> brand/tokens/tokens.css ${changed ? "(updated)" : "(no change)"}`);
  for (const w of warnings) console.warn(`  ! ${w}`);
}

main();
