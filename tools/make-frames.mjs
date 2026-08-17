#!/usr/bin/env node
/**
 * make-frames.mjs — generate the greyscale source images the halftone screens.
 *
 *   node tools/make-frames.mjs          # writes public/frames/*.png
 *   node tools/make-frames.mjs --check  # regenerate to a temp dir and diff
 *
 * WHY THESE EXIST, AND WHAT THEY ARE NOT
 * --------------------------------------
 * `halftone-dots` is an image FILTER (design/vendor/paper-shaders/shaders/
 * halftone-dots.d.ts). With no `u_image` it screens nothing — the same class of
 * bug that made the D6 paper texture inert for two rounds. So the halftone needs
 * a picture, and the site does not have one.
 *
 * It does not have one for an honest reason: **we have no cleared frame of any
 * partner channel's footage.** Naming a channel is ours to do (the names are the
 * channels' own public titles). Publishing a still from their video is theirs to
 * grant, and nobody has been asked.
 *
 * So these are NOT footage, NOT thumbnails, and NOT anything anyone shot. They
 * are abstract luminance fields — a key light, a falloff and a couple of low
 * harmonics — built to give the screen something with real tonal range to bite
 * on. They are deliberately non-representational so no visitor can mistake them
 * for a frame of a real episode, which is the failure mode soul.md's "never show
 * a capability we don't have" is pointed at.
 *
 * When real cleared stills exist, drop them at public/channels/<handle>.jpg and
 * src/content/channels.ts picks them up. Nothing here changes.
 *
 * Committed rather than generated at build time so `pnpm build` needs no image
 * toolchain, and so the PR that changes a frame shows the frame changing.
 *
 * Zero dependencies — node:zlib writes the PNG.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public/frames");

/* ---------- minimal PNG writer (colour type 0, 8-bit greyscale) ---------- */

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.allocUnsafe(data.length + 12);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

/**
 * Encode a w*h Uint8Array of grey levels as a PNG.
 *
 * Every scanline uses filter 1 (Sub). These images are smooth left-to-right
 * fields, so the horizontal delta is almost always 0 or ±1 and deflate packs the
 * result far tighter than filter 0 does on the same data. Nothing here needs an
 * adaptive filter heuristic; one filter that suits the content is enough.
 */
function encodePng(w, h, grey) {
  const raw = Buffer.allocUnsafe(h * (w + 1));
  for (let y = 0; y < h; y++) {
    const row = y * (w + 1);
    raw[row] = 1; // Sub
    for (let x = 0; x < w; x++) {
      const v = grey[y * w + x];
      raw[row + 1 + x] = (v - (x > 0 ? grey[y * w + x - 1] : 0)) & 0xff;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 0; // colour type: greyscale
  // 10,11,12 = compression 0, filter 0, interlace 0 — already zero.

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ---------- the fields ---------- */

/** Deterministic hash-noise in [0,1). No Math.random: a rerun must be byte-identical. */
function hash2(x, y, seed) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Value noise: hash on a lattice, smoothstep between. Gives soft blotches, not static. */
function valueNoise(x, y, seed) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

/**
 * One frame: a key light off-centre, a falloff away from it, two slow harmonics
 * and a little cloud. The result has a bright core, a mid ramp and a dark corner
 * — the three tones a halftone needs to show large dots, small dots and none.
 *
 * `seed` moves the key light and the harmonics, so the six frames read as six
 * different lighting set-ups rather than six crops of one gradient.
 */
function field(w, h, seed) {
  const grey = new Uint8Array(w * h);
  const kx = 0.28 + 0.44 * hash2(seed, 11, 7);
  const ky = 0.24 + 0.42 * hash2(seed, 23, 7);
  const spread = 0.42 + 0.30 * hash2(seed, 31, 7);
  const ax = 1.4 + 2.6 * hash2(seed, 41, 7);
  const ay = 1.1 + 2.2 * hash2(seed, 53, 7);
  const tilt = -0.6 + 1.2 * hash2(seed, 67, 7);

  for (let y = 0; y < h; y++) {
    const v = y / (h - 1);
    for (let x = 0; x < w; x++) {
      const u = x / (w - 1);

      // Key light — a soft radial core. Aspect-corrected so it stays round.
      const dx = (u - kx) * (w / h);
      const dy = v - ky;
      const key = Math.exp(-(dx * dx + dy * dy) / (2 * spread * spread));

      // Two slow harmonics: the "set" behind the subject.
      const wave = 0.5 + 0.5 * Math.sin(ax * Math.PI * u + tilt) * Math.cos(ay * Math.PI * v);

      // Low-frequency cloud, so flat areas are not perfectly flat.
      const cloud = valueNoise(u * 5.5, v * 5.5, seed) * 0.5 + valueNoise(u * 13, v * 13, seed + 1) * 0.5;

      // Falloff to a dark bottom-right corner gives the screen a true black end.
      const corner = 1 - 0.55 * Math.max(0, u * 0.6 + v * 0.6 - 0.45);

      let t = (0.62 * key + 0.26 * wave + 0.12 * cloud) * corner;

      // Stretch to the full 0-1 range, then S-curve it twice.
      //
      // One gentle curve was not enough, and the halftone is what proved it: the
      // first version of these frames sat almost entirely in the midtones, and a
      // screen of nothing but midtones is a field of near-identical dots — it
      // reads as a texture swatch rather than as a picture of anything. A screen
      // only looks like a reproduction if the source actually has blacks and
      // whites for the dots to run between.
      t = Math.max(0, Math.min(1, (t - 0.18) / 0.62));
      t = t * t * (3 - 2 * t);
      t = t * t * (3 - 2 * t);

      // Then lift the whole thing. The curves alone left the frames at mean 98,
      // which screened to coverage 0.46 — inside D7's band but at the top of it,
      // and a plate that dark on a warm sheet is walking back toward the ink
      // block the founder rejected in r2. At 0.72 the frames screen to about
      // 0.34, the middle of the band. Verified with tools/halftone-probe.mjs, not
      // by looking at them.
      t **= 0.72;

      grey[y * w + x] = Math.max(0, Math.min(255, Math.round(t * 255)));
    }
  }
  return grey;
}

/* ---------- the base image: a waveform, and the same waveform cut ---------- */

/**
 * WHY A WAVEFORM AND NOT A PICTURE OF SOMETHING
 *
 * r6 needs a base image for the screen, and the abstract light fields above were
 * chosen for tonal range rather than for meaning. A waveform is the one image
 * this company can put on its own front page that is **both** honest and about
 * the product: it is literally what SudoCut looks at. It invents no footage, it
 * impersonates nobody's episode, and it needs no one's permission.
 *
 * It also halftones well, which is not a given. A screen needs a tonal ramp —
 * flat shapes make flat dots — so the envelope is drawn with a soft vertical
 * falloff rather than as a hard silhouette. The dots grade out at the edge of the
 * waveform the way ink does off the edge of a solid.
 *
 * TWO IMAGES FROM ONE SIGNAL. `base-wave.png` is the recording with its dead air
 * in it. `base-wave-cut.png` is the SAME signal with the silences removed and the
 * remainder closed up — which is the product, in one picture. A variant that hard
 * cuts between them is not decorating, it is demonstrating; and a hard cut is the
 * only transition the brand allows (O4), so the honest option is also the legal
 * one.
 */

/** Amplitude envelope of a plausible run of speech, in [0,1], length n. */
function speechEnvelope(n, seed) {
  const env = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    // Phrase level: slow swells, someone talking in sentences.
    const phrase =
      0.5 + 0.5 * Math.sin(2 * Math.PI * (t * 3.1 + hash2(seed, 1, 5))) * Math.cos(2 * Math.PI * t * 1.7);
    // Syllable level: the fast beat inside a phrase.
    const syll = 0.5 + 0.5 * Math.sin(2 * Math.PI * t * 190 + 3 * valueNoise(t * 40, seed, seed));
    // Texture, so no two peaks are the same height.
    const grit = valueNoise(t * 220, seed * 1.7, seed + 3);
    env[i] = Math.max(0, Math.min(1, (0.55 * phrase + 0.3 * syll + 0.15 * grit) * phrase));
  }
  return env;
}

/**
 * The runs of dead air. A gap counts only if it is both quiet AND long — which is
 * the actual rule, not a simplification of one: a short quiet moment between two
 * words is speech, and cutting it is what makes an edit sound clipped.
 */
function silences(env, floor, minRun) {
  const runs = [];
  let start = -1;
  for (let i = 0; i < env.length; i++) {
    const quiet = env[i] < floor;
    if (quiet && start < 0) start = i;
    if ((!quiet || i === env.length - 1) && start >= 0) {
      if (i - start >= minRun) runs.push([start, i]);
      start = -1;
    }
  }
  return runs;
}

/** Draw an envelope as a mirrored band with a soft edge, dark on light. */
function drawWave(w, h, sample) {
  const grey = new Uint8Array(w * h);
  const mid = (h - 1) / 2;
  const maxAmp = h * 0.42;
  // The soft edge, in pixels. This is the whole reason the result halftones into
  // a ramp of dot sizes instead of a solid block with a hard border.
  const soft = h * 0.055;

  for (let x = 0; x < w; x++) {
    const a = sample(x / (w - 1));
    const half = Math.max(1.2, a * maxAmp);
    for (let y = 0; y < h; y++) {
      const d = Math.abs(y - mid);
      // 1 inside the band, 0 outside, smooth across `soft`.
      let inside = 1 - Math.max(0, Math.min(1, (d - half + soft) / soft));
      inside = inside * inside * (3 - 2 * inside);
      // A faint baseline so a silent stretch still reads as a track rather than
      // as blank paper — dead air is part of the picture, not an absence of it.
      const base = Math.exp(-(d * d) / (2 * 2.2 * 2.2)) * 0.28;
      const ink = Math.max(inside, base);
      grey[y * w + x] = Math.round(255 * (1 - 0.94 * ink));
    }
  }
  return grey;
}

function waveFrames(w, h, seed) {
  const N = 4096;
  const env = speechEnvelope(N, seed);
  const gaps = silences(env, 0.17, Math.round(N * 0.018));

  // Raw: the recording as it came off the camera, dead air included.
  const raw = drawWave(w, h, (u) => env[Math.min(N - 1, Math.round(u * (N - 1)))]);

  // Cut: the same signal with those runs removed and the rest closed up. Built by
  // index remapping rather than by redrawing, so it is provably the same audio —
  // if it were regenerated the two images would be different recordings and the
  // hard cut between them would be a lie about what changed.
  const keep = [];
  let g = 0;
  for (let i = 0; i < N; i++) {
    while (g < gaps.length && i > gaps[g][1]) g++;
    if (g < gaps.length && i >= gaps[g][0] && i <= gaps[g][1]) continue;
    keep.push(i);
  }
  const cut = drawWave(w, h, (u) => env[keep[Math.min(keep.length - 1, Math.round(u * (keep.length - 1)))]]);

  const removed = 1 - keep.length / N;
  return { raw, cut, removed };
}

/* ---------- driver ---------- */

// Small on purpose. The screen destroys detail by definition — a 1600px source
// and a 400px source produce the same dots — so anything larger is bytes the
// visitor downloads to have them thrown away by the fragment shader.
const FRAMES = [
  { name: "frame-hero", w: 960, h: 540, seed: 3 },
  { name: "frame-01", w: 480, h: 270, seed: 11 },
  { name: "frame-02", w: 480, h: 270, seed: 19 },
  { name: "frame-03", w: 480, h: 270, seed: 27 },
  { name: "frame-04", w: 480, h: 270, seed: 35 },
  { name: "frame-05", w: 480, h: 270, seed: 43 },
  { name: "frame-06", w: 480, h: 270, seed: 51 },
];

const check = process.argv.includes("--check");
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

// The r6 base image, and the same signal with its dead air removed. Wider than
// the tiles because this one is a full-bleed hero background, and the screen pans
// across it.
const WAVE = { w: 1280, h: 720, seed: 7 };

let changed = 0;

{
  const { raw, cut, removed } = waveFrames(WAVE.w, WAVE.h, WAVE.seed);
  for (const [name, grey] of [["base-wave", raw], ["base-wave-cut", cut]]) {
    const png = encodePng(WAVE.w, WAVE.h, grey);
    const file = join(OUT, `${name}.png`);
    const same = existsSync(file) && readFileSync(file).equals(png);
    if (check) {
      if (!same) {
        changed++;
        console.error(`  \u2717 ${name}.png differs from the committed file`);
      }
      continue;
    }
    if (!same) changed++;
    writeFileSync(file, png);
    console.log(`  ${same ? "\u00b7" : "\u2713"} ${name}.png  ${WAVE.w}\u00d7${WAVE.h}  ${(png.length / 1024).toFixed(1)}kb`);
  }
  if (!check) console.log(`    dead air removed by the cut: ${(removed * 100).toFixed(1)}%`);
}

for (const f of FRAMES) {
  const png = encodePng(f.w, f.h, field(f.w, f.h, f.seed));
  const file = join(OUT, `${f.name}.png`);
  const same = existsSync(file) && readFileSync(file).equals(png);
  if (check) {
    if (!same) {
      changed++;
      console.error(`  ✗ ${f.name}.png differs from the committed file`);
    }
    continue;
  }
  if (!same) changed++;
  writeFileSync(file, png);
  console.log(`  ${same ? "·" : "✓"} ${f.name}.png  ${f.w}×${f.h}  ${(png.length / 1024).toFixed(1)}kb`);
}

if (check) {
  if (changed) {
    console.error(`\n${changed} frame(s) out of date — run: node tools/make-frames.mjs\n`);
    process.exit(1);
  }
  console.log("\nframes match the committed files.\n");
} else {
  console.log(`\n${FRAMES.length} frame(s) in public/frames — ${changed} written, ${FRAMES.length - changed} already current.\n`);
}
