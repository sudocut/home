/**
 * pixels.mjs — read a PNG and measure what it actually looks like.
 *
 * Extracted verbatim from tools/shader-probe.mjs when tools/halftone-probe.mjs
 * needed the same two things. There is one copy because a second transcription of
 * "how we measure a shader" is a second place for the numbers in CONSTITUTION.md
 * to drift from each other, and those numbers are the only reason D6 and D7 are
 * trustworthy at all.
 *
 * No dependencies: Chrome writes the PNG, node:zlib inflates it.
 */

import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";

/**
 * Decode an 8-bit non-interlaced PNG to {w, h, lum:Float64Array}.
 * Chrome writes colour type 2 (RGB) or 6 (RGBA); both are handled.
 */
export function readPngLuminance(file) {
  const buf = readFileSync(file);
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error(`${file}: not a PNG`);

  let pos = 8;
  let w = 0;
  let h = 0;
  let depth = 0;
  let colorType = 0;
  const idat = [];

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      depth = data[8];
      colorType = data[9];
      if (data[12] !== 0) throw new Error("interlaced PNG not supported");
    } else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  if (depth !== 8) throw new Error(`bit depth ${depth} not supported`);
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : 0;
  if (!channels) throw new Error(`colour type ${colorType} not supported`);

  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * channels;
  const out = Buffer.allocUnsafe(h * stride);

  // Undo the per-scanline filters. Each row is prefixed by one filter-type byte.
  for (let y = 0; y < h; y++) {
    const ft = raw[y * (stride + 1)];
    const src = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prior = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? cur[i - channels] : 0;
      const b = prior ? prior[i] : 0;
      const c = prior && i >= channels ? prior[i - channels] : 0;
      let v = src[i];
      if (ft === 1) v += a;
      else if (ft === 2) v += b;
      else if (ft === 3) v += (a + b) >> 1;
      else if (ft === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[i] = v & 0xff;
    }
  }

  const lum = new Float64Array(w * h);
  for (let i = 0, p = 0; i < w * h; i++, p += channels) {
    // Rec. 709 luma — the texture is near-neutral, but weighting correctly keeps
    // the warm paper from reading as darker than it looks.
    lum[i] =
      channels === 1
        ? out[p]
        : 0.2126 * out[p] + 0.7152 * out[p + 1] + 0.0722 * out[p + 2];
  }
  return { w, h, lum };
}

/**
 * Mean luminance, plus two independent measures of visible structure:
 *
 *   grain   mean |difference| between horizontally adjacent pixels — catches fine
 *           fibre, the thing that actually reads as paper stock.
 *   mottle  mean per-tile standard deviation over 8x8 tiles — catches slower
 *           cloudiness that `grain` under-reports because neighbouring pixels in a
 *           soft blotch are nearly equal. A texture can be visible via either.
 */
export function measure({ w, h, lum }) {
  let sum = 0;
  for (let i = 0; i < lum.length; i++) sum += lum[i];
  const mean = sum / lum.length;

  let dsum = 0;
  let n = 0;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 1; x < w; x++) {
      dsum += Math.abs(lum[row + x] - lum[row + x - 1]);
      n++;
    }
  }

  const T = 8;
  let sdSum = 0;
  let tiles = 0;
  for (let ty = 0; ty + T <= h; ty += T) {
    for (let tx = 0; tx + T <= w; tx += T) {
      let s = 0;
      let ss = 0;
      for (let y = ty; y < ty + T; y++) {
        for (let x = tx; x < tx + T; x++) {
          const v = lum[y * w + x];
          s += v;
          ss += v * v;
        }
      }
      const k = T * T;
      sdSum += Math.sqrt(Math.max(0, ss / k - (s / k) ** 2));
      tiles++;
    }
  }
  return { mean, grain: dsum / n, mottle: sdSum / tiles };
}

/**
 * Fraction of the frame that is ink rather than paper, and how bimodal the
 * result is.
 *
 * This is the measurement `measure()` cannot make, and the one a halftone needs.
 * A halftone is not a texture, it is a REPRODUCTION: the question is not "can you
 * see grain" but "does the picture survive being reduced to dots, and how much of
 * the sheet did the dots eat". Two failure modes, and D7's settings clear both:
 *
 *   FLOODED   coverage climbs toward 1 — the dots merge and the panel becomes a
 *             solid ink block. That is r2's rejected failure wearing a new hat.
 *   WASHED    coverage falls toward 0 — the dots are too small to read as an
 *             image and the panel is just speckled paper.
 *
 * `split` is the midpoint between the ink and paper tokens' luminance, so a pixel
 * is classified against the two colours actually in play rather than against 128.
 */
/**
 * The top-left w x h of an image, as a new {w,h,lum}.
 *
 * The halftone probe needs this because Chrome will not make a window smaller
 * than its minimum: to measure a 176px-wide screen you size the ELEMENT, leave
 * the window comfortable, and crop to the element afterwards. Screenshotting a
 * clamped window and believing the requested size produced a whole table of
 * confident, wrong numbers before this existed.
 */
export function crop({ w, h, lum }, cw, ch) {
  const W = Math.min(w, Math.round(cw));
  const H = Math.min(h, Math.round(ch));
  const out = new Float64Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) out[y * W + x] = lum[y * w + x];
  }
  return { w: W, h: H, lum: out };
}

export function coverage({ lum }, split) {
  let ink = 0;
  for (let i = 0; i < lum.length; i++) if (lum[i] < split) ink++;
  return ink / lum.length;
}
