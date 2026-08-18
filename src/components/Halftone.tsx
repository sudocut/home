"use client";

import { useEffect, useRef } from "react";

/**
 * A halftone screen — constitution D7.
 *
 * Screens a source image into ink dots on paper, using `halftone-dots` from the
 * vendored paper-shaders build. It is a FOREGROUND object: a panel, a band, a
 * tile. It never becomes the page's background field — the sheet underneath
 * stays warm paper, the D6 texture and the 76px grid, and this sits on top.
 *
 * WHY THIS ONE SHADER AND NOT THE OTHERS
 * `halftone-cmyk` is banned and stays banned; its `u_colorC/M/Y/K` are four inks
 * outside the closed palette. `halftone-dots` has exactly TWO colour slots, so it
 * runs entirely on --sc-content and --sc-surface and is inside the palette by
 * construction. That difference is the whole argument, and it is why this
 * component takes no colour props: there is nothing to choose.
 *
 * WHY THE PROP IS A PITCH IN PIXELS AND NOT `u_size`
 * `u_size` is a dot COUNT across the image box, so the same value is a different
 * design in a different sized box — measured, u_size 0.6 puts coverage 0.359 in
 * an 880px plate and 0.541 in a 176px tile, which is a photograph in one and a
 * mud slick in the other. Cell pitch in CSS pixels is the invariant: at a matched
 * 8px pitch those same two boxes measured 0.394 and 0.398. So the caller says how big
 * a dot should be, this derives `u_size` from the element's real height, and a
 * screen looks like itself wherever it is put. See CONSTITUTION.md D7.
 *
 * SETTINGS ARE MEASURED, NOT CHOSEN — `node tools/halftone-probe.mjs`. Four of
 * them are load-bearing and none is obvious:
 *
 *   u_inverted: false   The probe's first run scored fidelity −0.97 on every
 *                       setting: a perfect reproduction, upside down. A dot's
 *                       radius grows as luminance FALLS, so `inverted` is the
 *                       switch that gives you a negative, not a positive.
 *   u_radius: 1.0       1.3 measured coverage 0.544 — the dots merge and the
 *                       panel is a solid ink block on a warm sheet, which is the
 *                       exact object the founder rejected in r2.
 *   u_type: 0           `soft` (0.526), `gooey` (0.538) and `holes` (0.554) all
 *                       flood at radius 1.
 *   u_grainOverlay: 0   Measured identical fidelity with it on, and it mixes the
 *                       output toward pure black and pure white — neither token.
 *
 * FALLBACK. WebGL cannot run during SSR, and may not run at all. If it does not,
 * this renders an empty host and whatever the caller styled around it — a
 * bordered panel of warm paper — is the design. That is the D6 stance applied
 * again: a page with no shader is the page that shipped in r3, so it is a valid
 * rendering rather than a broken one. It is not a picture of a missing picture.
 */

/**
 * Cell pitch in CSS pixels, D7's permitted band.
 *
 * Below 6 the dots stop being dots: `getCircle` antialiases with `fwidth`, a
 * screen-space derivative, so the soft edge is a fixed number of pixels wide
 * however small the cell gets. Measured, grain collapses from 37.7 at a 6px pitch
 * to 2.8 at 4px — the same ink, spread into flat tone.
 */
const PITCH_MIN = 6;
const PITCH_MAX = 32;

/**
 * And the picture needs enough cells to survive being made of them. At 4 cells
 * down the box fidelity measured 0.803 — ink on the page, picture gone. 8 is the
 * floor; the same tile measured 0.979 at 8 cells.
 */
const CELLS_MIN = 8;

/** The shader's own limits: `cellsPerSide = mix(300, 7, size^0.7)`, halved for `classic`. */
const CELLS_MAX = 150;

/**
 * Invert the shader's mapping: what `u_size` puts a cell of `pitch` CSS px down
 * a box `height` px tall? Returns null when the box is too short to hold a
 * legible screen at any setting, so the caller can leave the panel unscreened
 * rather than draw something wrong.
 */
function sizeForPitch(pitch: number, height: number): number | null {
  if (!(height > 0)) return null;
  const cells = Math.min(CELLS_MAX, Math.max(CELLS_MIN, height / pitch));
  const x = (300 - 2 * cells) / 293;
  if (!(x > 0 && x <= 1)) return null;
  return x ** (1 / 0.7);
}

export type HalftoneProps = {
  /** Source image under /public. Trust-band fallback frames live in /frames. */
  src: string;
  /** Dot pitch in CSS pixels, 6–32. Clamped to the D7 band. */
  pitch?: number;
  /** Square (default) or hex screen. Both measure the same; hex reads softer. */
  grid?: "square" | "hex";
  className?: string;
};

export function Halftone({ src, pitch = 12, grid = "square", className }: HalftoneProps) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    const clamped = Math.min(PITCH_MAX, Math.max(PITCH_MIN, pitch));
    // Typed against the vendored ShaderMount rather than a hand-written shape:
    // its setUniforms takes an indexed ShaderMountUniforms, which a bare `object`
    // is not assignable to.
    type Mount = InstanceType<
      typeof import("../../design/vendor/paper-shaders/shader-mount.js").ShaderMount
    >;
    let mount: Mount | undefined;
    let observer: ResizeObserver | undefined;
    let cancelled = false;

    (async () => {
      try {
        const [{ ShaderMount }, { halftoneDotsFragmentShader }, colorMod, noiseMod] =
          await Promise.all([
            import("../../design/vendor/paper-shaders/shader-mount.js"),
            import("../../design/vendor/paper-shaders/shaders/halftone-dots.js"),
            import("../../design/vendor/paper-shaders/get-shader-color-from-string.js"),
            import("../../design/vendor/paper-shaders/get-shader-noise-texture.js"),
          ]);
        if (cancelled) return;

        // Colours come from the tokens, never from a literal here.
        const css = getComputedStyle(document.documentElement);
        const token = (name: string) => css.getPropertyValue(name).trim();

        // Required, and for the same reason D6's paper texture needs it: without a
        // decoded HTMLImageElement, ShaderMount never sets u_imageAspectRatio
        // (shader-mount.js:102, :250) and the screen has nothing to screen.
        const image = new Image();
        // Same-origin by design. The trust band's normal profile images bypass
        // this shader; this path is for local fallback frames, not remote media.
        image.crossOrigin = "anonymous";
        image.src = src;
        await image.decode();
        if (cancelled) return;

        const noise = noiseMod.getShaderNoiseTexture();
        if (!noise) return;
        // ShaderMount throws if the noise image has not decoded before mount.
        await noise.decode();
        if (cancelled) return;

        const uniforms = {
          u_colorFront: colorMod.getShaderColorFromString(token("--sc-content")),
          u_colorBack: colorMod.getShaderColorFromString(token("--sc-surface")),
          u_size: sizeForPitch(clamped, el.getBoundingClientRect().height) ?? 0.5,
          u_grid: grid === "hex" ? 1 : 0,
          u_type: 0,
          u_radius: 1,
          u_contrast: 0.5,
          u_originalColors: false,
          u_inverted: false,
          u_grainMixer: 0,
          u_grainOverlay: 0,
          u_grainSize: 0.5,
          u_image: image,
          u_noiseTexture: noise,
          u_scale: 1,
          u_rotation: 0,
          u_offsetX: 0,
          u_offsetY: 0,
          u_originX: 0.5,
          u_originY: 0.5,
          u_worldWidth: 0,
          u_worldHeight: 0,
          u_fit: 2, // cover — a screen is a crop of the frame, never a letterbox
        };

        // speed 0, frame 0 — static, so prefers-reduced-motion has nothing to
        // switch off here. O4: the brand never dissolves.
        mount = new ShaderMount(el, halftoneDotsFragmentShader, uniforms, undefined, 0, 0);

        // The panel is fluid — a hero plate is 480px tall on a laptop and 200px on
        // a phone — and u_size is a cell COUNT, so a value fixed at mount would
        // silently become a different design at every breakpoint. Recompute it
        // from the box we actually got.
        let last = 0;
        observer = new ResizeObserver(([entry]) => {
          const h = entry?.contentRect.height ?? 0;
          const next = sizeForPitch(clamped, h);
          if (next === null || Math.abs(next - last) < 0.002) return;
          last = next;
          mount?.setUniforms({ u_size: next });
        });
        observer.observe(el);
      } catch {
        // An unscreened panel of warm paper is a valid rendering of this design.
      }
    })();

    return () => {
      cancelled = true;
      observer?.disconnect();
      mount?.dispose();
    };
  }, [src, pitch, grid]);

  return <div aria-hidden="true" className={className} ref={host} />;
}
