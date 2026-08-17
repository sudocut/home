"use client";

import { type ReactNode, useEffect, useRef } from "react";

/**
 * The screen — constitution D7 (a screen is permitted), D9 (it moves), D11 (which
 * shader, and why it is no longer `halftone-dots` by default).
 *
 * A full-bleed two-colour field with the page's content knocked out on top.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THREE SHADERS, THREE DIFFERENT ANIMATION STORIES. THIS IS NOT A DETAIL.
 *
 *   image-dithering   `u_time` DEAD. Pans `u_offsetX` from our own loop.
 *   halftone-dots     `u_time` DEAD. Same.
 *   dithering         `u_time` WORKS. Native `speed`, no loop of ours at all.
 *
 * Every one of those was measured, not read. `halftone-dots` declares `u_time`
 * and never reads it: at `speed: 1` frames 0 / 2000 / 8000 are byte-identical
 * while a `u_size` change is not. `dithering` moved 71.2 mean-absolute-difference
 * over nine seconds at the same test. Same library, same uniform name, opposite
 * behaviour — so a shader's animation has to be demonstrated before it is used,
 * every time. `tools/shader-survey.mjs` does it for the whole catalogue.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * WHY THE PAN IS SEAMLESS
 * Founder, on the previous version: *"it is not connected from start to the end
 * so user can feel that it's disconnected."* The defect was the picture, not the
 * motion. Every base image in `public/frames/base-*.png` now repeats EXACTLY
 * TWICE across its width — built from basis functions with whole numbers of
 * cycles, verified at mean absolute difference 0.0000 between halves. The pan
 * sweeps exactly half the image and subtracts half at the wrap, landing on
 * identical content.
 *
 * The geometry is load-bearing. `u_fit: cover` shows a window of
 * `boxAspect / imageAspect`, and the pan needs the rest, so at aspect 8:
 * `boxAspect / 8 + 0.5 <= 1` → `boxAspect <= 4`. True of every hero here.
 * Narrow the sources or widen the pan and a short, wide hero walks off the edge
 * of the image, where the shader's frame term blanks it.
 */

/** Image widths the pan covers before wrapping. MUST equal the sources' period. */
const PERIOD = 0.5;
/** Image widths per second. One loop is PERIOD / SPEED = 25s. */
const SPEED = 0.02;

/** D7's band, for the one shader still specified in dot pitch. */
const CELLS_MIN = 8;
const CELLS_MAX = 150;

/** `halftone-dots` takes a dot COUNT; the honest unit is pitch in CSS px. See D7. */
function sizeForPitch(pitch: number, height: number): number | null {
  if (!(height > 0)) return null;
  const cells = Math.min(CELLS_MAX, Math.max(CELLS_MIN, height / pitch));
  const x = (300 - 2 * cells) / 293;
  if (!(x > 0 && x <= 1)) return null;
  return x ** (1 / 0.7);
}

export type Screen =
  /** Bayer-dithered reproduction of a base image. The r7 recommendation. */
  | { shader: "image-dithering"; src: string; px?: number; type?: 1 | 2 | 3 | 4 }
  /** Procedural dither field. The only candidate whose own `u_time` works. */
  | { shader: "dithering"; shape?: number; px?: number; scale?: number }
  /** A quiet geometric field, the same grammar as the 76px grid. Static. */
  | { shader: "dot-grid"; dotSize?: number; gap?: number; shape?: 0 | 1 | 2 | 3 }
  /** The r5/r6 incumbent, kept so the round has a control. */
  | { shader: "halftone-dots"; src: string; pitch?: number };

export type ScreenStageProps = { screen: Screen; children: ReactNode };

export function ScreenStage({ screen, children }: ScreenStageProps) {
  const host = useRef<HTMLDivElement>(null);
  // Serialised so the effect re-runs when a field changes, without the caller
  // having to hand us a memoised object.
  const key = JSON.stringify(screen);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    const spec: Screen = JSON.parse(key);
    type Mount = InstanceType<
      typeof import("../../design/vendor/paper-shaders/shader-mount.js").ShaderMount
    >;
    let mount: Mount | undefined;
    let raf = 0;
    let observer: ResizeObserver | undefined;
    let cancelled = false;

    (async () => {
      try {
        const [{ ShaderMount }, colorMod, noiseMod] = await Promise.all([
          import("../../design/vendor/paper-shaders/shader-mount.js"),
          import("../../design/vendor/paper-shaders/get-shader-color-from-string.js"),
          import("../../design/vendor/paper-shaders/get-shader-noise-texture.js"),
        ]);
        if (cancelled) return;

        // Colours come from the tokens, never from a literal here. Two of these
        // shaders have a third colour slot; both get ink or paper, so the screen
        // is inside the closed palette by construction rather than by restraint.
        const css = getComputedStyle(document.documentElement);
        const token = (n: string) => css.getPropertyValue(n).trim();
        const ink = colorMod.getShaderColorFromString(token("--sc-content"));
        const paper = colorMod.getShaderColorFromString(token("--sc-surface"));

        const noise = noiseMod.getShaderNoiseTexture();
        if (!noise) return;
        // ShaderMount throws if the noise image has not decoded before mount.
        await noise.decode();
        if (cancelled) return;

        const load = async (url: string) => {
          const img = new Image();
          // The shader uploads this to a texture; a cross-origin source without
          // CORS headers fails the upload rather than degrading.
          img.crossOrigin = "anonymous";
          img.src = url;
          await img.decode();
          return img;
        };

        const sizing = {
          u_noiseTexture: noise,
          u_scale: 1,
          u_rotation: 0,
          u_offsetX: 0,
          u_offsetY: 0,
          u_originX: 0.5,
          u_originY: 0.5,
          u_worldWidth: 0,
          u_worldHeight: 0,
          u_fit: 2, // cover — a screen is a crop, never a letterbox
        };

        let frag: string;
        // The vendored uniform type, not `unknown`: ShaderMount's setUniformValues
        // is indexed and will not accept a widened record.
        type Uniforms =
          import("../../design/vendor/paper-shaders/shader-mount.js").ShaderMountUniforms;
        let uniforms: Uniforms;
        // "pan" = we move it because the shader's own clock is dead.
        // "native" = the shader animates itself and we keep out of the way.
        let motion: "pan" | "native" | "still" = "still";

        if (spec.shader === "image-dithering") {
          const mod = await import("../../design/vendor/paper-shaders/shaders/image-dithering.js");
          frag = mod.imageDitheringFragmentShader;
          uniforms = {
            ...sizing,
            u_colorFront: ink,
            u_colorBack: paper,
            // The docs are explicit: highlight == front is classic two-colour
            // dithering. Anything else would invent a third ink.
            u_colorHighlight: ink,
            u_originalColors: false,
            // MEASURED, and it means the opposite of its name — exactly like
            // halftone-dots' `u_inverted`. False rendered an ink field with the
            // waveform reversed out of it, coverage 0.70: the page turned into
            // the dark rectangle r2 was rejected for.
            u_inverted: true,
            u_type: spec.type ?? 4, // 8x8 Bayer
            u_pxSize: spec.px ?? 3,
            u_image: await load(spec.src),
          };
          motion = "pan";
        } else if (spec.shader === "halftone-dots") {
          const mod = await import("../../design/vendor/paper-shaders/shaders/halftone-dots.js");
          frag = mod.halftoneDotsFragmentShader;
          uniforms = {
            ...sizing,
            u_colorFront: ink,
            u_colorBack: paper,
            u_size: sizeForPitch(spec.pitch ?? 22, el.getBoundingClientRect().height) ?? 0.6,
            u_grid: 0,
            u_type: 0, // classic. soft, gooey and holes all flood at radius 1.
            u_radius: 1, // 1.3 measured coverage 0.544 — a solid ink block.
            u_contrast: 0.5,
            u_originalColors: false,
            u_inverted: false,
            u_grainMixer: 0,
            u_grainOverlay: 0, // paints pure black and white, neither of them tokens
            u_grainSize: 0.5,
            u_image: await load(spec.src),
          };
          motion = "pan";
        } else if (spec.shader === "dithering") {
          const mod = await import("../../design/vendor/paper-shaders/shaders/dithering.js");
          frag = mod.ditheringFragmentShader;
          uniforms = {
            ...sizing,
            u_scale: spec.scale ?? 0.55,
            u_colorFront: ink,
            u_colorBack: paper,
            u_shape: spec.shape ?? 1, // simplex
            u_type: 4, // 8x8 Bayer
            u_pxSize: spec.px ?? 3,
          };
          motion = "native";
        } else {
          const mod = await import("../../design/vendor/paper-shaders/shaders/dot-grid.js");
          frag = mod.dotGridFragmentShader;
          uniforms = {
            ...sizing,
            u_colorBack: paper,
            u_colorFill: ink,
            u_colorStroke: ink,
            u_dotSize: spec.dotSize ?? 5,
            u_gapX: spec.gap ?? 24,
            u_gapY: spec.gap ?? 24,
            u_strokeWidth: 0,
            u_sizeRange: 0,
            u_opacityRange: 0,
            u_shape: spec.shape ?? 0,
          };
        }
        if (cancelled) return;

        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

        const raw = new URLSearchParams(window.location.search).get("sc-frame");
        const pinnedSeconds = Number(raw);
        const isPinned = raw !== null && Number.isFinite(pinnedSeconds);

        mount = new ShaderMount(
          el,
          frag,
          uniforms,
          undefined,
          // Pinned means one deterministic frame and then stop. That matters most
          // for the shader that animates ITSELF: left at speed 1 it never lets the
          // page go idle, so `--virtual-time-budget` keeps advancing and a headless
          // screenshot renders thousands of software frames before it gives up.
          // A preview run wedged for tens of minutes that way.
          motion === "native" && !reduce.matches && !isPinned ? 1 : 0,
          0,
        );

        /**
         * `sc-frame` is a deterministic clock for previews and probes only.
         *
         * Headless Chrome fires `requestAnimationFrame` exactly ONCE under
         * `--virtual-time-budget` — measured, one frame per virtual second — so a
         * screenshot can never catch a moving screen, and every preview would be
         * frame zero, indistinguishable from a page that does not move.
         *
         * It is also the only way to PROVE the pan is seamless: frames at `t` and
         * `t + PERIOD/SPEED` must be byte-identical. Nothing else reads it.
         */
        const pinned = pinnedSeconds;

        if (motion === "native") {
          // The shader runs its own clock, so all we owe it is the two stop
          // conditions. `document.hidden` is handled by ShaderMount at non-zero
          // speed; reduced motion is not, and is ours.
          const sync = () => mount?.setSpeed(reduce.matches ? 0 : 1);
          reduce.addEventListener("change", sync);
          if (isPinned) mount.setFrame(pinned * 1000);
          observer = new ResizeObserver(() => {});
          observer.observe(el);
          return;
        }

        if (motion === "still") return;

        // Infinity, NOT NaN. Every comparison against NaN is false, so a NaN
        // sentinel makes the "has this changed?" gate answer no forever and the
        // uniform is never written once — an animation that renders perfectly and
        // does not move. It shipped that way for one commit.
        let lastSize = Number.POSITIVE_INFINITY;
        let lastOffset = Number.POSITIVE_INFINITY;
        let lastTick = 0;
        const t0 = performance.now();
        // ~30fps. `setUniforms` re-renders synchronously, so every tick is a full
        // draw of a full-bleed canvas, and a pan this slow cannot use 60.
        const MIN_MS = 1000 / 30;

        const frame = (now: number) => {
          if (!isPinned) {
            raf = requestAnimationFrame(frame);
            if (now - lastTick < MIN_MS) return;
            lastTick = now;
          }
          // Reduced motion stops the loop dead rather than slowing it, holding a
          // complete frame; so does a hidden tab, which at speed 0 the vendor's
          // own visibility pause never covers.
          const still = !isPinned && (reduce.matches || document.hidden);
          const t = isPinned ? pinned : still ? 0 : (now - t0) / 1000;

          const next: Record<string, number> = {};

          if (spec.shader === "halftone-dots") {
            const size = sizeForPitch(spec.pitch ?? 22, el.getBoundingClientRect().height);
            if (size !== null && Math.abs(size - lastSize) > 0.0015) {
              next.u_size = size;
              lastSize = size;
            }
          }

          // The wrap is the whole trick: subtracting PERIOD lands on identical
          // content, because every base image repeats twice across its width.
          const offset = still ? 0 : ((t * SPEED) % PERIOD) - PERIOD / 2;
          if (Math.abs(offset - lastOffset) > 0.0002) {
            next.u_offsetX = offset;
            lastOffset = offset;
          }

          if (Object.keys(next).length) mount?.setUniforms(next);
        };

        if (isPinned) frame(performance.now());
        else raf = requestAnimationFrame(frame);

        // The box is fluid and halftone's u_size is a cell COUNT, so a value fixed
        // at mount would quietly become a different design at every breakpoint.
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
  }, [key]);

  return (
    <div className="sc-stage">
      <div aria-hidden="true" className="sc-stage-art" ref={host} />
      <div className="sc-wrap sc-stage-body">{children}</div>
    </div>
  );
}
