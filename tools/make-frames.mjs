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

/* ---------- the base image: one continuous, looping waveform ---------- */

/**
 * WHY A WAVEFORM AND NOT A PICTURE OF SOMETHING
 *
 * A waveform is the one image this company can put on its own front page that is
 * both honest and about the product: it is literally what SudoCut looks at. It
 * invents no footage, impersonates nobody's episode, and needs no one's
 * permission. The abstract light fields it replaced managed that only by meaning
 * nothing at all.
 *
 * WHY IT IS PERIODIC, WHICH IS THE WHOLE POINT OF THIS FILE
 *
 * Founder, 2026-08-18: *"there's some audio waves flow on the background, but it
 * is not connected from start to the end so user can feel that it's
 * disconnected."* That was exactly right, and it was not a bug in the animation —
 * it was a property of the image. The first waveform was a one-off stretch of
 * signal, so however smoothly the screen panned across it, reaching the end meant
 * jumping back to a different-looking start. There is no pan that hides that.
 *
 * The fix is in the picture, not the motion: **the content repeats exactly twice
 * across the image.** Everything below is built from basis functions with whole
 * numbers of cycles over one half-width — sines at integer frequencies, and a
 * value noise whose lattice wraps — so the second half is byte-identical to the
 * first and the signal has no beginning or end.
 *
 * A window narrower than half the image can then pan by exactly half the image
 * width and jump back, and the jump is invisible because it lands on identical
 * content. That is a true infinite loop rather than a long one.
 *
 * THE ASPECT RATIO IS PART OF THE MECHANISM, NOT A STYLE CHOICE.
 *
 * `u_fit: cover` shows a window of the image whose width, as a fraction, is
 * (box aspect / image aspect). The pan is ±1/4 of the image, so the window must
 * fit in the remaining half:
 *
 *     boxAspect / imageAspect <= 1/2      i.e.   boxAspect <= 4
 *
 * At aspect 8 that holds for every hero shape this site can produce — a 1280x560
 * band is 2.29, a phone is under 1 — with margin to spare. Go below aspect 8 and
 * a wide, short hero starts panning past the edge of the image, where
 * `getUvFrame` blanks it to nothing.
 */

/** Value noise that wraps: the lattice is `cells` wide and index `cells` IS index 0. */
function loopNoise(t, cells, seed) {
  const x = t * cells;
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  const a = hash2(i % cells, 0, seed);
  const b = hash2((i + 1) % cells, 0, seed);
  return a * (1 - u) + b * u;
}

/**
 * One period of a plausible run of speech, sampled `m` times.
 *
 * Every term is periodic over the full length: the sines take integer cycle
 * counts and the noise wraps its lattice. Nothing here may use a non-integer
 * frequency — one would put a step at the loop point, which is the entire defect
 * this is built to remove.
 */
function loopEnvelope(m, seed) {
  const env = new Float64Array(m);
  const phase = hash2(seed, 1, 5) * Math.PI * 2;
  for (let i = 0; i < m; i++) {
    const t = i / m;
    // Phrase level: three swells against two, so the pattern takes the whole
    // loop to come back round rather than repeating within it.
    const phrase =
      0.5 + 0.5 * Math.sin(2 * Math.PI * 3 * t + phase) * Math.cos(2 * Math.PI * 2 * t);
    // Syllable level: the fast beat inside a phrase.
    const syll = 0.5 + 0.5 * Math.sin(2 * Math.PI * 97 * t + 3 * loopNoise(t, 23, seed));
    // Texture, so no two peaks are the same height.
    const grit = loopNoise(t, 131, seed + 3);
    env[i] = Math.max(0, Math.min(1, (0.55 * phrase + 0.3 * syll + 0.15 * grit) * phrase));
  }
  return env;
}

/**
 * Draw the envelope as a mirrored band with a soft edge, dark on light, repeated
 * exactly twice across the width.
 *
 * The soft edge is what makes this halftone into a ramp of dot sizes rather than
 * a solid block with a hard border, and it is why the screen reads as a
 * reproduction at all.
 */
function loopWave(w, h, seed) {
  const grey = new Uint8Array(w * h);
  const env = loopEnvelope(Math.round(w / 2), seed);
  const mid = (h - 1) / 2;
  const maxAmp = h * 0.44;
  const soft = h * 0.06;

  for (let x = 0; x < w; x++) {
    // The modulo IS the loop. Two identical halves, so a pan of half the image
    // width lands on the same picture it left.
    const a = env[x % env.length];
    const half = Math.max(1.2, a * maxAmp);
    for (let y = 0; y < h; y++) {
      const d = Math.abs(y - mid);
      let inside = 1 - Math.max(0, Math.min(1, (d - half + soft) / soft));
      inside = inside * inside * (3 - 2 * inside);
      // A faint baseline, so a quiet stretch still reads as a track rather than
      // as blank paper. Dead air is part of the picture, not an absence of it.
      const base = Math.exp(-(d * d) / (2 * 2.2 * 2.2)) * 0.3;
      grey[y * w + x] = Math.round(255 * (1 - 0.94 * Math.max(inside, base)));
    }
  }
  return grey;
}

/* ---------- two more base images, both on the same loop ---------- */

/**
 * A spectrogram of the same speech: time across, frequency up, energy as ink.
 *
 * The waveform is one dimension of a recording; this is two, so it gives a screen
 * something a flat envelope cannot — tonal structure in BOTH axes. Dithering and
 * the image filters read that as a picture; against the waveform they mostly read
 * as a silhouette.
 *
 * Periodic in x by the same construction as everything else here: one period is
 * drawn and repeated twice, so a pan of half the image lands on identical pixels.
 */
function loopSpectrogram(w, h, seed) {
  const grey = new Uint8Array(w * h);
  const m = Math.round(w / 2);
  const env = loopEnvelope(m, seed);

  for (let x = 0; x < w; x++) {
    const i = x % m;
    const t = i / m;
    const loud = env[i];
    for (let y = 0; y < h; y++) {
      // Low frequencies at the bottom, as a spectrogram is drawn.
      const f = 1 - y / (h - 1);

      // Voice sits low and rolls off; the roll-off is what stops this reading as
      // a rectangle of noise. Gentle, so the field still reaches the top of the
      // frame — the first version rolled off at 3.1 and left the upper two thirds
      // blank, which screened to almost nothing.
      const tilt = Math.exp(-f * 1.5);

      // Four formants spread across most of the height, drifting slowly. Integer
      // cycle counts keep the loop.
      let bands = 0;
      for (let k = 0; k < 4; k++) {
        const centre = 0.1 + 0.22 * k + 0.06 * Math.sin(2 * Math.PI * (k + 1) * t);
        const width = 0.055 + 0.025 * k;
        const d = (f - centre) / width;
        bands += Math.exp(-d * d) * (1 - 0.16 * k);
      }

      const grit = loopNoise(t * (1 + k0(y)), 191, seed + y * 7) * 0.35;
      let e = loud * (0.66 * bands + 0.44 * tilt) * (0.82 + grit);
      // Curve it so the field has blacks and whites rather than a wash of mid
      // greys. A screen of nothing but midtones is a texture swatch, not a
      // picture — the same lesson the hero frames taught.
      e = Math.max(0, Math.min(1, e * 1.35));
      e = e * e * (3 - 2 * e);
      grey[y * w + x] = Math.round(255 * (1 - 0.95 * e));
    }
  }
  return grey;
}

/** Tiny helper so each spectrogram row samples its noise on a different phase. */
function k0(y) {
  return (y % 7) * 0.13;
}

/**
 * The timeline: clips laid end to end with the cuts between them.
 *
 * The most literal picture of the product in the set — a strip of kept takes with
 * the removed dead air showing as gaps. Blocky and orthogonal, which is the house
 * grammar, and it screens into hard-edged bands rather than clouds.
 *
 * Clip boundaries come from the SAME envelope as the waveform: a cut lands where
 * the signal is quiet. The picture is therefore consistent with the other two
 * rather than being a decoration that happens to look related.
 */
function loopTimeline(w, h, seed) {
  const grey = new Uint8Array(w * h).fill(255);
  const m = Math.round(w / 2);
  const env = loopEnvelope(m, seed);

  // Quiet runs long enough to be dead air, found the same way an editor would.
  const quiet = new Uint8Array(m);
  for (let i = 0; i < m; i++) quiet[i] = env[i] < 0.19 ? 1 : 0;

  const laneTop = Math.round(h * 0.16);
  const laneBottom = Math.round(h * 0.84);
  const rule = Math.max(1, Math.round(h * 0.012));

  for (let x = 0; x < w; x++) {
    const i = x % m;
    // Ink where a clip is kept, paper where it was cut.
    const kept = !quiet[i];
    for (let y = 0; y < h; y++) {
      let v = 255;
      if (kept && y >= laneTop && y <= laneBottom) {
        // A lighter core inside each clip so the band is not a solid slab: the
        // screen needs a tone to grade, or every clip prints as one flat block.
        // Lifted from 0.06 to 0.24 after the first pass measured mean 166 — that
        // much ink in the source screens into a field too dark to knock type out
        // of, which is r2's rejected failure arriving by a different route.
        const centre = 1 - Math.abs(y - (laneTop + laneBottom) / 2) / ((laneBottom - laneTop) / 2);
        v = Math.round(255 * (0.24 + 0.46 * centre * centre));
      }
      // The baseline the clips sit on stays visible through the gaps.
      if (Math.abs(y - Math.round(h / 2)) < rule) v = Math.min(v, 150);
      grey[y * w + x] = v;
    }
  }
  return grey;
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

// Aspect 8 — see the note above; the ratio is what lets the pan stay inside the
// image at every hero shape. Small on purpose: the screen samples one texel per
// dot cell, so a 2400px source is already far more than a 60-cell screen can use,
// and every extra pixel is bytes a visitor downloads for the shader to discard.
const WAVE = { w: 2400, h: 300, seed: 7 };

let changed = 0;

{
  const bases = [
    ["base-wave", loopWave(WAVE.w, WAVE.h, WAVE.seed)],
    ["base-spectrogram", loopSpectrogram(WAVE.w, WAVE.h, WAVE.seed)],
    ["base-timeline", loopTimeline(WAVE.w, WAVE.h, WAVE.seed)],
  ];
  for (const [name, grey] of bases) {
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
