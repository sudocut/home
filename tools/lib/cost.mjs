/**
 * cost.mjs — one place where token counts become dollars.
 *
 * Shared by tools/generate.mjs (live capture) and tools/recost.mjs (re-price an
 * already-run round). Rounds are immutable, but usage.json is *derived* data —
 * when a rate or a counting rule is found to be wrong, the fix belongs here and
 * gets replayed over the stored counts. Nothing here re-runs a model.
 *
 * ---------------------------------------------------------------------------
 * THE COUNTING RULE, and why it needs stating
 *
 * Every CLI reports a different thing under the word "input":
 *
 *   codex  `total_token_usage.input_tokens` INCLUDES `cached_input_tokens`.
 *          Proven from a rollout: turn 1 is {input 23637, cached 0, output 416,
 *          total 24053} — total == input + output, so cached is a SUBSET of
 *          input, never an addition to it.
 *   claude `usage.input_tokens` EXCLUDES cache_read/cache_creation; the three
 *          are disjoint and are billed separately.
 *   kimi   names them `inputOther` / `inputCacheRead` / `inputCacheCreation` —
 *          unambiguous by construction.
 *
 * We normalise everything to the DISJOINT form: `input` means input that was
 * neither read from nor written to cache. A model whose CLI reports the
 * inclusive form declares `"usageBasis": "inclusive"` in models.json and gets
 * cacheRead subtracted here, exactly once.
 *
 * Getting this wrong is expensive and silent: it double-charges the cached
 * tokens, which on an agentic CLI are the overwhelming majority of the input.
 */

import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/**
 * Normalise a raw usage record to disjoint token classes.
 * Returns a new object; never mutates. Idempotent on already-normalised input,
 * so recost.mjs can be run repeatedly without eroding the counts.
 */
export function normalizeUsage(model, u) {
  if (!u) return null;
  const out = {
    input: num(u.input),
    output: num(u.output),
    cacheRead: num(u.cacheRead),
    cacheWrite: num(u.cacheWrite),
  };
  if (model.usageBasis === "inclusive" && !u.normalized) {
    // cached is a subset of input — take it out so it is priced once, at the
    // cache rate, instead of twice at the full rate.
    out.input = Math.max(0, out.input - out.cacheRead);
  }
  out.normalized = true;
  if (u.reportedCostUSD !== undefined) out.reportedCostUSD = u.reportedCostUSD;
  // Carry provenance through. Where a figure came from, and how confidently it
  // was attributed, is part of the figure — a cost recovered by matching a
  // document is not the same claim as one matched by a timestamp.
  if (u.source) out.source = u.source;
  if (u.matchedBy) out.matchedBy = u.matchedBy;
  if (u.turns) out.turns = u.turns;
  return out;
}

/**
 * Price a normalised session against the model's list rates. USD, or null when
 * usage is unknown — an unknown cost is never silently priced as free.
 *
 * A missing cacheRead/cacheWrite rate falls back to the base input rate. That
 * fallback is a bug magnet (it silently charges cache reads at 10x on OpenAI),
 * so models.json now states every rate explicitly and `auditPrices` below
 * complains when one is missing.
 */
export function costOf(model, u) {
  if (!u) return null;
  const p = model.price || {};
  const per = (tokens, rate) => (num(tokens) / 1_000_000) * num(rate);
  return (
    per(u.input, p.input) +
    per(u.output, p.output) +
    per(u.cacheRead, p.cacheRead ?? p.input) +
    per(u.cacheWrite, p.cacheWrite ?? p.input)
  );
}

/** Models missing an explicit cache rate, so the silent fallback can be seen. */
export function auditPrices(models) {
  return models
    .filter((m) => m.available !== false)
    .flatMap((m) => {
      const gaps = [];
      if (m.price?.cacheRead === undefined) gaps.push(`${m.id}: no cacheRead rate — falls back to input`);
      if (m.price?.cacheWrite === undefined && m.vendor === "Anthropic") gaps.push(`${m.id}: no cacheWrite rate`);
      return gaps;
    });
}

export const usd = (n) => (n === null || n === undefined ? "—" : `$${n.toFixed(4)}`);

/* ------------------------------------------------------------------------- *
 * kimi: usage recovery from the session log
 *
 * `kimi --output-format stream-json` emits role/content messages and nothing
 * else — no token counts. That is what made Kimi's cost `null` for r2 and r3.
 * But the CLI *does* record usage; it writes it to its own session log rather
 * than to stdout:
 *
 *   ~/.kimi-code/sessions/wd_<slug>/session_<uuid>/agents/main/wire.jsonl
 *   {"type":"usage.record","model":"kimi-code/k3",
 *    "usage":{"inputOther":5806,"output":276,"inputCacheRead":19200,
 *             "inputCacheCreation":0},"usageScope":"turn","time":...}
 *
 * Scope is per-turn, so these SUM. (Contrast codex, whose token_count events
 * are cumulative and must be taken as a last value, not a sum.)
 * ------------------------------------------------------------------------- */

const KIMI_HOME = join(homedir(), ".kimi-code");

/**
 * Compare two paths by their resolved identity.
 *
 * kimi records the REAL path in its session index: pass it `/tmp/x` on macOS and
 * the index says `/private/tmp/x`. A string compare silently misses every
 * session, which is indistinguishable from "this CLI reports no usage" — and
 * that is exactly the wrong conclusion to draw twice.
 */
function samePath(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  try {
    return realpathSync(a) === realpathSync(b);
  } catch {
    return false;
  }
}

/** Sessions this CLI has recorded for `workDir`, newest first. */
function kimiSessions(workDir) {
  const idx = join(KIMI_HOME, "session_index.jsonl");
  const dirs = [];
  if (existsSync(idx)) {
    for (const line of readFileSync(idx, "utf8").split("\n")) {
      if (!line.trim()) continue;
      try {
        const e = JSON.parse(line);
        if (e.sessionDir && samePath(e.workDir, workDir)) dirs.push(e.sessionDir);
      } catch { /* skip */ }
    }
  }
  return dirs
    .map((d) => join(d, "agents/main/wire.jsonl"))
    .filter((f) => existsSync(f))
    .map((f) => ({ file: f, mtime: statSync(f).mtimeMs, created: kimiCreatedAt(f) }))
    .sort((a, b) => b.mtime - a.mtime);
}

/** The `created_at` on the wire log's first line, or its mtime as a fallback. */
function kimiCreatedAt(file) {
  const head = readFileSync(file, "utf8").slice(0, 400).split("\n")[0];
  try {
    const o = JSON.parse(head);
    if (o.type === "metadata" && typeof o.created_at === "number") return o.created_at;
  } catch { /* fall through */ }
  return statSync(file).mtimeMs;
}

/**
 * Does this wire log contain the document we shipped?
 *
 * This is how a session is attributed, and it has to be, because the clock
 * lies. r2's kimi variant was written at 14:19:28; the nearest kimi session
 * started at 14:09:04 — but the document actually came from the session that
 * started at 14:00:32, an earlier attempt whose file survived a later retry.
 * Matching on time would have billed r2's Kimi 1,010,176 cache reads instead of
 * 128,256, ~8x, and nothing would have contradicted it.
 *
 * We parse rather than grep because the log stores messages JSON-encoded, so
 * the raw bytes are escaped and a literal substring search finds nothing.
 */
function wireHasDocument(file, doc) {
  const needle = doc.trim();
  if (!needle) return false;
  let hit = false;
  const seek = (v) => {
    if (hit) return;
    if (typeof v === "string") { if (v.includes(needle)) hit = true; return; }
    if (v && typeof v === "object") for (const x of Object.values(v)) seek(x);
  };
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (!line.startsWith("{")) continue;
    try { seek(JSON.parse(line)); } catch { /* skip */ }
    if (hit) return true;
  }
  return false;
}

/** Sum the per-turn usage records in one wire log. */
function sumWire(file) {
  const acc = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, turns: 0 };
  const seen = new Set();
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (!line.startsWith('{"type":"usage.record"')) continue;
    let o;
    try { o = JSON.parse(line); } catch { continue; }
    if (o.usageScope !== "turn") continue;
    // the log is append-only and can replay a record on resume — key on the
    // timestamp so a replayed turn is not billed twice.
    if (seen.has(o.time)) continue;
    seen.add(o.time);
    const u = o.usage || {};
    acc.input += num(u.inputOther);
    acc.output += num(u.output);
    acc.cacheRead += num(u.inputCacheRead);
    acc.cacheWrite += num(u.inputCacheCreation);
    acc.turns += 1;
  }
  return acc.turns ? acc : null;
}

/**
 * Usage for the kimi session that produced `html`, in `workDir`.
 *
 * Attribution order, strongest first:
 *   1. the session whose log contains the document we shipped — exact;
 *   2. the single session created inside the run's [t0, t1] window.
 * Returns null rather than guessing. An unknown cost is a gap; a confidently
 * wrong one corrupts the comparison the whole round exists to make.
 */
export function kimiUsage(workDir, { html = null, t0 = null, t1 = null, slackMs = 20_000 } = {}) {
  // A session that started after the run ended cannot have produced it. Without
  // this, a LATER kimi session that merely read the variant off disk matches the
  // document just as strongly as the one that wrote it — and being agentic, a
  // later session is exactly the kind that goes and reads old variants.
  const sessions = kimiSessions(workDir).filter(
    (s) => t1 === null || s.created <= t1 + slackMs,
  );

  if (html) {
    const hits = sessions.filter((s) => wireHasDocument(s.file, html));
    if (hits.length === 1) return attach(hits[0], "document");
  }
  if (t0 !== null && t1 !== null) {
    const hits = sessions.filter((s) => s.created >= t0 - slackMs);
    if (hits.length === 1) return attach(hits[0], "window");
  }
  return null;

  function attach(s, matchedBy) {
    const u = sumWire(s.file);
    if (!u) return null;
    return { ...u, normalized: true, matchedBy, source: s.file.replace(homedir(), "~") };
  }
}

/** All kimi sessions for `workDir`, newest first — for diagnosing a failed match. */
export function kimiSessionsWithUsage(workDir) {
  return kimiSessions(workDir)
    .map((s) => ({ ...s, usage: sumWire(s.file) }))
    .filter((s) => s.usage);
}
