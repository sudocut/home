#!/usr/bin/env node
/**
 * shader-survey.mjs — render every brand-legal paper-shader and measure it.
 *
 *   bash tools/serve.sh 4173 &
 *   node tools/shader-survey.mjs           # render, measure, print the table
 *   node tools/shader-survey.mjs --keep    # leave the PNGs in .probe-survey/
 *
 * WHY THIS EXISTS
 * ---------------
 * The founder asked us to stop assuming `halftone-dots` is the right shader and
 * go and look at the catalogue. "Look at them" is not a reading exercise: the
 * library ships 29 shaders, their descriptions are marketing, and the ones that
 * survive this brand are decided by two things a description cannot tell you —
 * whether every colour slot can be filled from a three-colour palette, and
 * whether the result still looks like ink printed on paper.
 *
 * THE PALETTE IS THE FIRST FILTER, AND IT REMOVES MOST OF THEM.
 * `mesh-gradient`, `smoke-ring`, `god-rays`, `metaballs`, `gem-smoke`,
 * `liquid-metal`, `warp`, `grain-gradient`, `pulsing-border`, `color-panels`,
 * `heatmap`, `neuro-noise` and both gradient shaders are built to blend many
 * colours, and several are built to GLOW — W5 bans blur outright and W8 bans
 * decorative gradients. `voronoi` has a `u_colorGlow`. `halftone-cmyk` has four
 * inks. None of that is a taste judgement; they cannot be expressed in this
 * palette at all, so they are not rendered here.
 *
 * What is left is measured. `u_time` is checked per shader rather than assumed,
 * because `halftone-dots` declares it and never reads it — animating with `speed`
 * there renders a byte-identical frame forever.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { coverage, crop, measure, readPngLuminance } from "./lib/pixels.mjs";

const PORT = process.env.PROBE_PORT ?? "4173";
const BASE = `http://localhost:${PORT}/tools/shader-survey.html`;
const OUT = ".probe-survey";
const W = 880;
const H = 495;
const WINDOW_W = 1100;
const WINDOW_H = 760;

const CHROME =
  process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const INK_LUM = 0.2126 * 0x24 + 0.7152 * 0x29 + 0.0722 * 0x2c;
const PAPER_LUM = 0.2126 * 0xf1 + 0.7152 * 0xf1 + 0.0722 * 0xec;
const SPLIT = (INK_LUM + PAPER_LUM) / 2;

const WAVE = "/frames/base-wave.png";

/**
 * The candidates, with the settings each is actually being proposed at.
 *
 * `slots` records how many colour uniforms the shader has and what they are being
 * filled with, because that is the compliance question. `animated` says whether
 * `u_time` is read in `main()` — checked in the source, then demonstrated below.
 */
const SPECTRO = "/frames/base-spectrogram.png";
const TIMELINE = "/frames/base-timeline.png";

// The six r7 proposes, plus the incumbent as a control. Three hold the shader
// constant and change the picture; two change the shader; one changes nothing.
// That split is deliberate — it is the only way the round can separate "which
// shader" from "which base image", which one comparison of six free-form designs
// cannot do.
const DITHER = { u_type: 4, u_pxSize: 3, u_colorHighlight: "ink", u_originalColors: false, u_inverted: true };

const CANDIDATES = [
  { id: "halftone-dots", label: "CONTROL halftone-dots on wave", slots: "2 · ink/paper",
    u: { u_size: 0.62, u_radius: 1, u_contrast: 0.5, u_type: 0, u_grid: 0, u_inverted: false, u_originalColors: false, u_grainMixer: 0, u_grainOverlay: 0, u_grainSize: 0.5 }, src: WAVE },

  { id: "image-dithering", label: "PICK image-dithering on wave", slots: "3 · ink/paper/ink", u: DITHER, src: WAVE },
  { id: "image-dithering", label: "image-dithering on spectrogram", slots: "3 · ink/paper/ink", u: DITHER, src: SPECTRO },
  { id: "image-dithering", label: "image-dithering on timeline", slots: "3 · ink/paper/ink", u: DITHER, src: TIMELINE },
  { id: "image-dithering", label: "image-dithering on wave, px6", slots: "3 · ink/paper/ink", u: { ...DITHER, u_pxSize: 6 }, src: WAVE },

  { id: "dithering", label: "dithering · simplex, procedural", slots: "2 · ink/paper",
    u: { u_shape: 1, u_type: 4, u_pxSize: 3, u_scale: 0.55 }, animated: true },

  { id: "dot-grid", label: "dot-grid · fine circles", slots: "3 · paper/ink/ink",
    u: { u_dotSize: 5, u_gapX: 24, u_gapY: 24, u_strokeWidth: 0, u_sizeRange: 0, u_opacityRange: 0, u_shape: 0 } },
];



function shoot(file, params) {
  const q = new URLSearchParams(params);
  execFileSync(
    CHROME,
    [
      "--headless=new",
      "--disable-gpu",
      "--enable-unsafe-swiftshader",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--virtual-time-budget=8000",
      `--window-size=${WINDOW_W},${WINDOW_H}`,
      `--screenshot=${file}`,
      `${BASE}?${q}&bw=${W}&bh=${H}`,
    ],
    { stdio: ["ignore", "ignore", "ignore"] },
  );
}

const read = (file) => crop(readPngLuminance(file), W, H);

function main() {
  if (!existsSync(CHROME)) {
    console.error(`error: Chrome not found at ${CHROME}\n       set CHROME=/path/to/chrome`);
    process.exit(1);
  }
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  const rows = [];
  for (const c of CANDIDATES) {
    const slug = c.label.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    process.stderr.write(`  ${c.label}… `);
    const params = { shader: c.id, u: JSON.stringify(c.u), ...(c.src ? { src: c.src } : {}) };

    try {
      shoot(`${OUT}/${slug}.png`, params);
      const img = read(`${OUT}/${slug}.png`);
      const m = measure(img);
      const cov = coverage(img, SPLIT);

      // Demonstrate the animation rather than trusting the source scan: two
      // frames far apart, at speed 1. Identical means u_time is decorative.
      let moves = "—";
      if (c.animated) {
        shoot(`${OUT}/${slug}-t0.png`, { ...params, speed: 1, frame: 0 });
        shoot(`${OUT}/${slug}-t9.png`, { ...params, speed: 1, frame: 9000 });
        const a = read(`${OUT}/${slug}-t0.png`);
        const b = read(`${OUT}/${slug}-t9.png`);
        let d = 0;
        for (let i = 0; i < a.lum.length; i++) d += Math.abs(a.lum[i] - b.lum[i]);
        d /= a.lum.length;
        moves = d > 1 ? `yes ${d.toFixed(1)}` : `**NO** ${d.toFixed(2)}`;
      }

      rows.push({ ...c, slug, ...m, cov, moves });
      process.stderr.write(`cov ${cov.toFixed(3)} grain ${m.grain.toFixed(1)} moves ${moves}\n`);
    } catch (e) {
      rows.push({ ...c, slug, failed: String(e.message).slice(0, 60) });
      process.stderr.write(`FAILED\n`);
    }
  }

  console.log("");
  console.log("| shader | colour slots | coverage | grain | mottle | u_time moves | |");
  console.log("|---|---|---|---|---|---|---|");
  for (const r of rows) {
    if (r.failed) {
      console.log(`| ${r.label} | ${r.slots} | — | — | — | — | failed: ${r.failed} |`);
      continue;
    }
    // Same two failure modes as D7: too much ink is a block, too little is a
    // smudge. `grain` says whether the mark has structure or is flat tone.
    const verdict =
      r.cov > 0.5 ? "**FLOODED**" : r.cov < 0.1 ? "**FAINT**" : r.grain < 5 ? "**FLAT** — no structure" : "ok";
    console.log(
      `| ${r.label} | ${r.slots} | ${r.cov.toFixed(3)} | ${r.grain.toFixed(1)} | ${r.mottle.toFixed(1)} | ${r.moves} | ${verdict} |`,
    );
  }
  console.log("");
  console.log(`ink #24292c on paper #f1f1ec · ${W}x${H} · source ${WAVE}`);
  console.log("");

  if (!process.argv.includes("--keep")) rmSync(OUT, { recursive: true, force: true });
  else console.log(`  renders kept in ${OUT}/\n`);
}

main();
