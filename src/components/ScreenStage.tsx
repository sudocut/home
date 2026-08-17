"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

/**
 * The halftone stage — constitution D7 (the screen), D9 (it moves), D10 (the
 * visitor can move it).
 *
 * A full-bleed screened field with the page's content knocked out on top, and a
 * small console that lets a visitor change the screen. It is one component rather
 * than three because the screen, the animation and the console all write to the
 * same place: the shader's uniforms. Splitting them would mean three owners of
 * one mutable object.
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
 * This is the third dead uniform in this library: D6's `u_image` (the paper
 * fibre rendered nothing without it) and D7's `u_inverted` (it means the
 * opposite of what it reads like). Assume nothing here works until it is
 * measured.
 *
 * So the animation drives the uniforms that ARE read — `u_offsetX/Y`, `u_size`,
 * `u_scale` — from our own loop, and `ShaderMount` stays at `speed 0`.
 * `setUniforms` calls `render()` synchronously, so one write is one frame.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * WHAT MOTION IS ALLOWED, AND WHY IT IS SHAPED LIKE THIS
 * O4 says transitions are hard cuts and the brand never dissolves. That is why
 * `playhead` pans and then RESETS rather than easing back, and why `cut` swaps
 * its source image on a frame boundary instead of crossfading. The motion is a
 * tape running, not a screensaver.
 *
 * `prefers-reduced-motion` stops the loop dead — not slows it — and the screen
 * holds its current frame, which is a complete, legible design. It is watched
 * live rather than read once, so a visitor who changes the setting is respected
 * without a reload.
 */

/* ---------- the band, from D7's measurements ---------- */

const PITCH_MIN = 6;
const PITCH_MAX = 32;
const CONTRAST_MIN = 0.25;
const CONTRAST_MAX = 0.8;
const CELLS_MIN = 8;
const CELLS_MAX = 150;

/**
 * Every control is clamped to a range that MEASURED inside D7's band, and that is
 * the whole reason a visitor is allowed to touch the shader at all. Pitch 4
 * measured grain 2.79 — flat tone, no dots. `u_radius` 1.3 measured coverage
 * 0.544 — a solid ink block. Contrast 0.8 measured 0.444 and is the last setting
 * before the midtones crush.
 *
 * So the console does not expose the failures. A visitor can make the page look
 * however they like inside the range where it still reads as SudoCut, and cannot
 * drag it outside the palette or off the legibility floor. That is the difference
 * between a toy and a control.
 */
function sizeForPitch(pitch: number, height: number): number | null {
  if (!(height > 0)) return null;
  const cells = Math.min(CELLS_MAX, Math.max(CELLS_MIN, height / pitch));
  const x = (300 - 2 * cells) / 293;
  if (!(x > 0 && x <= 1)) return null;
  return x ** (1 / 0.7);
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export type Motion = "playhead" | "cut" | "breathe" | "pointer" | "drift" | "still";
export type Control = "pitch" | "contrast" | "motion" | "grid" | "source";

export type ScreenStageProps = {
  /** Base image. The waveform lives at /frames/base-wave.png — see tools/make-frames.mjs. */
  src: string;
  /** The same signal with its dead air removed. Required by `cut`; offered by the `source` control. */
  altSrc?: string;
  motion?: Motion;
  /** Initial dot pitch in CSS px, 6–32. */
  pitch?: number;
  /** Which knobs the visitor gets. Order is preserved. */
  controls?: readonly Control[];
  /** Extra class on the console, so a variant can make it a footnote or a feature. */
  consoleClass?: string;
  /**
   * "stacked" puts the console under the content; "split" puts them side by side
   * in one grid.
   *
   * This is a prop rather than a stylesheet concern because the console and the
   * content are SIBLINGS, and CSS cannot put two siblings in a shared grid track
   * without a common parent. The first attempt tried anyway — absolute
   * positioning — and the console landed on top of the plate, covering the
   * headline and the one required action outright. A layout that can hide the
   * CTA is not a styling bug, it is the wrong element tree.
   */
  layout?: "stacked" | "split";
  children: ReactNode;
};

export function ScreenStage({
  src,
  altSrc,
  motion = "drift",
  pitch: initialPitch = 20,
  controls = ["pitch", "motion"],
  consoleClass = "",
  layout = "stacked",
  children,
}: ScreenStageProps) {
  // A client component under NextIntlClientProvider, so it reads its own labels
  // rather than taking eleven strings as props from six near-identical pages.
  const t = useTranslations("home.screen");
  const host = useRef<HTMLDivElement>(null);

  const [pitch, setPitch] = useState(initialPitch);
  const [contrast, setContrast] = useState(0.5);
  const [speed, setSpeed] = useState(motion === "still" ? 0 : 0.6);
  const [hex, setHex] = useState(false);
  const [cutSource, setCutSource] = useState(false);

  // The animation reads these every frame. Refs, not state: a RAF loop that
  // re-subscribed on every slider change would tear down and rebuild itself
  // sixty times a second while the visitor drags.
  const live = useRef({ pitch, contrast, speed, motion, cutSource });
  live.current = { pitch, contrast, speed, motion, cutSource };

  const reset = useCallback(() => {
    setPitch(initialPitch);
    setContrast(0.5);
    setSpeed(motion === "still" ? 0 : 0.6);
    setHex(false);
    setCutSource(false);
  }, [initialPitch, motion]);

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
    let images: HTMLImageElement[] = [];

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

        const css = getComputedStyle(document.documentElement);
        const token = (name: string) => css.getPropertyValue(name).trim();

        const load = async (url: string) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = url;
          await img.decode();
          return img;
        };
        // Both sources are decoded up front. Swapping to an undecoded image mid
        // animation drops a frame to blank, and the swap is supposed to be a cut,
        // not a flicker.
        images = await Promise.all([load(src), ...(altSrc ? [load(altSrc)] : [])]);
        if (cancelled) return;

        const noise = noiseMod.getShaderNoiseTexture();
        if (!noise) return;
        await noise.decode();
        if (cancelled) return;

        const boxHeight = () => el.getBoundingClientRect().height;
        // A little zoom so panning has somewhere to go. `u_fit: cover` leaves
        // margin on one axis only, so without this a horizontal pan would walk
        // straight off the edge of the image and `getUvFrame` would blank it.
        const SCALE = 1.3;

        mount = new ShaderMount(
          el,
          halftoneDotsFragmentShader,
          {
            u_colorFront: colorMod.getShaderColorFromString(token("--sc-content")),
            u_colorBack: colorMod.getShaderColorFromString(token("--sc-surface")),
            u_size: sizeForPitch(initialPitch, boxHeight()) ?? 0.6,
            u_grid: 0,
            u_type: 0,
            u_radius: 1,
            u_contrast: 0.5,
            u_originalColors: false,
            u_inverted: false,
            u_grainMixer: 0,
            u_grainOverlay: 0,
            u_grainSize: 0.5,
            u_image: images[0],
            u_noiseTexture: noise,
            u_scale: SCALE,
            u_rotation: 0,
            u_offsetX: 0,
            u_offsetY: 0,
            u_originX: 0.5,
            u_originY: 0.5,
            u_worldWidth: 0,
            u_worldHeight: 0,
            u_fit: 2,
          },
          undefined,
          0, // speed 0 — u_time is dead, see the note at the top of this file
          0,
        );

        /**
         * A deterministic clock, for previews and probes only.
         *
         * Headless Chrome's `--virtual-time-budget` advances timers and
         * `performance.now()` but fires `requestAnimationFrame` exactly ONCE —
         * measured: 1 frame across a 3000ms virtual second. So a screenshot can
         * never catch a moving screen, and every preview of every animated
         * variant would be frame zero, which is indistinguishable from a page
         * with no animation at all. That is precisely the failure D6 shipped
         * twice: a picture that looks fine and shows the wrong thing.
         *
         * With `?sc-frame=<seconds>` the loop is skipped and exactly one frame is
         * drawn at that time. It is a testing seam and nothing else reads it — no
         * state, no persistence, and on a normal visit the parameter is absent.
         */
        const pinned = Number(new URLSearchParams(window.location.search).get("sc-frame"));
        const isPinned = Number.isFinite(pinned) && window.location.search.includes("sc-frame");

        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
        const pointer = { x: 0, y: 0 };
        const onPointer = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          pointer.x = clamp((e.clientX - r.left) / r.width - 0.5, -0.5, 0.5);
          pointer.y = clamp((e.clientY - r.top) / r.height - 0.5, -0.5, 0.5);
        };
        if (motion === "pointer")
          window.addEventListener("pointermove", onPointer, { passive: true });

        // What was last written, so a frame that changes nothing costs nothing.
        let lastSize = -1;
        let lastShown = -1;
        // Infinity, NOT NaN. Every comparison against NaN is false, so a NaN
        // sentinel makes the "has this changed?" gate answer "no" forever and the
        // uniform is never written once — which is an animation that silently does
        // not animate. It shipped that way for one commit and the screenshot diff
        // caught it: three pinned frames, byte-identical, on a screen that was
        // rendering perfectly. Infinity differs from every real value exactly once.
        let lastOffX = Number.POSITIVE_INFINITY;
        let lastOffY = Number.POSITIVE_INFINITY;
        let lastContrast = Number.POSITIVE_INFINITY;
        let lastTick = 0;
        let t0 = performance.now();

        // ~30fps, not 60. `setUniforms` re-renders synchronously, so every tick is
        // a full WebGL draw of a full-bleed canvas — and none of this motion is
        // fast enough for the extra 30 frames to be visible. Measured the blunt
        // way: at 60fps a headless screenshot of this page took minutes to settle
        // because the software rasteriser never got a quiet moment. On a real GPU
        // it is not a hang, but "invisible and twice the power" is still a bad
        // trade on someone's laptop battery.
        const MIN_MS = 1000 / 30;

        const frame = (now: number) => {
          if (!isPinned) {
            raf = requestAnimationFrame(frame);
            if (now - lastTick < MIN_MS) return;
            lastTick = now;
          }
          const m = live.current;

          // Reduced motion freezes the animation but NOT the controls: a visitor
          // who does not want movement can still change the screen, and gets a
          // still frame at whatever they picked.
          const still = !isPinned && (reduce.matches || m.speed === 0 || document.hidden);
          const t = isPinned ? pinned : still ? 0 : ((now - t0) / 1000) * m.speed;

          const next: Record<string, number | HTMLImageElement> = {};

          // Dot pitch: the visitor's setting, with `breathe` swinging around it.
          const p =
            m.motion === "breathe" && !still
              ? m.pitch * (1.35 + 0.55 * Math.sin(t * 0.9))
              : m.pitch;
          const size = sizeForPitch(clamp(p, PITCH_MIN, PITCH_MAX * 1.6), boxHeight());
          if (size !== null && Math.abs(size - lastSize) > 0.0015) {
            next.u_size = size;
            lastSize = size;
          }

          if (Math.abs(m.contrast - lastContrast) > 0.001) {
            next.u_contrast = m.contrast;
            lastContrast = m.contrast;
          }

          // Offsets go through one gate so a still frame writes nothing at all
          // and the loop costs a comparison instead of a draw.
          const pan = (x: number, y: number) => {
            if (Math.abs(x - lastOffX) > 0.0005 || Math.abs(y - lastOffY) > 0.0005) {
              next.u_offsetX = x;
              next.u_offsetY = y;
              lastOffX = x;
              lastOffY = y;
            }
          };

          if (!still) {
            if (m.motion === "playhead") {
              // Pans one way, then HARD RESETS. O4: the brand never dissolves, so
              // the loop point is a cut, not an ease back.
              const span = 0.22;
              pan(-span + ((t * 0.06) % (span * 2)), 0);
            } else if (m.motion === "drift") {
              pan(0.1 * Math.sin(t * 0.25), 0.07 * Math.cos(t * 0.19));
            } else if (m.motion === "pointer") {
              pan(0.18 * pointer.x, 0.18 * pointer.y);
            } else if (m.motion === "cut" && images.length > 1) {
              // A hard cut on a beat: the recording, then the recording with its
              // dead air gone. The background is the product, not a pattern.
              const show = Math.floor(t / 2.6) % 2;
              const img = images[show];
              if (show !== lastShown && img) {
                next.u_image = img;
                lastShown = show;
              }
            }
          }

          // The `source` control overrides whatever `cut` was doing.
          if (m.motion !== "cut" && images.length > 1) {
            const want = m.cutSource ? 1 : 0;
            const img = images[want];
            if (want !== lastShown && img) {
              next.u_image = img;
              lastShown = want;
            }
          }

          if (Object.keys(next).length) mount?.setUniforms(next);
        };
        if (isPinned) frame(performance.now());
        else raf = requestAnimationFrame(frame);

        // The box is fluid and u_size is a cell COUNT, so a value fixed at mount
        // would quietly become a different design at every breakpoint.
        observer = new ResizeObserver(() => {
          t0 = performance.now();
          lastSize = -1;
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
    // `motion`, `src` and `altSrc` rebuild the mount; the sliders go through
    // `live` and deliberately do not.
  }, [src, altSrc, motion, initialPitch]);

  // Grid is the one uniform not driven by the loop — it changes rarely and
  // writing it every frame would be noise.
  useEffect(() => {
    const el = host.current as
      | (HTMLDivElement & { paperShaderMount?: { setUniforms: (u: object) => void } })
      | null;
    el?.paperShaderMount?.setUniforms({ u_grid: hex ? 1 : 0 });
  }, [hex]);

  const has = (c: Control) => controls.includes(c);

  const panel = (
    <fieldset className="sc-console">
      <legend className="sc-console-legend">{t("console")}</legend>

      {has("pitch") && (
        <label className="sc-ctl">
          <span className="sc-ctl-name">{t("pitch")}</span>
          <input
            max={PITCH_MAX}
            min={PITCH_MIN}
            onChange={(e) => setPitch(Number(e.target.value))}
            step={1}
            type="range"
            value={pitch}
          />
          <output className="sc-ctl-value">{pitch}px</output>
        </label>
      )}

      {has("contrast") && (
        <label className="sc-ctl">
          <span className="sc-ctl-name">{t("contrast")}</span>
          <input
            max={CONTRAST_MAX}
            min={CONTRAST_MIN}
            onChange={(e) => setContrast(Number(e.target.value))}
            step={0.05}
            type="range"
            value={contrast}
          />
          <output className="sc-ctl-value">{contrast.toFixed(2)}</output>
        </label>
      )}

      {has("motion") && (
        <label className="sc-ctl">
          <span className="sc-ctl-name">{t("motion")}</span>
          <input
            max={1.6}
            min={0}
            onChange={(e) => setSpeed(Number(e.target.value))}
            step={0.1}
            type="range"
            value={speed}
          />
          <output className="sc-ctl-value">{speed === 0 ? "off" : speed.toFixed(1)}</output>
        </label>
      )}

      {has("grid") && (
        <label className="sc-ctl sc-ctl--toggle">
          <span className="sc-ctl-name">{t("grid")}</span>
          <input checked={hex} onChange={(e) => setHex(e.target.checked)} type="checkbox" />
          <output className="sc-ctl-value">{hex ? "hex" : "square"}</output>
        </label>
      )}

      {has("source") && altSrc && (
        <label className="sc-ctl sc-ctl--toggle">
          <span className="sc-ctl-name">{t("source")}</span>
          <input
            checked={cutSource}
            onChange={(e) => setCutSource(e.target.checked)}
            type="checkbox"
          />
          <output className="sc-ctl-value">{cutSource ? t("sourceCut") : t("sourceRaw")}</output>
        </label>
      )}

      <button className="sc-ctl-reset" onClick={reset} type="button">
        {t("reset")}
      </button>

      <p className="sc-console-note">{t("note")}</p>
    </fieldset>
  );

  return (
    <div className="sc-stage">
      <div aria-hidden="true" className="sc-stage-art" ref={host} />

      {/* soul.md S7 — expose the criteria, never a black box. The same instinct
          that puts every cut on an editable timeline puts the screen's settings
          on the page instead of hiding them in a stylesheet. */}
      {layout === "split" ? (
        <div className="sc-wrap sc-stage-split">
          <div className="sc-stage-body">{children}</div>
          <div className={`sc-console-wrap ${consoleClass}`}>{panel}</div>
        </div>
      ) : (
        <>
          <div className="sc-wrap sc-stage-body">{children}</div>
          <div className={`sc-wrap sc-console-wrap ${consoleClass}`}>{panel}</div>
        </>
      )}
    </div>
  );
}
