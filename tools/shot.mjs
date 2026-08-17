#!/usr/bin/env node
/**
 * shot.mjs — screenshot the running site.
 *
 *   pnpm dev &                                  # or: pnpm build && pnpm start
 *   node tools/shot.mjs out.png                 # /en at 1280x900
 *   node tools/shot.mjs out.png --path /ko
 *   node tools/shot.mjs out.png --narrow 390     # the 390px check, honestly
 *   node tools/shot.mjs out.png --full          # whole page, not one viewport
 *
 * WHY IT IS NOT `--screenshot` ON ITS OWN
 * ---------------------------------------
 * Chrome's `--screenshot` fires on load. The halftone and paper-texture canvases
 * mount in an effect, after hydration, after the source image decodes — so a
 * plain load-time shot reliably catches the page with both shaders missing. That
 * is not a hypothetical: it is exactly how r2 and r4 came to be ranked on pages
 * whose texture was not rendering, and the resulting verdicts decided nothing.
 *
 * `--virtual-time-budget` is what fixes it. Chrome fast-forwards its clock and
 * only then shoots, so timers, decodes and the first WebGL frame have all
 * happened. The budget is generous because being slow here costs seconds and
 * being fast here costs a wrong picture of the design.
 *
 * WebGL in headless needs `--enable-unsafe-swiftshader` — same flag, same reason,
 * as tools/shader-probe.mjs. "Unsafe" is about the software rasteriser's sandbox
 * posture, not about the output; it renders the same frame.
 *
 * WHY `--narrow` EXISTS
 * --------------------
 * Chrome will not make a window narrower than its minimum. `--window-size=390,780`
 * does not give you a 390px viewport — it gives you the minimum, lays the page out
 * at THAT width, and screenshots the left 390px of the result. The output looks
 * exactly like a broken responsive layout: clipped nav, headline running off the
 * edge. It is neither; it is a desktop render with most of it cropped away, and
 * it is the same trap that produced a whole table of confident wrong numbers in
 * tools/halftone-probe.mjs before that was found.
 *
 * `--narrow 390` puts the site in an iframe of exactly that CSS width inside a
 * comfortable window. The iframe gets a real 390px viewport, so media queries
 * fire correctly and the render is honest. The shot shows that column against a
 * neutral field rather than filling the frame — a preview of the phone layout,
 * not a picture of a phone.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const CHROME =
  process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const args = process.argv.slice(2);
const out = args.find((a) => !a.startsWith("--"));
if (!out) {
  console.error(
    "usage: node tools/shot.mjs <out.png> [--path /en] [--w 1280] [--h 900] [--full] [--narrow 390]",
  );
  process.exit(1);
}
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const port = flag("port", process.env.PORT ?? "3000");
const path = flag("path", "/en");
const narrow = Number(flag("narrow", 0));
const w = Number(flag("w", 1280));
const h = Number(flag("h", 900));
const full = args.includes("--full");
const budget = flag("budget", "9000");

if (!existsSync(CHROME)) {
  console.error(`error: Chrome not found at ${CHROME}\n       set CHROME=/path/to/chrome`);
  process.exit(1);
}

const file = resolve(out);
mkdirSync(dirname(file), { recursive: true });

const site = `http://localhost:${port}${path}`;
let target = site;
let wrapper;

if (narrow) {
  // file:// so the iframe is genuinely a separate document with its own viewport.
  // Nothing scripts across the boundary, so the origin difference costs nothing.
  wrapper = join(tmpdir(), `sc-narrow-${narrow}.html`);
  writeFileSync(
    wrapper,
    `<!doctype html><meta charset="utf-8"><title>narrow ${narrow}</title>
<style>
  html, body { margin: 0; background: #6f7679; }
  iframe { display: block; width: ${narrow}px; height: ${h}px; border: 0; margin: 0 auto; }
</style>
<iframe src="${site}"></iframe>`,
  );
  target = `file://${wrapper}`;
}

execFileSync(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--enable-unsafe-swiftshader",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    `--virtual-time-budget=${budget}`,
    // The wrapper needs a window wide enough to hold the column with a margin,
    // which is not the same as the column's own width.
    `--window-size=${narrow ? Math.max(w, narrow + 220) : w},${h}`,
    ...(full && !narrow ? ["--screenshot-full-page"] : []),
    `--screenshot=${file}`,
    target,
  ],
  { stdio: ["ignore", "ignore", "inherit"] },
);

if (wrapper) rmSync(wrapper, { force: true });

console.log(
  `${file}  ${narrow ? `${narrow}px column, ` : ""}${w}x${h}${full && !narrow ? " full page" : ""}  ${path}`,
);
