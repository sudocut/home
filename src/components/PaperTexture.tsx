"use client";

import { useEffect, useRef } from "react";

/**
 * The 양피지 sheet the whole site sits on — constitution D6.
 *
 * Client-only and mounted lazily: WebGL cannot run during SSR, and the page must
 * be complete without it. If the context fails, the browser is old, or the user
 * has WebGL disabled, this renders nothing and the flat `--sc-surface` plus the
 * 76px grid underneath is the design — that is the r3 page, which shipped.
 *
 * SETTINGS ARE MEASURED, NOT CHOSEN. `node tools/shader-probe.mjs` reports
 * grain 3.67 and mean drift +0.34 against a flat sheet at these values. Two
 * earlier versions of D6 were written from screenshots and both shipped a texture
 * that was invisible and slightly grey. Do not adjust these by eye; change the
 * probe's sweep, re-run it, and update D6's table with the numbers.
 *
 * The imports reach into design/vendor rather than duplicating 504KB into src/.
 * That directory is the single copy of the library for both the design rounds and
 * the app, which is what keeps a ranked mockup and the shipped page the same
 * thing — the gap that let four rounds land on a site none of them described.
 */
export function PaperTexture() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    let mount: { dispose: () => void } | undefined;
    let cancelled = false;

    (async () => {
      try {
        const [
          { ShaderMount },
          { paperTextureFragmentShader },
          colorMod,
          noiseMod,
          { emptyPixel },
        ] = await Promise.all([
          import("../../design/vendor/paper-shaders/shader-mount.js"),
          import("../../design/vendor/paper-shaders/shaders/paper-texture.js"),
          import("../../design/vendor/paper-shaders/get-shader-color-from-string.js"),
          import("../../design/vendor/paper-shaders/get-shader-noise-texture.js"),
          import("../../design/vendor/paper-shaders/empty-pixel.js"),
        ]);
        if (cancelled) return;

        // Colours come from the tokens, never from a literal here.
        const css = getComputedStyle(document.documentElement);
        const token = (name: string) => css.getPropertyValue(name).trim();

        // u_image is required even though there is no image to show. ShaderMount
        // only sets u_imageAspectRatio when u_image is a loaded HTMLImageElement
        // (shader-mount.js:102, :250), and patternUV — which the fibre, crumples
        // and folds are ALL built on — is multiplied by it. Omit it and the aspect
        // stays 0, patternUV.x collapses, and the fibre renders nothing at any
        // setting. That is exactly what shipped in r2 and r4.
        const sheet = new Image();
        sheet.src = emptyPixel;
        await sheet.decode();

        // Returns undefined outside a browser document — belt and braces, since
        // this only runs in an effect.
        const noise = noiseMod.getShaderNoiseTexture();
        if (!noise) return;
        // ShaderMount throws if the noise image has not decoded before mount.
        await noise.decode();
        if (cancelled) return;

        const uniforms = {
          u_colorFront: colorMod.getShaderColorFromString(token("--sc-paper-fibre")),
          u_colorBack: colorMod.getShaderColorFromString(token("--sc-paper-lit")),
          u_contrast: 0.55,
          u_roughness: 0.3,
          u_fiber: 0.7,
          u_fiberSize: 0.4,
          u_crumples: 0.1,
          u_crumpleSize: 0.5,
          u_folds: 0,
          u_foldCount: 0,
          u_drops: 0,
          u_seed: 3,
          u_fade: 0,
          u_image: sheet,
          u_noiseTexture: noise,
          u_scale: 1,
          u_rotation: 0,
          u_offsetX: 0,
          u_offsetY: 0,
          u_originX: 0.5,
          u_originY: 0.5,
          u_worldWidth: 0,
          u_worldHeight: 0,
          u_fit: 0,
        };

        // speed 0, frame 0 — static. The brand does not animate its background,
        // so there is nothing for prefers-reduced-motion to switch off here.
        mount = new ShaderMount(el, paperTextureFragmentShader, uniforms, undefined, 0, 0);
      } catch {
        // Flat paper is a valid rendering of this design, not a broken one.
      }
    })();

    return () => {
      cancelled = true;
      mount?.dispose();
    };
  }, []);

  return <div ref={host} className="sc-sheet" aria-hidden="true" />;
}
