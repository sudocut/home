#!/usr/bin/env node
/**
 * recost.mjs — re-price a round that has already run.
 *
 *   node tools/recost.mjs [round] [--all] [--dry]
 *
 * Rounds are immutable: this NEVER re-runs a model and never touches a variant's
 * HTML. It re-derives `usage.json` from counts already on disk, plus the CLIs'
 * own session logs, using the current rates and counting rules in
 * `design/models.json`. Idempotent — running it twice changes nothing.
 *
 * It exists because pricing is the one part of a round that can be wrong long
 * after the round is right, in two ways:
 *
 *   RATES MOVE.        A published price changes and every past round is stale.
 *   RULES ARE WRONG.   We miscount what we already captured.
 *
 * Both happened. r2 and r3 shipped with three errors this replays away:
 *
 *   1. codex's cached input was billed TWICE — once inside input_tokens, which
 *      already contains it, and again as a cache read. On r3's Sol session that
 *      is 581,888 phantom tokens.
 *   2. Neither OpenAI model had a cacheRead rate, so costOf fell back to the
 *      full input rate: those same cached tokens at $5.00/1M instead of $0.50.
 *      Together (1) and (2) made one $1.57 session read as $7.10.
 *   3. Anthropic cacheWrite was 1.25x input (the 5-minute rate). The CLI is
 *      using the 1-hour cache at 2x. Confirmed by the fact that at 2x our
 *      figure equals `total_cost_usd` exactly, on all four Anthropic sessions.
 *
 * And it backfills Kimi, whose cost was `null` in both rounds — not because the
 * CLI does not measure it, but because it writes the measurement to its session
 * log instead of to stdout.
 */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { costOf, kimiUsage, normalizeUsage, usd } from "./lib/cost.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const dry = argv.includes("--dry");
const registry = JSON.parse(readFileSync(join(ROOT, "design/models.json"), "utf8"));
const byModel = new Map(registry.models.map((m) => [m.id, m]));

function roundsToDo() {
  const named = argv.filter((a) => /^r\d+$/.test(a));
  if (named.length) return named;
  if (!argv.includes("--all")) {
    console.error("usage: node tools/recost.mjs <round…> | --all   [--dry]");
    process.exit(1);
  }
  return readdirSync(join(ROOT, "design/rounds"), { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^r\d+$/.test(d.name))
    .map((d) => d.name)
    .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
}

/**
 * Everything we know about which session produced this variant.
 *
 * The document is the strong signal and the clock is the weak one. We do not
 * store timestamps, so the window is reconstructed from the variant file's
 * mtime (when the runner wrote it) minus `seconds` — good enough to break a
 * tie, not good enough to trust alone. On r2 it points at the wrong session.
 */
function evidenceFor(roundDir, v) {
  const f = join(roundDir, "variants", v.id, "index.html");
  if (!existsSync(f)) return null;
  const end = statSync(f).mtimeMs;
  return { html: readFileSync(f, "utf8"), t0: end - (v.seconds || 0) * 1000, t1: end };
}

function recostRound(round) {
  const roundDir = join(ROOT, "design/rounds", round);
  const file = join(roundDir, "usage.json");
  if (!existsSync(file)) {
    console.log(`  · ${round}: no usage.json — nothing to re-price`);
    return null;
  }
  const data = JSON.parse(readFileSync(file, "utf8"));
  const rows = [];

  for (const v of data.variants) {
    const model = byModel.get(v.model);
    if (!model) {
      rows.push({ id: v.id, before: v.costUSD, after: v.costUSD, why: "model not in registry" });
      continue;
    }
    const before = v.costUSD;

    let usage = v.usage;
    let why = "re-priced";
    if (model.usageFrom === "kimi-session-log") {
      // Re-derive from the log every time rather than trusting the stored blob,
      // so a fix to the matcher reaches rounds already backfilled. Keep what we
      // have if the log has since been pruned — recovery may not un-recover.
      const ev = evidenceFor(roundDir, v);
      const found = ev ? kimiUsage(ROOT, ev) : null;
      if (found) { usage = found; why = `recovered from session log (by ${found.matchedBy})`; }
      else if (!usage) why = "no usage on stdout, no session log match";
      else why = "re-priced from stored counts — session log no longer matches";
    }

    usage = normalizeUsage(model, usage);
    const after = costOf(model, usage);

    v.usage = usage;
    v.costUSD = after;
    v.price = model.price;
    v.usageBasis = model.usageBasis ?? null;
    if (usage?.reportedCostUSD !== undefined) v.reportedCostUSD = usage.reportedCostUSD;

    // The per-variant meta.json holds the same figures. Leaving it stale would
    // put two different costs for one session on disk, and nothing would say
    // which is current.
    const metaFile = join(roundDir, "variants", v.id, "meta.json");
    if (!dry && existsSync(metaFile)) {
      const meta = JSON.parse(readFileSync(metaFile, "utf8"));
      Object.assign(meta, {
        usage: v.usage,
        costUSD: v.costUSD,
        reportedCostUSD: v.reportedCostUSD ?? null,
        price: v.price,
        usageBasis: v.usageBasis,
        repricedBy: "tools/recost.mjs",
      });
      writeFileSync(metaFile, JSON.stringify(meta, null, 2) + "\n");
    }

    rows.push({ id: v.id, before, after, why, reported: v.reportedCostUSD ?? null });
  }

  data.totalCostUSD = data.variants.reduce((s, v) => s + (v.costUSD || 0), 0);
  data.repricedBy = "tools/recost.mjs";

  console.log(`\n${round}`);
  for (const r of rows) {
    const delta = r.before != null && r.after != null ? r.after - r.before : null;
    const arrow = delta === null ? "" : delta > 0 ? `  +${usd(delta).slice(1)}` : delta < 0 ? `  −${usd(-delta).slice(1)}` : "";
    const check = r.reported != null && r.after != null
      ? (Math.abs(r.after - r.reported) < 0.0005 ? "  ✓ matches vendor" : `  ! vendor says ${usd(r.reported)}`)
      : "";
    console.log(`  ${r.id.padEnd(13)} ${usd(r.before).padStart(9)} → ${usd(r.after).padStart(9)}${arrow.padEnd(12)} ${r.why}${check}`);
  }
  const wasTotal = rows.reduce((s, r) => s + (r.before || 0), 0);
  console.log(`  ${"total".padEnd(13)} ${usd(wasTotal).padStart(9)} → ${usd(data.totalCostUSD).padStart(9)}`);

  if (!dry) writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  return data;
}

const done = roundsToDo().map(recostRound).filter(Boolean);
console.log(
  dry
    ? "\n--dry: nothing written.\n"
    : `\n${done.length} round(s) re-priced. Variant HTML untouched.\n`,
);
