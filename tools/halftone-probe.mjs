#!/usr/bin/env node
/**
 * halftone-probe.mjs — measure what the halftone screen actually does.
 *
 *   bash tools/serve.sh 4173 &        # the probe page loads /design/vendor/*
 *   node tools/halftone-probe.mjs     # sweep, print the table
 *   node tools/halftone-probe.mjs --keep
 *
 * WHY THIS EXISTS
 * ---------------
 * The same reason tools/shader-probe.mjs exists. D6's settings were written from
 * screenshots twice and were wrong both times — invisible in one version, grey in
 * the other — and the repo could not catch it because nothing measured. D7 puts a
 * second shader on the page, so it needs its own numbers before it is a rule.
 *
 * A halftone fails differently from a paper texture, so it needs a different
 * measurement. Paper texture asks "can you see it, and did it grey the sheet".
 * A halftone is a REPRODUCTION, and it asks:
 *
 *   FLOODED    coverage → 1. The dots merge and the panel is a solid ink block.
 *              This is r2's rejected failure wearing a halftone's clothes: a
 *              large dark rectangle on a warm paper sheet reads as a foreign
 *              object, whatever produced it.
 *   WASHED     coverage → 0. The dots are too small to read as a picture and the
 *              panel is speckled paper.
 *   DESTROYED  the ink is on the page and the picture is not. This is the one no
 *              eyeball catches reliably, because a wrecked halftone still looks
 *              like a texture — which is precisely why it would pass a review.
 *
 * `fidelity` is the measurement for the third: Pearson correlation between the
 * screened output and the SAME source rendered flat through the same pipeline,
 * both reduced to 24x24-pixel tiles. Tiles, because a halftone is not supposed to
 * match its source pixel for pixel — it is supposed to match it in local average,
 * which is the entire principle of the technique. r = 1 means every tile's tone
 * survived; r near 0 means the dots stopped tracking the picture.
 *
 * It is SIGNED, and that caught the first thing this probe found. Every setting
 * in the first run scored about −0.97: the reproduction was near-perfect and
 * upside down. In the shader a dot's radius grows as the sampled luminance FALLS,
 * so `u_inverted` — which reads like the switch that gives you a positive — is
 * the switch that gives you a negative. The polarity is a one-character mistake
 * that leaves a beautiful, wrong image on the page, and no amount of looking at
 * an abstract test frame would have told anyone which way round it should be.
 *
 * Everything is measured against ink on paper — the only two colours a screen in
 * this brand is allowed, because `--sc-action` may never be spent on decoration
 * and red/yellow are status. That is a constraint, not a setting, so it is not
 * swept.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { coverage, crop, measure, readPngLuminance } from "./lib/pixels.mjs";

const PORT = process.env.PROBE_PORT ?? "4173";
const BASE = `http://localhost:${PORT}/tools/halftone-probe.html`;
const OUT = ".probe-halftone";

// `u_size` sets a dot COUNT across the image box, not a dot size in pixels — so
// the same setting is 31px dots in a hero plate and 6px dots in a 176px trust-band
// tile. Canvas size is therefore a variable of this measurement, and an unmeasured
// variable is how D6 shipped wrong twice. `--tile` re-runs the sweep at the band's
// real tile size; `--pitch` sweeps the cell pitch itself. See PITCH_SWEEP.
//
// BOTH RUNS ARE 16:9, and that is not cosmetic. `u_fit: 2` is cover, so a canvas
// of a different aspect crops a different part of the source — and a crop that
// lands on the bright half of the frame has genuinely less ink in it. Two runs
// whose aspects disagree are not measuring the same thing.
const TILE = process.argv.includes("--tile");
const PITCH = process.argv.includes("--pitch");
const BOX = process.argv.includes("--box");
const W = TILE ? 176 : 880;
const H = TILE ? 99 : 495;

/* ---------- u_size <-> cell pitch in CSS pixels ---------- */

// From the shader: `cellsPerSide = mix(300., 7., pow(u_size, .7))`, then divided
// by a per-type step multiplier — 2 for `classic`, which is the only type D7
// permits. cellsPerSide counts cells down the canvas HEIGHT.
const STEP_MULTIPLIER = 2; // classic
const cellsFromSize = (size) => (300 + (7 - 300) * size ** 0.7) / STEP_MULTIPLIER;
const pitchFromSize = (size, h) => h / cellsFromSize(size);

/** Inverse: the u_size that puts a cell of `pitch` CSS px on a canvas `h` tall. */
function sizeFromPitch(pitch, h) {
  const cells = h / pitch;
  const x = (300 - STEP_MULTIPLIER * cells) / 293;
  if (!(x > 0 && x <= 1)) return null; // pitch unreachable on a canvas this tall
  return x ** (1 / 0.7);
}

const CHROME =
  process.env.CHROME ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

/* ---------- what counts as ink ---------- */

// Rec.709 luma of the two tokens the screen is allowed to use. A pixel is ink if
// it falls below the midpoint — classified against the two colours actually in
// play rather than against a generic 128.
const INK_LUM = 0.2126 * 0x24 + 0.7152 * 0x29 + 0.0722 * 0x2c; // #24292c
const PAPER_LUM = 0.2126 * 0xf1 + 0.7152 * 0xf1 + 0.0722 * 0xec; // #f1f1ec
const SPLIT = (INK_LUM + PAPER_LUM) / 2;

/* ---------- thresholds ---------- */

// A screen has to put enough ink down to be a picture and not so much that the
// panel becomes a block. The band is wide because it is a real design range, not
// a single right answer — what it excludes is the two failures at the ends.
const COVERAGE_MIN = 0.12;
const COVERAGE_MAX = 0.5;
// Below this the dots have stopped tracking the picture and the "image" is a
// pattern. 0.9 is strict on purpose: a halftone that loses a tenth of its tonal
// structure is already visibly wrong next to the source.
const FIDELITY_MIN = 0.9;

/* ---------- the sweep ---------- */

// `size` is the knob the founder's brief actually turns. In the shader it is
// `cellsPerSide = mix(300, 7, pow(u_size, .7))` — so it runs BACKWARDS from what
// the name suggests: size 0.15 is a fine 200-cell screen, size 0.7 is a coarse
// 40-cell one. Aggressive means coarse, means HIGH.
const SWEEP = [
  // The polarity check. Same settings as `poster` with u_inverted flipped, kept
  // permanently in the sweep so the sign of `fidelity` is always demonstrated
  // rather than assumed.
  { name: "poster INVERTED", size: 0.62, radius: 1.0, contrast: 0.5, type: "classic", inverted: 1 },

  { name: "fine (newsprint)", size: 0.2, radius: 1.0, contrast: 0.5, type: "classic" },
  { name: "medium", size: 0.35, radius: 1.0, contrast: 0.5, type: "classic" },
  { name: "coarse", size: 0.5, radius: 1.0, contrast: 0.5, type: "classic" },
  { name: "poster", size: 0.62, radius: 1.0, contrast: 0.5, type: "classic" },
  { name: "billboard", size: 0.75, radius: 1.0, contrast: 0.5, type: "classic" },
  { name: "billboard+", size: 0.88, radius: 1.0, contrast: 0.5, type: "classic" },

  // radius is the dot's ceiling as a fraction of its cell. Past 1.0 neighbouring
  // dots start to touch in the highlights, which is where FLOODED begins.
  { name: "coarse r1.3", size: 0.5, radius: 1.3, contrast: 0.5, type: "classic" },
  { name: "coarse r0.7", size: 0.5, radius: 0.7, contrast: 0.5, type: "classic" },

  // contrast is a sigmoid on the sampled luminance, mix(0,15,pow(c,1.5)). High
  // values crush the midtones to black and white, which is what destroys fidelity
  // while still looking, to the eye, like a punchier halftone.
  { name: "coarse c0.25", size: 0.5, radius: 1.0, contrast: 0.25, type: "classic" },
  { name: "coarse c0.8", size: 0.5, radius: 1.0, contrast: 0.8, type: "classic" },

  { name: "coarse hex", size: 0.5, radius: 1.0, contrast: 0.5, type: "classic", grid: "hex" },
  { name: "soft", size: 0.5, radius: 1.0, contrast: 0.5, type: "soft" },
  { name: "gooey", size: 0.5, radius: 1.0, contrast: 0.5, type: "gooey" },
  { name: "holes", size: 0.5, radius: 1.0, contrast: 0.5, type: "holes" },

  // Not a style option — a check. u_grainOverlay mixes the output toward
  // vec3(step(0., v)), i.e. pure black and pure white speckle, which is neither
  // of the two tokens the screen is allowed. Measured so D7 can ban it with a
  // number rather than an opinion.
  { name: "grainOverlay .4", size: 0.5, radius: 1.0, contrast: 0.5, type: "classic", grainOverlay: 0.4 },
];

/* ---------- fidelity ---------- */

/**
 * Pearson correlation of two images reduced to TILE x TILE block means.
 *
 * Block means, not pixels: a halftone deliberately does not match its source
 * pixel for pixel — it matches it in local average. Correlating raw pixels would
 * score a perfect screen near zero and tell us nothing.
 */
function fidelity(a, b, tile = TILE ? 8 : 24) {
  const tiles = (img) => {
    const out = [];
    for (let ty = 0; ty + tile <= img.h; ty += tile) {
      for (let tx = 0; tx + tile <= img.w; tx += tile) {
        let s = 0;
        for (let y = ty; y < ty + tile; y++) {
          for (let x = tx; x < tx + tile; x++) s += img.lum[y * img.w + x];
        }
        out.push(s / (tile * tile));
      }
    }
    return out;
  };
  const A = tiles(a);
  const B = tiles(b);
  const n = Math.min(A.length, B.length);
  let ma = 0;
  let mb = 0;
  for (let i = 0; i < n; i++) {
    ma += A[i];
    mb += B[i];
  }
  ma /= n;
  mb /= n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const x = A[i] - ma;
    const y = B[i] - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  return da && db ? num / Math.sqrt(da * db) : 0;
}

/* ---------- driver ---------- */

// Comfortably above Chrome's minimum window size. Every box is drawn as a sized
// ELEMENT pinned to the top-left inside this window and cropped out afterwards —
// see the note in halftone-probe.html for what happens if you size the window
// instead.
const WINDOW_W = 1100;
const WINDOW_H = 760;

function shoot(file, query, box) {
  const w = box?.w ?? W;
  const h = box?.h ?? H;
  execFileSync(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--enable-unsafe-swiftshader",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--virtual-time-budget=6000",
      `--window-size=${WINDOW_W},${WINDOW_H}`,
      `--screenshot=${file}`,
      `${BASE}?${query}&bw=${w}&bh=${h}`,
    ],
    { stdio: ["ignore", "ignore", "ignore"] },
  );
}

/** Read a shot and crop it to the box it was drawn into. */
function read(file, box) {
  return crop(readPngLuminance(file), box?.w ?? W, box?.h ?? H);
}

/**
 * Sweep the CELL PITCH IN CSS PIXELS, at two canvas sizes, holding the pitch
 * constant across both.
 *
 * This is the measurement that explains why the settings sweep disagrees with
 * itself. `getCircle` antialiases with `float aa = fwidth(d)` — a screen-space
 * derivative — so the smoothstep band is a fixed number of PIXELS wide however
 * large the cell is. On a 31px cell that band is a rim; on a 6px cell it is most
 * of the dot, and the small dots in the highlights are smeared below the point
 * where they read as ink at all.
 *
 * Consequence, and it is the whole reason D7 specifies a pitch rather than a
 * u_size: **the same `u_size` is a different design in a different sized box.**
 * Identical settings measured coverage 0.339 in an 880x495 plate and 0.084 in a
 * 176x99 tile — the plate is a photograph, the tile is speckled paper.
 */
const PITCH_SWEEP = [3, 4, 6, 8, 12, 16, 24, 32];
const PITCH_BOXES = [
  { name: "plate", w: 880, h: 495 },
  { name: "tile", w: 176, h: 99 },
];

function pitchMode() {
  const rows = [];
  for (const box of PITCH_BOXES) {
    process.stderr.write(`\n  ${box.name} ${box.w}x${box.h}\n`);
    shoot(`${OUT}/flat-${box.name}.png`, "flat=1", box);
    const flat = read(`${OUT}/flat-${box.name}.png`, box);

    for (const pitch of PITCH_SWEEP) {
      const size = sizeFromPitch(pitch, box.h);
      if (size === null || size > 1) {
        rows.push({ box: box.name, pitch, size: null });
        process.stderr.write(`    ${pitch}px — unreachable on this box\n`);
        continue;
      }
      const q = new URLSearchParams({
        size: String(size),
        radius: "1",
        contrast: "0.5",
        type: "classic",
        grid: "square",
        inverted: "0",
        grainMixer: "0",
        grainOverlay: "0",
      });
      const file = `${OUT}/pitch-${box.name}-${pitch}.png`;
      shoot(file, q.toString(), box);
      const img = read(file, box);
      const cov = coverage(img, SPLIT);
      const fid = fidelity(flat, img, Math.max(6, Math.round(box.h / 20)));
      rows.push({ box: box.name, pitch, size, cov, fid, grain: measure(img).grain });
      process.stderr.write(
        `    ${String(pitch).padStart(2)}px  u_size ${size.toFixed(3)}  cov ${cov.toFixed(3)}  fid ${fid.toFixed(3)}\n`,
      );
    }
  }

  console.log("");
  console.log("| box | pitch (css px) | u_size | coverage | grain | fidelity | |");
  console.log("|---|---|---|---|---|---|---|");
  for (const r of rows) {
    if (r.size === null) {
      console.log(`| ${r.box} | ${r.pitch} | — | — | — | — | unreachable on this box |`);
      continue;
    }
    const verdict =
      r.cov > COVERAGE_MAX
        ? "**FLOODED**"
        : r.cov < COVERAGE_MIN
          ? "**WASHED** — dots antialiased away"
          : r.fid < FIDELITY_MIN
            ? "**DESTROYED**"
            : "ok";
    console.log(
      `| ${r.box} | ${r.pitch} | ${r.size.toFixed(3)} | ${r.cov.toFixed(3)} | ${r.grain.toFixed(2)} | ${r.fid.toFixed(3)} | ${verdict} |`,
    );
  }
  console.log("");
  console.log(
    `Same pitch, two box sizes. Where the two boxes agree, pitch is the honest unit.`,
  );
  console.log("");
}

/**
 * Hold every uniform still and vary ONLY the box the screen is drawn in.
 *
 * The pitch sweep showed the two boxes disagreeing at every pitch, which rules
 * out "coarse dots need a big box" as the explanation and leaves box size itself
 * as the variable. This isolates it: one u_size, one source, one aspect, seven
 * sizes. Whatever the mechanism inside the shader, the output of this run is the
 * number D7 actually needs — the box height below which a screen stops holding
 * its ink.
 */
const BOX_SWEEP = [880, 640, 480, 360, 280, 220, 176].map((w) => ({
  name: `${w}`,
  w,
  h: Math.round((w * 9) / 16),
}));

function boxMode() {
  const size = 0.6;
  const rows = [];
  for (const box of BOX_SWEEP) {
    process.stderr.write(`  ${box.w}x${box.h}… `);
    shoot(`${OUT}/flat-${box.name}.png`, "flat=1", box);
    const flat = read(`${OUT}/flat-${box.name}.png`, box);
    const q = new URLSearchParams({
      size: String(size),
      radius: "1",
      contrast: "0.5",
      type: "classic",
      grid: "square",
      inverted: "0",
      grainMixer: "0",
      grainOverlay: "0",
    });
    const file = `${OUT}/box-${box.name}.png`;
    shoot(file, q.toString(), box);
    const img = read(file, box);
    const m = measure(img);
    const cov = coverage(img, SPLIT);
    const fid = fidelity(flat, img, Math.max(6, Math.round(box.h / 20)));
    rows.push({ ...box, cov, fid, mean: m.mean, pitch: pitchFromSize(size, box.h) });
    process.stderr.write(`cov ${cov.toFixed(3)}  fid ${fid.toFixed(3)}\n`);
  }

  console.log("");
  console.log(`u_size ${size} held constant · only the box changes · all 16:9`);
  console.log("");
  console.log("| box | cell pitch | coverage | mean | fidelity | |");
  console.log("|---|---|---|---|---|---|");
  for (const r of rows) {
    const verdict =
      r.cov > COVERAGE_MAX
        ? "**FLOODED**"
        : r.cov < COVERAGE_MIN
          ? "**WASHED**"
          : r.fid < FIDELITY_MIN
            ? "**DESTROYED**"
            : "ok";
    console.log(
      `| ${r.w}x${r.h} | ${r.pitch.toFixed(1)}px | ${r.cov.toFixed(3)} | ${r.mean.toFixed(1)} | ${r.fid.toFixed(3)} | ${verdict} |`,
    );
  }
  console.log("");
}

function main() {
  if (!existsSync(CHROME)) {
    console.error(`error: Chrome not found at ${CHROME}\n       set CHROME=/path/to/chrome`);
    process.exit(1);
  }
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  if (BOX) {
    boxMode();
    if (!process.argv.includes("--keep")) rmSync(OUT, { recursive: true, force: true });
    return;
  }

  if (PITCH) {
    pitchMode();
    if (!process.argv.includes("--keep")) rmSync(OUT, { recursive: true, force: true });
    return;
  }

  process.stderr.write("source baseline… ");
  shoot(`${OUT}/flat.png`, "flat=1");
  const flat = read(`${OUT}/flat.png`);
  const flatM = measure(flat);
  process.stderr.write(`mean ${flatM.mean.toFixed(2)}\n\n`);

  const rows = [];
  for (const s of SWEEP) {
    process.stderr.write(`  ${s.name}… `);
    const q = new URLSearchParams({
      size: String(s.size),
      radius: String(s.radius),
      contrast: String(s.contrast),
      type: s.type,
      grid: s.grid ?? "square",
      inverted: String(s.inverted ?? 0),
      grainMixer: String(s.grainMixer ?? 0),
      grainOverlay: String(s.grainOverlay ?? 0),
    });
    const file = `${OUT}/${s.name.replace(/[^a-z0-9]+/gi, "-")}.png`;
    shoot(file, q.toString());
    const img = read(file);
    const m = measure(img);
    const cov = coverage(img, SPLIT);
    const fid = fidelity(flat, img);
    rows.push({ ...s, ...m, cov, fid });
    process.stderr.write(`cov ${cov.toFixed(3)}  fidelity ${fid.toFixed(3)}\n`);
  }

  console.log("");
  console.log("| setting | size | radius | contrast | type | coverage | grain | fidelity | |");
  console.log("|---|---|---|---|---|---|---|---|---|");
  for (const r of rows) {
    const verdict =
      r.fid < 0
        ? "**INVERTED** — tone reversed, u_inverted is backwards"
        : r.cov > COVERAGE_MAX
          ? "**FLOODED** — solid ink block"
          : r.cov < COVERAGE_MIN
            ? "**WASHED** — not a picture"
            : r.fid < FIDELITY_MIN
              ? "**DESTROYED** — ink on the page, picture gone"
              : "ok";
    console.log(
      `| ${r.name} | ${r.size} | ${r.radius} | ${r.contrast} | ${r.type}${r.grid === "hex" ? " hex" : ""} ` +
        `| ${r.cov.toFixed(3)} | ${r.grain.toFixed(2)} | ${r.fid.toFixed(3)} | ${verdict} |`,
    );
  }
  console.log("");
  console.log(
    `coverage band ${COVERAGE_MIN}–${COVERAGE_MAX} · fidelity floor ${FIDELITY_MIN} · ` +
      `ink #24292c on paper #f1f1ec · ${W}x${H}`,
  );
  console.log("");

  if (!process.argv.includes("--keep")) rmSync(OUT, { recursive: true, force: true });
  else console.log(`  frames kept in ${OUT}/\n`);
}

main();
