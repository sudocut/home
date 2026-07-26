/**
 * repo-guard.mjs — catch a model that writes to the repo, and put it back.
 *
 * The output contract says models PRINT their document and never write files.
 * Nothing enforced that, and it is not merely advisory: `kimi -p` still carries
 * its full tool set. On 2026-07-26 a kimi run asked to produce a NEW variant
 * instead overwrote `design/rounds/r3/variants/kimi-k3-a/index.html` — a variant
 * from a finished round, tracked in git. Rounds are meant to be immutable. A
 * model reached in and edited one, and nothing said so; it surfaced only because
 * the cost attribution started pointing at the wrong session.
 *
 * So: fingerprint the working tree before the fan-out, compare after. Only files
 * that were CLEAN before and are dirty after are restored — uncommitted work you
 * already had is never touched, and untracked files are reported, never deleted.
 */

import { execFileSync } from "node:child_process";

/** Paths git considers dirty (modified, staged, or untracked), or null if not a repo. */
export function dirtyPaths(cwd) {
  try {
    return new Set(
      execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd, encoding: "utf8" })
        .split("\n")
        .filter(Boolean)
        .map((l) => l.slice(3).trim().replace(/^"|"$/g, "")),
    );
  } catch {
    return null;
  }
}

function isTracked(cwd, p) {
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", "--", p], { cwd, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Restore anything a model dirtied that we did not ask it to.
 * `ours` is the set of paths this run is entitled to change.
 * Returns { restored, created } for reporting; performs the restore itself.
 */
export function restoreStrays(cwd, before, ours, log = console.error) {
  const after = dirtyPaths(cwd);
  if (!before || !after) return { restored: [], created: [] };

  const strays = [...after].filter((p) => !before.has(p) && !ours.has(p));
  if (!strays.length) return { restored: [], created: [] };

  const restored = strays.filter((p) => isTracked(cwd, p));
  const created = strays.filter((p) => !isTracked(cwd, p));

  log("\n  ! a model wrote to the repo. The contract is print-to-stdout, never write.");
  for (const p of restored) log(`      modified  ${p}`);
  for (const p of created) log(`      created   ${p}`);
  if (restored.length) {
    execFileSync("git", ["checkout", "--", ...restored], { cwd });
    log(`      restored ${restored.length} tracked file(s) from HEAD.`);
  }
  if (created.length) log("      Untracked files are left alone — inspect and delete them yourself.");
  log("");
  return { restored, created };
}
