"use client";

import { type ReactNode, useEffect, useRef } from "react";

/**
 * The halftone stage — constitution D7 (the screen) and D9 (it moves).
 *
 * A full-bleed screened field with the page's content knocked out on top. The
 * screen pans continuously across a waveform, forever, with no seam.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * `u_time` IS DEAD IN THIS SHADER. DO NOT ANIMATE WITH `speed`.
 *
 * `halftone-dots` declares `uniform float u_time` and never reads it in `main()`.
 * Proved, not assumed: at `speed: 1`, frames 0 / 2000 / 8000 render
 * BYTE-IDENTICAL, while changing `u_size` from 0.50 to 0.55 changes the output —
 * so the harness can see a difference and there is none to see. Setting a speed
 * would spin a requestAnimationFrame loop forever, on every visitor's battery,
 * and render the same picture every frame.
 *
 * This is the third dead uniform in this library: D6's `u_image` (the paper fibre
 * rendered nothing without it) and D7's `u_inverted` (it means the opposite of
 * what it reads like). Assume nothing here works until it is measured.
 *
 * So the pan drives `u_offsetX`, which the vertex shader does read, from our own
 * loop, and `ShaderMount` stays at `speed 0`. `setUniforms` calls `render()`
 * synchronously, so one write is one frame.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * HOW THE LOOP IS SEAMLESS, AND WHY THE FIX IS NOT IN THIS FILE
 *
 * Founder, 2026-08-18: *"it is not connected from start to the end so user can
 * feel that it's disconnected."* Correct, and the cause was the picture rather
 * than the motion. The old waveform was a one-off stretch of signal, so reaching
 * its end meant jumping back to a different-looking start. No easing hides that;
 * the previous version used a hard reset and the founder saw it immediately.
 *
 * `public/frames/base-wave.png` now repeats **exactly twice across its width** —
 * built from basis functions with whole numbers of cycles, so the two halves are
 * byte-identical (verified: mean absolute difference 0.0000). The pan sweeps a
 * range of exactly half the image and subtracts half when it wraps, landing on
 * identical content. There is no seam to see. That is a true infinite loop rather
 * than a long one.
 *
 * The geometry has to hold for that to work. `u_fit: cover` shows a window whose
 * width, as a fraction of the image, is `boxAspect / imageAspect`. The pan is
 * ±PERIOD/2, so the window has to fit in what is left:
 *
 *     boxAspect / 8 + PERIOD <= 1      →      boxAspect <= 4
 *
 * True of every hero shape this site produces. Narrow the source's aspect ratio
 * or widen the pan and a short, wide hero walks off the edge of the image, where
 * `getUvFrame` blanks it to nothing.
 */

/* ---------- the band, from D7's measurements ---------- */

const PITCH_MIN = 6;
const PITCH_MAX = 32;
const CELLS_MIN = 8;
const CELLS_MAX = 150;

/** Image widths the pan covers before wrapping. MUST equal the source's period. */
const PERIOD = 0.5;
/** Image widths per second. One full loop is PERIOD / SPEED = 25s. */
const SPEED = 0.02;

/**
 * `u_size` is a dot COUNT across the image box, so the same value is a different
 * design in a different sized panel — measured, 0.6 puts coverage 0.359 in an
 * 880px plate and 0.541, a flooded mud slick, in a 176px tile. Cell pitch in CSS
 * pixels is the invariant, so the caller says how big a dot should be and this
 * derives `u_size` from the element's real height. See CONSTITUTION.md D7.
 */
function sizeForPitch(pitch: number, height: number): number | null {
  if (!(height > 0)) return null;
  const cells = Math.min(CELLS_MAX, Math.max(CELLS_MIN, height / pitch));
  const x = (300 - 2 * cells) / 293;
  if (!(x > 0 && x <= 1)) return null;
  return x ** (1 / 0.7);
}

export type ScreenStageProps = {
  /** The looping waveform. See tools/make-frames.mjs for why it is periodic. */
  src: string;
  /** Dot pitch in CSS px, 6–32. Clamped to D7's band. */
  pitch?: number;
  children: ReactNode;
};

export function ScreenStage({ src, pitch = 22, children }: ScreenStageProps) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    type Mount = InstanceType<
      typeof import("../../design/vendor/paper-shaders/shader-mount.js").ShaderMount
    >;
    let mount: Mount | undefined;
    let raf = 0;
    let observer: ResizeObserver | undefined;
    let cancelled = false;

    const clamped = Math.min(PITCH_MAX, Math.max(PITCH_MIN, pitch));

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

        const image = new Image();
        // Same-origin today. Stated anyway: the shader uploads this to a texture,
        // and a cross-origin source without CORS headers fails the upload rather
        // than degrading.
        image.crossOrigin = "anonymous";
        image.src = src;
        await image.decode();
        if (cancelled) return;

        const noise = noiseMod.getShaderNoiseTexture();
        if (!noise) return;
        // ShaderMount throws if the noise image has not decoded before mount.
        await noise.decode();
        if (cancelled) return;

        const boxHeight = () => el.getBoundingClientRect().height;

        mount = new ShaderMount(
          el,
          halftoneDotsFragmentShader,
          {
            u_colorFront: colorMod.getShaderColorFromString(token("--sc-content")),
            u_colorBack: colorMod.getShaderColorFromString(token("--sc-surface")),
            u_size: sizeForPitch(clamped, boxHeight()) ?? 0.6,
            u_grid: 0,
            u_type: 0, // classic. soft, gooey and holes all flood at radius 1.
            u_radius: 1, // 1.3 measured coverage 0.544 — a solid ink block.
            u_contrast: 0.5,
            u_originalColors: false,
            u_inverted: false, // MEASURED. true reverses the tone.
            u_grainMixer: 0,
            u_grainOverlay: 0, // paints pure black and white, which is neither token
            u_grainSize: 0.5,
            u_image: image,
            u_noiseTexture: noise,
            // 1, not a zoom. The source is aspect 8, so it supplies its own
            // horizontal margin to pan through; zooming in would crop the
            // waveform's height for no gain.
            u_scale: 1,
            u_rotation: 0,
            u_offsetX: 0,
            u_offsetY: 0,
            u_originX: 0.5,
            u_originY: 0.5,
            u_worldWidth: 0,
            u_worldHeight: 0,
            u_fit: 2, // cover — a screen is a crop of the frame, never a letterbox
          },
          undefined,
          0, // speed 0 — u_time is dead, see the note at the top of this file
          0,
        );

        /**
         * A deterministic clock, for previews and probes only.
         *
         * Headless Chrome's `--virtual-time-budget` advances timers but fires
         * `requestAnimationFrame` exactly ONCE — measured, one frame per virtual
         * second — so a screenshot can never catch a moving screen, and every
         * preview would be frame zero, indistinguishable from a page that does
         * not move.
         *
         * It is also the only way to PROVE the loop is seamless: frames at `t`
         * and `t + PERIOD/SPEED` must be byte-identical, which is a test rather
         * than an opinion. Nothing else reads the parameter.
         */
        const pinned = Number(new URLSearchParams(window.location.search).get("sc-frame"));
        const isPinned = Number.isFinite(pinned) && window.location.search.includes("sc-frame");

        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

        // Infinity, NOT NaN. Every comparison against NaN is false, so a NaN
        // sentinel makes the "has this changed?" gate answer no forever and the
        // uniform is never written once — an animation that silently does not
        // animate. It shipped that way for one commit, and three pinned frames
        // came back byte-identical on a screen that was rendering perfectly.
        let lastSize = Number.POSITIVE_INFINITY;
        let lastOffset = Number.POSITIVE_INFINITY;
        let lastTick = 0;
        const t0 = performance.now();

        // ~30fps, not 60. `setUniforms` re-renders synchronously, so every tick
        // is a full WebGL draw of a full-bleed canvas, and a pan this slow has no
        // use for the other thirty frames a second.
        const MIN_MS = 1000 / 30;

        const frame = (now: number) => {
          if (!isPinned) {
            raf = requestAnimationFrame(frame);
            if (now - lastTick < MIN_MS) return;
            lastTick = now;
          }

          // Reduced motion stops the loop dead rather than slowing it, holding a
          // complete frame. Watched live, so changing the setting is respected
          // without a reload. `document.hidden` stops it too: at speed 0 the
          // vendor's own visibility pause never fires, so this is ours to do.
          const still = !isPinned && (reduce.matches || document.hidden);
          const t = isPinned ? pinned : still ? 0 : (now - t0) / 1000;

          const next: Record<string, number> = {};

          const size = sizeForPitch(clamped, boxHeight());
          if (size !== null && Math.abs(size - lastSize) > 0.0015) {
            next.u_size = size;
            lastSize = size;
          }

          // The wrap is the whole trick: subtracting PERIOD lands on identical
          // content, because the source repeats exactly twice across its width.
          const offset = still ? 0 : ((t * SPEED) % PERIOD) - PERIOD / 2;
          if (Math.abs(offset - lastOffset) > 0.0002) {
            next.u_offsetX = offset;
            lastOffset = offset;
          }

          if (Object.keys(next).length) mount?.setUniforms(next);
        };

        if (isPinned) frame(performance.now());
        else raf = requestAnimationFrame(frame);

        // The box is fluid and u_size is a cell COUNT, so a value fixed at mount
        // would quietly become a different design at every breakpoint.
        observer = new ResizeObserver(() => {
          lastSize = Number.POSITIVE_INFINITY;
        });
        observer.observe(el);
      } catch {
        // An unscreened field of warm paper is a valid rendering of this design.
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      observer?.disconnect();
      mount?.dispose();
    };
  }, [src, pitch]);

  return (
    <div className="sc-stage">
      <div aria-hidden="true" className="sc-stage-art" ref={host} />
      <div className="sc-wrap sc-stage-body">{children}</div>
    </div>
  );
}
