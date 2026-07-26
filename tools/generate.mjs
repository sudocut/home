#!/usr/bin/env node
/**
 * generate.mjs — fan a round's brief out to every available model, in parallel.
 *
 *   node tools/generate.mjs [round] [options]
 *
 *     --check          report which models are reachable, generate nothing
 *     --force          regenerate variants that already exist
 *     --only a,b       restrict to these model ids
 *     --letter b       write to <model>-b instead of <model>-a (a second take)
 *     --timeout 300    per-model seconds (default 300)
 *
 * Contract: every model receives `design/BRIEF.md` + the round's `BRIEF.md` and
 * PRINTS one HTML document to stdout. We extract it and write the file. Models
 * never write files themselves — that keeps four different CLIs interchangeable
 * and avoids per-tool permission setup.
 *
 * Degrades honestly: with one model available it runs one and says so.
 * Resumable: existing variants are skipped unless --force.
 */

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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
const timeoutMs = Number(flag("timeout", 300)) * 1000;

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

function runModel(model, prompt) {
  return new Promise((res) => {
    const [bin, ...args] = model.cmd;
    const useStdin = model.promptVia === "stdin";
    const finalArgs = useStdin ? args : [...args, prompt];

    const child = spawn(bin, finalArgs, { cwd: ROOT, stdio: ["pipe", "pipe", "pipe"] });
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
 * Pull the HTML document out of whatever the CLI printed. Handles markdown
 * fences and session chatter uniformly, which is why every model can share
 * one code path.
 */
function extractHtml(text) {
  const start = text.search(/<!DOCTYPE\s+html/i);
  const end = text.toLowerCase().lastIndexOf("</html>");
  if (start === -1 || end === -1 || end < start) return null;
  return text.slice(start, end + "</html>".length).trim() + "\n";
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

  // verify each binary really exists rather than trusting the registry
  const checked = pool.map((m) => {
    const path = which(m.cmd[0]);
    return { ...m, path, reachable: Boolean(path) };
  });

  if (has("check")) {
    console.log("\nmodel availability\n");
    for (const m of checked) {
      console.log(`  ${m.reachable ? "✓" : "✗"} ${m.id.padEnd(10)} ${m.label.padEnd(22)} ${m.path || "not on PATH"}`);
    }
    const off = registry.models.filter((m) => m.available === false);
    for (const m of off) console.log(`  · ${m.id.padEnd(10)} ${m.label.padEnd(22)} disabled in models.json`);
    console.log();
    return;
  }

  const usable = checked.filter((m) => m.reachable);
  if (!usable.length) {
    console.error("\nNo model CLI is reachable. Check `node tools/generate.mjs --check`.");
    console.error("You can still add a variant by hand — see the manual path in design/README.md.\n");
    process.exit(1);
  }

  for (const m of checked.filter((m) => !m.reachable)) {
    console.warn(`  ! ${m.id}: ${m.cmd[0]} is not on PATH — skipping.`);
    console.warn(`    To include it by hand: paste design/BRIEF.md + design/rounds/${round}/BRIEF.md into ${m.label},`);
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

  console.log(`\nround ${round} — generating with ${usable.length} model(s)\n`);

  const jobs = usable.map(async (m) => {
    const id = `${m.id}-${letter}`;
    const dir = join(roundDir, "variants", id);
    const file = join(dir, "index.html");

    if (existsSync(file) && !has("force")) {
      console.log(`  · ${id.padEnd(12)} exists, skipping (--force to regenerate)`);
      return { id, status: "skipped" };
    }

    const t0 = Date.now();
    const r = await runModel(m, prompt);
    const secs = ((Date.now() - t0) / 1000).toFixed(0);

    if (!r.ok && !r.out) {
      console.error(`  ✗ ${id.padEnd(12)} ${r.why} (${secs}s)`);
      if (r.err) console.error(`      ${r.err.trim().split("\n").slice(-3).join("\n      ")}`);
      return { id, status: "failed", why: r.why };
    }

    const html = extractHtml(r.out);
    if (!html) {
      console.error(`  ✗ ${id.padEnd(12)} no HTML document in output (${secs}s)`);
      console.error(`      first 200 chars: ${r.out.slice(0, 200).replace(/\n/g, " ")}`);
      return { id, status: "failed", why: "no html" };
    }

    mkdirSync(dir, { recursive: true });
    writeFileSync(file, html);
    console.log(`  ✓ ${id.padEnd(12)} ${(html.length / 1024).toFixed(1)}kb (${secs}s)`);
    return { id, status: "written" };
  });

  const results = await Promise.all(jobs);
  const written = results.filter((r) => r.status === "written").length;
  const failed = results.filter((r) => r.status === "failed").length;

  console.log(`\n${written} written, ${results.length - written - failed} skipped, ${failed} failed`);
  console.log(`\nnext:  node tools/verify-round.mjs ${round}\n`);
}

main();
