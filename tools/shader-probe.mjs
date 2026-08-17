#!/usr/bin/env node
/**
 * shader-probe.mjs — measure what the paper texture actually does to the page.
 *
 *   bash tools/serve.sh 4173 &            # the probe page loads /design/vendor/*
 *   node tools/shader-probe.mjs           # sweep, print the table
 *   node tools/shader-probe.mjs --keep    # also leave the PNGs in .probe/
 *
 * WHY THIS EXISTS
 * ---------------
 * D6's original settings table was written by looking at four screenshots. It
 * recorded the adopted setting as "grain visible, page stays bright". Measured,
 * that setting moved the page by at most 4/255 and moved it DOWNWARD — it was
 * invisible, and slightly grey. Both halves of the claim were wrong, and nothing
 * in the repo could have caught it, because nothing measured.
 *
 * The two failure modes are independent and a setting has to clear both:
 *
 *   GREYING     the mean luminance drops. This is r2's rejected failure — the
 *               sheet reads as a disabled control. Measured as `dMean` against
 *               the flat-colour baseline. Must be ~0.
 *   INVISIBLE   there is no local variation. This is the failure the current D6
 *               setting has. Measured as `grain` — mean absolute difference
 *               between horizontally adjacent pixels. Must be clearly non-zero.
 *
 * Global stddev is NOT used for visibility: a uniform darkening has stddev 0 but
 * so does an invisible texture, and a slow large-scale gradient would inflate it
 * without producing any perceptible grain. Adjacent-pixel difference isolates the
 * fine fibre structure, which is the thing that reads as paper.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { measure, readPngLuminance } from "./lib/pixels.mjs";

const PORT = process.env.PROBE_PORT ?? "4173";
const BASE = `http://localhost:${PORT}/tools/shader-probe.html`;
const OUT = ".probe";
const W = 1000;
const H = 820;

const CHROME =
  process.env.CHROME ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

/* ---------- perceptual thresholds ---------- */

// Fine luminance noise on a light field becomes perceptible at roughly 1-2%
// modulation. On a 0-255 scale that is ~2.5-5 levels of local swing, so a mean
// adjacent-pixel difference of 1.5 is the floor for "you can see it at all" and
// 2.5 is where it reads as texture rather than as a compression artefact.
const GRAIN_VISIBLE = 1.5;
const GRAIN_CLEAR = 2.5;
// r2 was rejected for reading as disabled. Anything that pulls the sheet down by
// a full level is heading back toward that, so hold the mean to under 1.
const MEAN_DRIFT_MAX = 1.0;

/* ---------- the sweep ---------- */

// front/back are held at a constant MEAN by lightening `back` as `front` darkens.
// That is the whole trick the original table missed: greying is a shift of the
// mean, grain is variance around it. You can raise variance without shifting the
// mean, but only if you compensate — which is why simply turning `contrast` up on
// the D6 pair walks straight into r2's failure.
// `aspect` is u_imageAspectRatio. It is not a style knob — it is the difference
// between the fibre rendering and not rendering. patternUV is multiplied by it, so
// at 0 (the value an unset uniform takes) the fibre, crumples and folds all
// collapse and only the screen-space roughness term survives. Every r4 variant
// ships aspect unset, which is why the texture was never on screen at any setting.
const SWEEP = [
  { name: "r4-as-shipped", aspect: 0, front: "#e5e6e3", back: "#f1f1ec", contrast: 0.1, roughness: 0.2, fiber: 0.4, fiberSize: 0.7 },
  { name: "D6 pair, fixed", front: "#e5e6e3", back: "#f1f1ec", contrast: 0.1, roughness: 0.2, fiber: 0.4, fiberSize: 0.7 },
  { name: "r2-failure(ink)", front: "#24292c", back: "#f1f1ec", contrast: 0.25, roughness: 0.35, fiber: 0.55, fiberSize: 0.7 },

  // The pairing was inverted from the start, and that is why every setting greyed.
  // In the GLSL the sheet is `fgColor * res + bgColor * (1 - res)` with `res` the
  // lighting term, and the fibre only ever subtracts from the normal — so `res`
  // sits high and u_colorFront DOMINATES the mean. u_colorFront is therefore the
  // PAPER, and u_colorBack is the shade the fibre pockets fall toward. r2 set
  // colorFront to ink, i.e. it painted the paper itself ink; D6 set it to rail
  // grey, which is the same mistake made smaller. Put paper in front and the
  // texture can be turned up without the mean moving.
  // `res` is a lighting term, and with the normal near flat it settles around
  // 0.41 — so the sheet is roughly `0.41*front + 0.59*back` and BOTH slots have to
  // sit above paper for the mean to land on paper. That is the constraint nobody
  // wrote down: the uniforms are not the colours you see, they are inputs to a
  // lamp. Predicted mean for each row below is 0.41*front + 0.59*back ≈ 240.6.
  // Warm whites, not pure white — paper is #f1f1ec and pure white cools it.
  { name: "lit c.55", front: "#dcddd8", back: "#fffefa", contrast: 0.55, roughness: 0.35, fiber: 0.85, fiberSize: 0.35 },
  { name: "lit c.75", front: "#dcddd8", back: "#fffefa", contrast: 0.75, roughness: 0.4, fiber: 1.0, fiberSize: 0.3 },
  { name: "lit fine", front: "#dcddd8", back: "#fffefa", contrast: 0.75, roughness: 0.4, fiber: 1.0, fiberSize: 0.2 },
  { name: "lit soft", front: "#e0e1dd", back: "#fffefa", contrast: 0.55, roughness: 0.3, fiber: 0.7, fiberSize: 0.4 },
  { name: "lit softer", front: "#e5e6e3", back: "#fffefa", contrast: 0.45, roughness: 0.28, fiber: 0.6, fiberSize: 0.5 },
  { name: "lit deep", front: "#d2d3ce", back: "#fffefa", contrast: 0.75, roughness: 0.4, fiber: 1.0, fiberSize: 0.25 },
  { name: "lit deep+", front: "#d2d3ce", back: "#ffffff", contrast: 0.85, roughness: 0.45, fiber: 1.0, fiberSize: 0.2 },
];

/* ---------- measurement: tools/lib/pixels.mjs ---------- */


/* ---------- driver ---------- */

function shoot(file, query) {
  execFileSync(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--enable-unsafe-swiftshader",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      `--virtual-time-budget=6000`,
      `--window-size=${W},${H}`,
      `--screenshot=${file}`,
      `${BASE}?${query}`,
    ],
    { stdio: ["ignore", "ignore", "ignore"] },
  );
}

function main() {
  if (!existsSync(CHROME)) {
    console.error(`error: Chrome not found at ${CHROME}\n       set CHROME=/path/to/chrome`);
    process.exit(1);
  }
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  process.stderr.write("baseline… ");
  shoot(`${OUT}/flat.png`, "flat=1&back=%23f1f1ec");
  const flat = measure(readPngLuminance(`${OUT}/flat.png`));
  process.stderr.write(`mean ${flat.mean.toFixed(2)}, grain ${flat.grain.toFixed(3)}\n\n`);

  const rows = [];
  for (const s of SWEEP) {
    process.stderr.write(`  ${s.name}… `);
    const q = new URLSearchParams({
      front: s.front,
      back: s.back,
      contrast: String(s.contrast),
      roughness: String(s.roughness),
      fiber: String(s.fiber),
      fiberSize: String(s.fiberSize),
      aspect: String(s.aspect ?? 1),
    }).toString();
    const file = `${OUT}/${s.name.replace(/[^a-z0-9]+/gi, "-")}.png`;
    shoot(file, q);
    const m = measure(readPngLuminance(file));
    const dMean = m.mean - flat.mean;
    // Either measure can carry the texture, so the stronger one decides.
    const structure = Math.max(m.grain, m.mottle);
    const visible = structure >= GRAIN_VISIBLE;
    const clear = structure >= GRAIN_CLEAR;
    // Darkening is r2's rejected failure. Brightening is a different fault — it
    // walks the sheet off --sc-paper, and the palette is closed — so bound both.
    const grey = dMean < -MEAN_DRIFT_MAX;
    const drifted = Math.abs(dMean) > MEAN_DRIFT_MAX;
    rows.push({ ...s, ...m, dMean, structure, visible, clear, grey, drifted });
    process.stderr.write(
      `grain ${m.grain.toFixed(3)}, mottle ${m.mottle.toFixed(3)}, dMean ${dMean.toFixed(2)}\n`,
    );
  }

  const pad = (s, n) => String(s).padEnd(n);
  const num = (v, n, d = 2) => v.toFixed(d).padStart(n);
  console.log(`\nbaseline (flat #f1f1ec): mean ${flat.mean.toFixed(2)}  grain ${flat.grain.toFixed(3)}`);
  console.log(`visible >= ${GRAIN_VISIBLE} grain · clear >= ${GRAIN_CLEAR} · grey if dMean < -${MEAN_DRIFT_MAX}\n`);
  console.log(
    `${pad("setting", 16)} ${pad("front", 9)} ${pad("back", 9)} ${pad("c", 5)} ${pad("fs", 5)} ${pad("asp", 4)} ${pad("grain", 7)} ${pad("mottle", 7)} ${pad("dMean", 7)}  verdict`,
  );
  console.log("-".repeat(96));
  for (const r of rows) {
    const verdict = r.grey
      ? "GREY — r2 failure"
      : r.drifted
        ? "off --sc-paper"
        : r.clear
          ? "reads as paper"
          : r.visible
            ? "faint but present"
            : "INVISIBLE";
    console.log(
      `${pad(r.name, 16)} ${pad(r.front, 9)} ${pad(r.back, 9)} ${pad(r.contrast, 5)} ${pad(r.fiberSize, 5)} ${pad(r.aspect ?? 1, 4)} ${num(r.grain, 7, 3)} ${num(r.mottle, 7, 3)} ${num(r.dMean, 7)}  ${verdict}`,
    );
  }

  const winners = rows.filter((r) => r.clear && !r.drifted);
  console.log("");
  if (winners.length) {
    // Among settings that clear both bars, the most visible one wins — holding the
    // mean is a constraint, not something to optimise past the point of texture.
    const best = winners.reduce((a, b) => (a.structure >= b.structure ? a : b));
    console.log(
      `adopt: ${best.name} — front ${best.front} back ${best.back} c ${best.contrast} ` +
        `roughness ${best.roughness} fiber ${best.fiber} fiberSize ${best.fiberSize}`,
    );
    console.log(
      `       grain ${best.grain.toFixed(3)} · mottle ${best.mottle.toFixed(3)} · mean drift ${best.dMean.toFixed(2)}`,
    );
  } else {
    console.log("no setting is both clearly visible and on --sc-paper. Widen the sweep.");
  }

  if (!process.argv.includes("--keep")) rmSync(OUT, { recursive: true, force: true });
}

main();
