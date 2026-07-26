#!/usr/bin/env node
/**
 * generate.mjs — fan a round's brief out to every available model, in parallel,
 * at maximum reasoning effort, and record what each session cost.
 *
 *   node tools/generate.mjs [round] [options]
 *
 *     --check          report which models are reachable, generate nothing
 *     --force          regenerate variants that already exist
 *     --only a,b       restrict to these model ids
 *     --letter b       write to <model>-b instead of <model>-a (a second take)
 *     --timeout 900    per-model seconds (default 900 — max effort is slow)
 *
 * Contract: every model receives `design/BRIEF.md` + the round's `BRIEF.md` and
 * PRINTS one HTML document to stdout. We extract it and write the file. Models
 * never write files themselves — that keeps three different CLIs interchangeable.
 *
 * That contract is a sentence in a prompt, not a permission system, and a model
 * has already broken it: a kimi run overwrote a variant from a finished round.
 * lib/repo-guard.mjs fingerprints the tree around the fan-out and restores what
 * a model dirtied uninvited. Run rounds from a CLEAN tree — the guard restores
 * from HEAD, so it can only save what was committed.
 *
 * ONE DESIGN = ONE SESSION. Each session's token usage is captured from the CLI's
 * own structured output and priced against design/models.json. Results land in
 * variants/<id>/meta.json and are aggregated into the round's usage.json, which
 * the ranking board displays alongside each variant.
 *
 * Degrades honestly: with one model available it runs one and says so.
 * Resumable: existing variants are skipped unless --force.
 */

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { auditPrices, costOf, kimiUsage, normalizeUsage, num, usd } from "./lib/cost.mjs";
import { dirtyPaths, restoreStrays } from "./lib/repo-guard.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const argv = process.argv.slice(2);
const flag = (name, fallback = null) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : (argv[i + 1] ?? true);
};
const has = (name) => argv.includes(`--${name}`);

const round = argv.find((a) => /^r\d+$/.test(a)) || newestRound();
const only = flag("only") ? String(flag("only")).split(",").map((s) => s.trim()) : null;
const letter = String(flag("letter", "a"));
const timeoutMs = Number(flag("timeout", 900)) * 1000;

function newestRound() {
  const dirs = readdirSync(join(ROOT, "design/rounds"), { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^r\d+$/.test(d.name))
    .map((d) => d.name)
    .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
  return dirs.at(-1);
}

const registry = JSON.parse(readFileSync(join(ROOT, "design/models.json"), "utf8"));

/* ---------- availability ---------- */

/** Resolve a binary on PATH without spawning a shell. */
function which(bin) {
  if (bin.includes("/")) return existsSync(bin) ? bin : null;
  for (const dir of (process.env.PATH || "").split(":")) {
    if (!dir) continue;
    const p = join(dir, bin);
    if (existsSync(p)) return p;
  }
  return null;
}

/* ---------- run one model ---------- */

function runModel(model, prompt, cwd = ROOT) {
  return new Promise((res) => {
    const [bin, ...args] = model.cmd;
    const useStdin = model.promptVia === "stdin";
    const finalArgs = useStdin ? args : [...args, prompt];

    const child = spawn(bin, finalArgs, { cwd, stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    let err = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      res({ ok: false, why: `timed out after ${timeoutMs / 1000}s`, out, err });
    }, timeoutMs);

    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", (e) => {
      clearTimeout(timer);
      res({ ok: false, why: e.message, out, err });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      res({ ok: code === 0, why: code === 0 ? null : `exit ${code}`, out, err });
    });

    if (useStdin) {
      child.stdin.write(prompt);
      child.stdin.end();
    }
  });
}

/**
 * Slice a complete HTML document out of a string, or null.
 *
 * Cuts at the FIRST `</html>` after the doctype, not the last. Some CLIs append
 * trailer content after the document (kimi prints a session-resume hint plus a
 * replay of the exchange); `lastIndexOf` swallowed all of it and produced a
 * 22KB "document" that rendered raw JSON on the page. The real one was 5KB.
 * A stray `</html>` inside a string literal would truncate early, but that is
 * far rarer than trailing chatter and fails loudly rather than silently.
 */
function sliceDoc(s) {
  const start = s.search(/<!DOCTYPE\s+html/i);
  if (start === -1) return null;
  const end = s.toLowerCase().indexOf("</html>", start);
  if (end === -1) return null;
  return s.slice(start, end + "</html>".length).trim() + "\n";
}

/**
 * Pull the HTML document out of whatever the CLI printed.
 *
 * Each CLI nests its final message differently — claude puts it at `.result`,
 * codex at `.item.text`, kimi at `.content` — so rather than enumerate paths we
 * walk every parsed JSON value and collect every string that contains a
 * document. DECODED STRINGS ALWAYS WIN over the raw stdout: the raw text of a
 * JSON line is escaped (`href=\"...\"`), and writing that to disk yields HTML
 * that silently fails to load its stylesheet. That bug shipped once — it made
 * two compliant variants look like they had ignored the brief.
 */
function extractHtml(text) {
  const candidates = [];
  const collect = (v) => {
    if (typeof v === "string") {
      if (/<!DOCTYPE\s+html/i.test(v)) candidates.push(v);
      return;
    }
    if (v && typeof v === "object") Object.values(v).forEach(collect);
  };

  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t.startsWith("{") && !t.startsWith("[")) continue;
    try { collect(JSON.parse(t)); } catch { /* not json */ }
  }
  if (!candidates.length) {
    try { collect(JSON.parse(text)); } catch { /* not json */ }
  }

  // Rank candidates. Length alone is the WRONG tiebreak: kimi's session-resume
  // hint echoes a JSON-escaped copy of the whole exchange, which is longer than
  // the real message and slices into a document full of literal \n and \" —
  // valid-looking HTML that renders escape sequences as visible garbage.
  // So score by escaping first, length second.
  const scored = candidates
    .map((c) => sliceDoc(c))
    .filter(Boolean)
    .map((doc) => {
      const escapes = (doc.match(/\\[nrt"]/g) || []).length;
      const newlines = (doc.match(/\n/g) || []).length;
      return { doc, escaped: escapes > newlines, len: doc.length };
    })
    .sort((a, b) => (a.escaped !== b.escaped ? (a.escaped ? 1 : -1) : b.len - a.len));

  if (scored.length && !scored[0].escaped) return scored[0].doc;

  // plain-text CLI (no JSON envelope) — safe to slice the raw output
  const raw = sliceDoc(text);
  if (raw) return raw;
  // last resort: an escaped candidate is better than nothing, but unescape it
  if (scored.length) {
    try { return JSON.parse(`"${scored[0].doc.replace(/"/g, '\\"')}"`); } catch { return scored[0].doc; }
  }
  return null;
}

/**
 * Split a model's output into named files.
 *
 * A round may ask for several pages. The model marks each one with a line
 *   <!-- FILE: pricing.html -->
 * immediately before its doctype. Unmarked output is a single index.html, so
 * every earlier round's contract still holds unchanged.
 *
 * Names are flattened to a bare basename — a model that writes
 * `<!-- FILE: ../../../etc/passwd -->` gets `passwd`, not a path traversal.
 */
function extractFiles(text) {
  const marker = /<!--\s*FILE:\s*([^\s>]+?)\s*-->/gi;
  const marks = [...text.matchAll(marker)];
  if (!marks.length) {
    const doc = extractHtml(text);
    return doc ? [{ name: "index.html", doc }] : [];
  }

  const out = [];
  for (let i = 0; i < marks.length; i++) {
    const start = marks[i].index + marks[i][0].length;
    const end = i + 1 < marks.length ? marks[i + 1].index : text.length;
    const doc = extractHtml(text.slice(start, end));
    if (!doc) continue;
    let name = marks[i][1].split(/[\\/]/).pop().replace(/[^A-Za-z0-9._-]/g, "");
    if (!name || name === "." || name === "..") name = `page-${i + 1}.html`;
    if (!/\.html?$/i.test(name)) name += ".html";
    if (!out.some((f) => f.name === name)) out.push({ name, doc });
  }
  // The landing page is index.html whatever the model called it.
  if (out.length && !out.some((f) => f.name === "index.html")) out[0].name = "index.html";
  return out;
}

/* ---------- usage capture ---------- */

/**
 * Extract token usage from a CLI's structured output. Each CLI reports
 * differently, so this is deliberately forgiving: it walks every JSON object it
 * can find and keeps the largest counts seen. Returns nulls (not zeros) when
 * nothing was found, so "unknown" is never silently priced as "free".
 *
 * Largest-seen is the right reduction for both shapes we meet: claude reports
 * one cumulative object per session, codex reports a running cumulative total
 * per turn. Neither wants summing. (kimi is the exception — it reports per-turn
 * deltas, on a channel we cannot see at all; see kimiUsage in lib/cost.mjs.)
 *
 * The result is RAW — still in whatever basis the CLI uses. normalizeUsage()
 * converts it to disjoint token classes before anything prices it.
 */
function parseUsage(model, out) {
  const acc = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reportedCostUSD: null };
  let found = false;

  const visit = (o) => {
    if (!o || typeof o !== "object") return;
    if (Array.isArray(o)) return o.forEach(visit);
    const i = num(o.input_tokens ?? o.inputTokens ?? o.prompt_tokens ?? o.input);
    const p = num(o.output_tokens ?? o.outputTokens ?? o.completion_tokens ?? o.output);
    const cr = num(o.cache_read_input_tokens ?? o.cacheReadInputTokens ?? o.cached_input_tokens);
    const cw = num(o.cache_creation_input_tokens ?? o.cacheCreationInputTokens);
    if (i || p || cr || cw) {
      found = true;
      acc.input = Math.max(acc.input, i);
      acc.output = Math.max(acc.output, p);
      acc.cacheRead = Math.max(acc.cacheRead, cr);
      acc.cacheWrite = Math.max(acc.cacheWrite, cw);
    }
    if (typeof o.total_cost_usd === "number") acc.reportedCostUSD = o.total_cost_usd;
    if (typeof o.costUSD === "number" && acc.reportedCostUSD === null) acc.reportedCostUSD = o.costUSD;
    for (const v of Object.values(o)) if (v && typeof v === "object") visit(v);
  };

  for (const line of out.split("\n")) {
    const t = line.trim();
    if (!t.startsWith("{")) continue;
    try { visit(JSON.parse(t)); } catch { /* ignore */ }
  }
  if (!found) {
    try { visit(JSON.parse(out)); } catch { /* ignore */ }
  }
  // Last resort: codex prints a human-readable "tokens used\n7,098" summary.
  if (!found) {
    const m = out.match(/tokens used[\s\n]*([\d,]+)/i);
    if (m) {
      found = true;
      acc.output = Number(m[1].replace(/,/g, ""));
      acc.estimated = true;
    }
  }
  return found ? acc : null;
}

/**
 * Usage for one session, normalised and ready to price.
 *
 * Falls back to the CLI's own session log when stdout carried no counts — kimi
 * prints none, which made it the one model in the registry whose cost was
 * permanently unknown. The session is matched by the document it produced, so
 * a retry that left an older variant file in place cannot be billed the newer
 * session's tokens.
 */
function sessionUsage(model, out, { html, t0, t1, workDir }) {
  let raw = parseUsage(model, out);
  if (!raw && model.usageFrom === "kimi-session-log") raw = kimiUsage(workDir, { html, t0, t1 });
  return normalizeUsage(model, raw);
}

/* ---------- main ---------- */

async function main() {
  if (!round) {
    console.error("no rounds yet — create one with: bash tools/new-round.sh");
    process.exit(1);
  }

  const roundDir = join(ROOT, "design/rounds", round);
  if (!existsSync(roundDir)) {
    console.error(`round not found: design/rounds/${round}`);
    process.exit(1);
  }

  let pool = registry.models.filter((m) => m.available !== false);
  if (only) pool = pool.filter((m) => only.includes(m.id));

  const checked = pool.map((m) => {
    const path = which(m.cmd[0]);
    return { ...m, path, reachable: Boolean(path) };
  });

  if (has("check")) {
    console.log("\nmodel availability\n");
    for (const m of checked) {
      console.log(
        `  ${m.reachable ? "✓" : "✗"} ${m.id.padEnd(11)} ${m.label.padEnd(16)} ` +
        `${String(m.effort ?? "-").padEnd(6)} $${m.price.input}/$${m.price.output} per 1M   ${m.path || "not on PATH"}`,
      );
    }
    for (const m of registry.models.filter((m) => m.available === false)) {
      console.log(`  · ${m.id.padEnd(11)} ${m.label.padEnd(16)} disabled in models.json`);
    }
    for (const gap of auditPrices(registry.models)) console.warn(`  ! ${gap}`);
    const assumed = checked.filter((m) => m.price?.priceSource === "assumed").map((m) => m.id);
    if (assumed.length) {
      console.log(`\n  rates for ${assumed.join(", ")} are list prices we applied, not reconciled`);
      console.log("  against a vendor-reported cost. Only Anthropic's CLI reports one.");
    }
    console.log();
    return;
  }

  const usable = checked.filter((m) => m.reachable);
  if (!usable.length) {
    console.error("\nNo model CLI is reachable. Check `node tools/generate.mjs --check`.");
    console.error("You can still add a variant by hand — see design/README.md.\n");
    process.exit(1);
  }

  for (const m of checked.filter((m) => !m.reachable)) {
    console.warn(`  ! ${m.id}: ${m.cmd[0]} is not on PATH — skipping.`);
    console.warn(`    By hand: paste design/BRIEF.md + design/rounds/${round}/BRIEF.md into ${m.label},`);
    console.warn(`    then save its HTML to design/rounds/${round}/variants/${m.id}-${letter}/index.html`);
  }

  const standing = readFileSync(join(ROOT, "design/BRIEF.md"), "utf8");
  const roundBrief = readFileSync(join(roundDir, "BRIEF.md"), "utf8");
  const prompt = [
    standing,
    "\n\n---\n\n# This round\n\n",
    roundBrief,
    "\n\n---\n\nPrint ONLY the HTML document. No commentary, no markdown fences. Start at <!DOCTYPE html>.\n",
  ].join("");

  console.log(`\nround ${round} — generating with ${usable.length} model(s) at max effort`);
  console.log(`prompt: ${(prompt.length / 1024).toFixed(1)}kb\n`);

  const cleanBefore = dirtyPaths(ROOT);
  if (!cleanBefore) console.warn("  ! not a git repo — cannot guard against a model writing files\n");
  // paths this run is entitled to change
  const ours = new Set(
    usable.flatMap((m) => [
      `design/rounds/${round}/variants/${m.id}-${letter}/index.html`,
      `design/rounds/${round}/variants/${m.id}-${letter}/meta.json`,
      `design/rounds/${round}/variants/${m.id}-${letter}/`,
      `design/rounds/${round}/variants/${m.id}-${letter}`,
    ]).concat([`design/rounds/${round}/usage.json`]),
  );

  const jobs = usable.map(async (m) => {
    const id = `${m.id}-${letter}`;
    const dir = join(roundDir, "variants", id);
    const file = join(dir, "index.html");

    if (existsSync(file) && !has("force")) {
      console.log(`  · ${id.padEnd(13)} exists, skipping (--force to regenerate)`);
      return { id, status: "skipped" };
    }

    // Agentic CLIs have file-write tools and the print-to-stdout contract is
    // only a sentence in a prompt. A kimi run once overwrote a variant from a
    // finished round. Models flagged `sandbox` are spawned in a scratch dir
    // instead of the repo, so a stray write lands somewhere harmless.
    const workDir = m.sandbox ? mkdtempSync(join(tmpdir(), `sc-${m.id}-`)) : ROOT;

    const t0 = Date.now();
    const r = await runModel(m, prompt, workDir);
    const t1 = Date.now();
    const secs = Math.round((t1 - t0) / 1000);

    // extract first: the document is how a session-log fallback identifies
    // which session to bill, so usage has to be computed after it.
    const files = extractFiles(r.out);
    const html = files.length ? files[0].doc : null;
    const usage = sessionUsage(m, r.out + "\n" + r.err, { html, t0, t1, workDir });
    const cost = costOf(m, usage);

    if (!html) {
      console.error(`  ✗ ${id.padEnd(13)} no HTML in output — ${r.why ?? "exit 0"} (${secs}s)`);
      const snippet = (r.out || r.err).slice(0, 200).replace(/\s+/g, " ");
      console.error(`      ${snippet}`);
      return { id, model: m.id, status: "failed", why: r.why ?? "no html", seconds: secs, usage, costUSD: cost };
    }

    mkdirSync(dir, { recursive: true });
    for (const f of files) writeFileSync(join(dir, f.name), f.doc);

    const meta = {
      id,
      model: m.id,
      label: m.label,
      modelId: m.modelId,
      vendor: m.vendor,
      effort: m.effort ?? null,
      round,
      seconds: secs,
      bytes: files.reduce((n, f) => n + f.doc.length, 0),
      pages: files.map((f) => f.name),
      usage,
      costUSD: cost,
      reportedCostUSD: usage?.reportedCostUSD ?? null,
      price: m.price,
      generatedBy: "tools/generate.mjs",
    };
    writeFileSync(join(dir, "meta.json"), JSON.stringify(meta, null, 2) + "\n");

    // Show the classes separately. A single "in" figure is what let a session
    // whose input was 86% cache reads look like a session that bought 673k
    // fresh tokens — a 4.5x cost error that nothing on screen contradicted.
    const tok = usage
      ? `${usage.input.toLocaleString()}+${usage.cacheRead.toLocaleString()}c in/${usage.output.toLocaleString()} out`
      : "usage unknown";
    console.log(`  ✓ ${id.padEnd(13)} ${files.length > 1 ? `${files.length}p ` : ""}${(files.reduce((n, f) => n + f.doc.length, 0) / 1024).toFixed(1)}kb  ${String(secs).padStart(4)}s  ${tok.padEnd(32)} ${usd(cost)}`);
    if (meta.reportedCostUSD !== null && cost !== null) {
      const drift = Math.abs(cost - meta.reportedCostUSD);
      if (drift > 0.005 && drift / meta.reportedCostUSD > 0.02) {
        console.warn(`      ! priced ${usd(cost)} but ${m.vendor} reports ${usd(meta.reportedCostUSD)} — rates in models.json are stale`);
      }
    }
    return { id, status: "written", ...meta };
  });

  const results = await Promise.all(jobs);
  restoreStrays(ROOT, cleanBefore, ours);
  const written = results.filter((r) => r.status === "written");
  const failed = results.filter((r) => r.status === "failed");

  // aggregate — the board reads this
  const prior = existsSync(join(roundDir, "usage.json"))
    ? JSON.parse(readFileSync(join(roundDir, "usage.json"), "utf8"))
    : { round, variants: [] };
  const byId = new Map(prior.variants.map((v) => [v.id, v]));
  for (const w of written) byId.set(w.id, w);
  const variants = [...byId.values()];
  const totalCost = variants.reduce((s, v) => s + (v.costUSD || 0), 0);
  writeFileSync(
    join(roundDir, "usage.json"),
    JSON.stringify({ round, totalCostUSD: totalCost, variants }, null, 2) + "\n",
  );

  console.log(`\n${written.length} written, ${results.length - written.length - failed.length} skipped, ${failed.length} failed`);
  if (variants.length) console.log(`round total: ${usd(totalCost)} across ${variants.length} session(s)`);
  console.log(`\nnext:  node tools/verify-round.mjs ${round}\n`);
}

main();
