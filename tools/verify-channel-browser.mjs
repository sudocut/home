#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer } from "node:net";
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { pathToFileURL } from "node:url";

import { CHANNEL_ART } from "./lib/channel-art.mjs";

export const LOOPBACK_HOST = "127.0.0.1";
export const DEFAULT_READY_DEADLINE_MS = 15_000;
export const DEFAULT_POLL_INTERVAL_MS = 50;
export const HERO_MOTION_DEADLINE_MS = 3_000;
export const HERO_MOTION_INTERVAL_MS = 100;

export const CHROME_LAUNCH_ARGS = Object.freeze([
  "--enable-unsafe-swiftshader",
  "--hide-scrollbars",
  "--force-device-scale-factor=1",
]);

export const DEFAULT_CHROME_CANDIDATES = Object.freeze([
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
]);

const LOCALES = Object.freeze([
  {
    path: "/en",
    note: "Channel links · shown profile images are cleared for this site.",
  },
  {
    path: "/ko",
    note: "각 카드는 YouTube 채널로 연결됩니다. 보이는 프로필 이미지는 게시 허락을 받은 이미지입니다.",
  },
]);

const VIEWPORTS = Object.freeze([
  { label: "desktop", width: 1280, height: 900, avatarPx: 58, chipHeightPx: 82 },
  { label: "mobile", width: 390, height: 900, avatarPx: 52, chipHeightPx: 76 },
]);

const EXPECTED_CHANNELS = CHANNEL_ART;
const EXPECTED_ART_PATHS = CHANNEL_ART.map((channel) => channel.artPath);
const EXPECTED_CHANNEL_URLS = EXPECTED_CHANNELS.map((channel) => channel.channelUrl);
const TICKER_VISUAL_CYCLES = 4;
const LARGE_VIEWPORT_WIDTH = 1728;

function capDeadline(deadlineMs) {
  const parsed = Number(deadlineMs);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_READY_DEADLINE_MS;
  return Math.min(parsed, DEFAULT_READY_DEADLINE_MS);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isExecutable(path) {
  try {
    await access(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

export async function reserveLoopbackPort({ host = LOOPBACK_HOST } = {}) {
  const server = createServer();
  server.unref();

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, host, resolve);
  });

  const address = server.address();
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

  if (!address || typeof address === "string" || !Number.isInteger(address.port)) {
    throw new Error("Failed to reserve a loopback TCP port");
  }

  return {
    host,
    port: address.port,
    origin: `http://${host}:${address.port}`,
  };
}

export async function resolveChromeExecutable({
  env = process.env,
  candidates = DEFAULT_CHROME_CANDIDATES,
} = {}) {
  const paths = [env.CHROME, ...candidates].filter(Boolean);
  for (const path of paths) {
    if (await isExecutable(path)) return path;
  }

  throw new Error(
    `Chrome executable not found. Set CHROME=/path/to/chrome or install one of: ${candidates.join(", ")}`,
  );
}

export async function waitForHttpReady(
  url,
  { deadlineMs = DEFAULT_READY_DEADLINE_MS, intervalMs = DEFAULT_POLL_INTERVAL_MS } = {},
) {
  const deadline = Date.now() + capDeadline(deadlineMs);
  let lastError;

  while (Date.now() <= deadline) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      await response.arrayBuffer();
      if (response.ok) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await delay(Math.max(1, Number(intervalMs) || DEFAULT_POLL_INTERVAL_MS));
  }

  throw new Error(
    `Timed out waiting for HTTP readiness at ${url}: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
}

async function waitForExit(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null) return;

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for child pid ${child.pid} to exit`));
    }, timeoutMs);
    const done = () => {
      cleanup();
      resolve();
    };
    const cleanup = () => {
      clearTimeout(timer);
      child.off("exit", done);
    };
    child.once("exit", done);
  });
}

export async function terminateChild(
  child,
  { signal = "SIGTERM", timeoutMs = 3_000, killSignal = "SIGKILL" } = {},
) {
  if (!child || child.pid === undefined) return;
  if (child.exitCode !== null || child.signalCode !== null) return;

  child.kill(signal);
  try {
    await waitForExit(child, timeoutMs);
  } catch (error) {
    if (child.exitCode === null && child.signalCode === null) child.kill(killSignal);
    await waitForExit(child, timeoutMs);
  }
}

export async function withServerChild(
  {
    command,
    args = [],
    env = {},
    readinessUrl,
    readinessDeadlineMs = DEFAULT_READY_DEADLINE_MS,
    stdio = "inherit",
  },
  callback,
) {
  if (!command) throw new Error("withServerChild requires a command");
  if (!readinessUrl) throw new Error("withServerChild requires a readinessUrl");

  const child = spawn(command, args, {
    env: { ...process.env, ...env },
    stdio,
  });

  let onEarlyExit;
  const exitedEarly = new Promise((_, reject) => {
    onEarlyExit = (code, signal) => {
      reject(new Error(`Server child exited before readiness: code ${code}, signal ${signal}`));
    };
    child.once("exit", onEarlyExit);
  });

  try {
    await Promise.race([
      waitForHttpReady(readinessUrl, { deadlineMs: readinessDeadlineMs }),
      exitedEarly,
    ]);
    if (onEarlyExit) child.off("exit", onEarlyExit);
    return await callback(child);
  } finally {
    if (onEarlyExit) child.off("exit", onEarlyExit);
    await terminateChild(child);
  }
}

export function createPageIssueCollector(
  page,
  { allowConsoleError = () => false } = {},
) {
  const issues = [];

  page.on("pageerror", (error) => {
    issues.push({
      type: "pageerror",
      message: error instanceof Error ? error.stack || error.message : String(error),
    });
  });

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const issue = {
      type: "console",
      text: message.text(),
      location: message.location(),
    };
    if (!allowConsoleError(issue)) issues.push(issue);
  });

  return {
    issues,
    assertNoIssues(context = "page") {
      if (!issues.length) return;
      const detail = issues
        .map((issue) =>
          issue.type === "console"
            ? `console error at ${issue.location?.url ?? "unknown"}: ${issue.text}`
            : `pageerror: ${issue.message}`,
        )
        .join("\n");
      throw new Error(`${context} emitted browser errors:\n${detail}`);
    },
  };
}

export function isAllowedProfileImageConsoleFailure(issue, expectedPath) {
  if (!expectedPath) return false;
  const locationUrl = issue.location?.url ?? "";
  const text = issue.text ?? "";
  return (
    (locationUrl.endsWith(expectedPath) || text.includes(expectedPath)) &&
    /Failed to load resource|ERR_FAILED|ERR_ABORTED|ERR_CONNECTION/i.test(text)
  );
}

export async function launchChromium({ executablePath, chromium } = {}) {
  const mod = chromium ? { chromium } : await import("playwright-core");
  const chrome = executablePath ?? (await resolveChromeExecutable());
  return mod.chromium.launch({
    executablePath: chrome,
    headless: true,
    args: [...CHROME_LAUNCH_ARGS],
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertNear(actual, expected, tolerance, message) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message}: expected ${expected}±${tolerance}, got ${actual}`);
  }
}

function assertSameList(actual, expected, message) {
  const actualText = JSON.stringify(actual);
  const expectedText = JSON.stringify(expected);
  if (actualText !== expectedText) {
    throw new Error(`${message}: expected ${expectedText}, got ${actualText}`);
  }
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function openPage(page, origin, path) {
  await page.goto(`${origin}${path}`, { waitUntil: "domcontentloaded" });
  await page.locator(".sc-trust").waitFor({ state: "visible", timeout: 10_000 });
}

async function collectTrustBand(page) {
  return page.evaluate(() => {
    const trust = document.querySelector(".sc-trust");
    const tracks = Array.from(trust?.querySelectorAll(".sc-tick-track") ?? []);
    const originalItems = Array.from(trust?.querySelectorAll(".sc-tick-item:not([aria-hidden='true'])") ?? []);
    const duplicateItems = Array.from(trust?.querySelectorAll(".sc-tick-item[aria-hidden='true']") ?? []);
    const images = Array.from(trust?.querySelectorAll("img.sc-tick-avatar") ?? []).map((image) => {
      const rect = image.getBoundingClientRect();
      const slotRect = image.closest(".sc-tick-art")?.getBoundingClientRect();
      const style = getComputedStyle(image);
      return {
        alt: image.getAttribute("alt"),
        srcPath: new URL(image.currentSrc || image.getAttribute("src") || "", location.href).pathname,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        slotWidth: Math.round(slotRect?.width ?? 0),
        slotHeight: Math.round(slotRect?.height ?? 0),
        borderRadius: style.borderRadius,
        objectFit: style.objectFit,
        complete: image.complete,
        naturalWidth: image.naturalWidth,
      };
    });
    const itemHeights = Array.from(trust?.querySelectorAll(".sc-tick-item") ?? []).map((item) =>
      Math.round(item.getBoundingClientRect().height),
    );
    const cardHeights = Array.from(trust?.querySelectorAll("a.sc-tick") ?? []).map((card) =>
      Math.round(card.getBoundingClientRect().height),
    );
    const originalLinks = originalItems.map((item) => item.querySelector("a.sc-tick")).filter(Boolean).map((link) => ({
      href: link.href,
      tabIndex: link.tabIndex,
    }));
    const duplicateLinks = duplicateItems.map((item) => item.querySelector("a.sc-tick")).filter(Boolean).map((link) => ({
      href: link.href,
      tabIndex: link.tabIndex,
    }));
    const fallbackCanvasesByHref = Array.from(trust?.querySelectorAll("a.sc-tick") ?? [])
      .filter((card) => card.querySelectorAll(".sc-tick-art canvas").length > 0)
      .map((card) => card.href);

    return {
      note: trust?.querySelector(".sc-trust-note")?.textContent?.trim() ?? "",
      trackCount: tracks.length,
      visualCycleCount: originalItems.length
        ? Math.round((originalItems.length + duplicateItems.length) / originalItems.length)
        : 0,
      originalItemCount: originalItems.length,
      duplicateItemCount: duplicateItems.length,
      imageCount: images.length,
      images,
      fallbackCanvasesByHref,
      itemHeights,
      cardHeights,
      originalLinks,
      duplicateLinks,
    };
  });
}

function assertProfileContract(data, { note, avatarPx, chipHeightPx, context }) {
  const expectedRenderedImages = EXPECTED_ART_PATHS.length * TICKER_VISUAL_CYCLES;
  assertEqual(data.trackCount, 1, `${context} should render one continuous ticker track`);
  assertEqual(data.visualCycleCount, TICKER_VISUAL_CYCLES, `${context} visual cycle count`);
  assertEqual(data.originalItemCount, EXPECTED_CHANNELS.length, `${context} should expose one semantic channel set`);
  assertEqual(
    data.duplicateItemCount,
    EXPECTED_CHANNELS.length * (TICKER_VISUAL_CYCLES - 1),
    `${context} should render duplicate cycles only for the seam`,
  );
  assertEqual(data.imageCount, expectedRenderedImages, `${context} should render repeated cleared profile image instances`);
  assertEqual(
    data.fallbackCanvasesByHref.length,
    0,
    `${context} should not render fallback canvases while cleared profile images load`,
  );

  const uniquePaths = [...new Set(data.images.map((image) => image.srcPath))].sort();
  assertSameList(uniquePaths, [...EXPECTED_ART_PATHS].sort(), `${context} should use exactly six unique channel asset URLs`);

  for (const height of data.itemHeights) {
    assertEqual(height, chipHeightPx, `${context} item height`);
  }
  for (const height of data.cardHeights) {
    assertEqual(height, chipHeightPx, `${context} card height`);
  }

  for (const image of data.images) {
    assertEqual(image.alt, "", `${context} profile images should be decorative`);
    assertEqual(image.width, avatarPx, `${context} avatar width`);
    assertEqual(image.height, avatarPx, `${context} avatar height`);
    assertEqual(image.slotWidth, avatarPx, `${context} avatar slot width`);
    assertEqual(image.slotHeight, avatarPx, `${context} avatar slot height`);
    assertEqual(image.borderRadius, "50%", `${context} avatar border radius`);
    assertEqual(image.objectFit, "cover", `${context} avatar object-fit`);
    assert(image.complete && image.naturalWidth > 0, `${context} should not expose a broken profile image`);
  }

  assertSameList(
    data.originalLinks.map((link) => link.href),
    EXPECTED_CHANNEL_URLS,
    `${context} original links`,
  );
  assertSameList(
    data.duplicateLinks.map((link) => link.href),
    Array.from({ length: TICKER_VISUAL_CYCLES - 1 }, () => EXPECTED_CHANNEL_URLS).flat(),
    `${context} duplicate links`,
  );
  assertSameList(
    data.duplicateLinks.map((link) => link.tabIndex),
    EXPECTED_CHANNELS.map(() => -1).flatMap((value) => Array.from({ length: TICKER_VISUAL_CYCLES - 1 }, () => value)),
    `${context} duplicate links should be skipped by tab navigation`,
  );
  assertEqual(data.note, note, `${context} localized public-profile note`);
}

async function assertTickerSpacing(page, context) {
  const spacing = await page.evaluate(async () => {
    const animations = Array.from(document.querySelectorAll(".sc-tick-track")).flatMap((track) =>
      track.getAnimations(),
    );
    for (const animation of animations) {
      animation.pause();
      animation.currentTime = 0;
    }
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const rail = document.querySelector(".sc-tick-rail");
    const trust = document.querySelector(".sc-trust");
    const track = document.querySelector(".sc-tick-track");
    const railRect = rail?.getBoundingClientRect();
    const items = Array.from(document.querySelectorAll(".sc-tick-item")).map((item) => {
      const rect = item.getBoundingClientRect();
      return { left: rect.left, right: rect.right };
    });
    const rawGap = getComputedStyle(trust).getPropertyValue("--sc-tick-gap").trim();
    const declaredGap = Number.parseFloat(rawGap);
    const rawCount = track ? getComputedStyle(track).getPropertyValue("--sc-tick-count").trim() : "";
    const declaredCount = Number.parseFloat(rawCount);
    const gaps = items.slice(1).map((item, index) => item.left - items[index].right);

    return {
      declaredCount,
      declaredGap,
      startGap: (items[0]?.left ?? 0) - (railRect?.left ?? 0),
      gaps,
    };
  });

  assertEqual(spacing.declaredCount, EXPECTED_CHANNELS.length, `${context} ticker cycle count token`);
  assertNear(spacing.startGap, spacing.declaredGap, 1, `${context} track start gap`);
  for (const gap of spacing.gaps) {
    assertNear(gap, spacing.declaredGap, 1, `${context} item/seam gap`);
  }
}

async function assertTickerCoversLargeViewport(page, context) {
  const samples = await page.evaluate(async () => {
    const result = [];
    const track = document.querySelector(".sc-tick-track");
    const animations = track ? track.getAnimations() : [];
    const animation = animations[0];
    const duration =
      typeof animation?.effect?.getTiming === "function"
        ? Number(animation.effect.getTiming().duration)
        : 60_000;

    for (const pct of [0, 0.25, 0.5, 0.75, 0.98, 0.999]) {
      for (const item of animations) {
        item.pause();
        item.currentTime = duration * pct;
      }
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const visibleItems = Array.from(document.querySelectorAll(".sc-tick-item"))
        .map((item) => item.getBoundingClientRect())
        .filter((rect) => rect.right > 0 && rect.left < innerWidth);
      const maxRight = Math.max(...visibleItems.map((rect) => rect.right));
      result.push({ pct, maxRight, rightBlank: innerWidth - maxRight });
    }

    return result;
  });

  for (const sample of samples) {
    assert(
      sample.maxRight >= LARGE_VIEWPORT_WIDTH,
      `${context} ticker should cover the right edge at ${sample.pct}: blank ${sample.rightBlank}px`,
    );
  }
}

async function assertTickerPauses(page, context) {
  const rail = page.locator(".sc-tick-rail");
  const firstLink = page.locator(".sc-tick-item:not([aria-hidden='true']) a.sc-tick").first();

  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll(".sc-tick-track")).every(
      (track) => getComputedStyle(track).animationPlayState === "running",
    ),
  );

  await rail.hover();
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll(".sc-tick-track")).every(
      (track) => getComputedStyle(track).animationPlayState === "paused",
    ),
  );

  await page.mouse.move(1, 1);
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll(".sc-tick-track")).every(
      (track) => getComputedStyle(track).animationPlayState === "running",
    ),
  );

  await firstLink.focus();
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll(".sc-tick-track")).every(
      (track) => getComputedStyle(track).animationPlayState === "paused",
    ),
  );

  const activeHref = await page.evaluate(() => document.activeElement?.getAttribute("href"));
  assertEqual(activeHref, EXPECTED_CHANNELS[0].channelUrl, `${context} focused channel link`);
}

async function assertReducedMotion(page, context) {
  const result = await page.evaluate(() => {
    const rail = document.querySelector(".sc-tick-rail");
    const tracks = Array.from(document.querySelectorAll(".sc-tick-track"));
    const links = Array.from(document.querySelectorAll(".sc-tick-item:not([aria-hidden='true']) a.sc-tick"));
    const last = links.at(-1);
    last?.scrollIntoView({ block: "nearest", inline: "end" });
    const railRect = rail?.getBoundingClientRect();
    const lastRect = last?.getBoundingClientRect();
    return {
      animationsDisabled: tracks.every((track) => {
        const style = getComputedStyle(track);
        return style.animationName === "none" || style.animationDuration === "0s";
      }),
      scrollWidth: rail?.scrollWidth ?? 0,
      clientWidth: rail?.clientWidth ?? 0,
      lastVisible:
        !!railRect &&
        !!lastRect &&
        lastRect.left >= railRect.left - 1 &&
        lastRect.right <= railRect.right + 1,
    };
  });

  assert(result.animationsDisabled, `${context} reduced motion should disable ticker animation`);
  assert(result.scrollWidth > result.clientWidth, `${context} reduced-motion rail should remain horizontally scrollable`);
  assert(result.lastVisible, `${context} should be able to programmatically scroll to the last original channel link`);
}

async function assertWebGlContract(page) {
  await page.waitForFunction(
    () =>
      document.querySelectorAll(".sc-sheet canvas").length === 1 &&
      document.querySelectorAll(".sc-stage-art canvas").length === 1,
    { timeout: 15_000 },
  );

  const counts = await page.evaluate(() => ({
    paper: document.querySelectorAll(".sc-sheet canvas").length,
    hero: document.querySelectorAll(".sc-stage-art canvas").length,
    trust: document.querySelectorAll(".sc-trust canvas").length,
  }));
  assertEqual(counts.paper, 1, "normal profile mode should retain one paper canvas");
  assertEqual(counts.hero, 1, "normal profile mode should retain one hero canvas");
  assertEqual(counts.trust, 0, "normal profile mode should not spend WebGL contexts in the trust band");

  const hero = page.locator(".sc-stage-art canvas").first();
  const first = sha256(await hero.screenshot());
  const deadline = Date.now() + HERO_MOTION_DEADLINE_MS;
  while (Date.now() < deadline) {
    await page.waitForTimeout(HERO_MOTION_INTERVAL_MS);
    const next = sha256(await hero.screenshot());
    if (next !== first) return;
  }
  throw new Error("hero DRIFT canvas did not change within the bounded 3s motion window");
}

async function assertFallbackCase(browser, origin) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  });
  let aborted = 0;
  await context.route("**/channels/eo_korea.webp", (route) => {
    aborted += 1;
    return route.abort("failed");
  });
  const page = await context.newPage();
  const collector = createPageIssueCollector(page, {
    allowConsoleError: (issue) => isAllowedProfileImageConsoleFailure(issue, "/channels/eo_korea.webp"),
  });

  try {
    await openPage(page, origin, "/en");
    await page.waitForFunction(
      () => {
        const allCards = Array.from(document.querySelectorAll("a.sc-tick"));
        const affected = allCards.filter((card) => card.getAttribute("href") === "https://www.youtube.com/@eo_korea");
        const unaffected = allCards.filter((card) => card.getAttribute("href") !== "https://www.youtube.com/@eo_korea");
        return (
          affected.length === 4 &&
          affected.every((card) => card.querySelectorAll(".sc-tick-art canvas").length === 1) &&
          unaffected.length === 20 &&
          unaffected.every((card) => {
            const image = card.querySelector("img.sc-tick-avatar");
            const fallback = card.querySelector(".sc-tick-art canvas");
            return (!!image && image.complete && image.naturalWidth > 0) || !!fallback;
          })
        );
      },
      { timeout: 15_000 },
    );

    const counts = await page.evaluate(() => ({
      fallbackCanvases: Array.from(document.querySelectorAll("a.sc-tick"))
        .filter((card) => card.getAttribute("href") === "https://www.youtube.com/@eo_korea")
        .reduce((count, card) => count + card.querySelectorAll(".sc-tick-art canvas").length, 0),
      images: document.querySelectorAll(".sc-trust img.sc-tick-avatar").length,
      brokenImages: Array.from(document.querySelectorAll(".sc-trust img.sc-tick-avatar")).filter(
        (image) => !image.complete || image.naturalWidth === 0,
      ).length,
    }));
    assert(aborted >= 1, "fallback case should abort at least one profile-image request");
    assertEqual(counts.fallbackCanvases, 4, "aborted profile should render four fallback canvases");
    assertEqual(counts.images, 20, "non-aborted cleared profiles should remain images");
    assertEqual(counts.brokenImages, 0, "fallback case should not expose broken image icons");
    collector.assertNoIssues("fallback profile-image case");
  } finally {
    await context.close();
  }
}

async function verifyInBrowser(browser, origin) {
  let webGlChecked = false;

  for (const locale of LOCALES) {
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      const collector = createPageIssueCollector(page);
      const label = `${locale.path} ${viewport.label}`;

      try {
        await openPage(page, origin, locale.path);
        assertProfileContract(await collectTrustBand(page), {
          note: locale.note,
          avatarPx: viewport.avatarPx,
          chipHeightPx: viewport.chipHeightPx,
          context: label,
        });
        await assertTickerSpacing(page, label);
        if (viewport.width === LARGE_VIEWPORT_WIDTH) {
          await assertTickerCoversLargeViewport(page, label);
        }
        await assertTickerPauses(page, label);
        if (!webGlChecked) {
          await assertWebGlContract(page);
          webGlChecked = true;
        }
        collector.assertNoIssues(label);
      } finally {
        await context.close();
      }
    }
  }

  for (const locale of LOCALES) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const collector = createPageIssueCollector(page);
    try {
      await openPage(page, origin, locale.path);
      await assertReducedMotion(page, `${locale.path} reduced-motion`);
      collector.assertNoIssues(`${locale.path} reduced-motion`);
    } finally {
      await context.close();
    }
  }

  const largeContext = await browser.newContext({
    viewport: { width: LARGE_VIEWPORT_WIDTH, height: 900 },
    deviceScaleFactor: 1,
  });
  const largePage = await largeContext.newPage();
  const largeCollector = createPageIssueCollector(largePage);
  try {
    await openPage(largePage, origin, "/en");
    assertProfileContract(await collectTrustBand(largePage), {
      note: LOCALES[0].note,
      avatarPx: VIEWPORTS[0].avatarPx,
      chipHeightPx: VIEWPORTS[0].chipHeightPx,
      context: "/en large desktop",
    });
    await assertTickerSpacing(largePage, "/en large desktop");
    await assertTickerCoversLargeViewport(largePage, "/en large desktop");
    largeCollector.assertNoIssues("/en large desktop");
  } finally {
    await largeContext.close();
  }

  await assertFallbackCase(browser, origin);
}

export async function verifyChannelBrowser() {
  const reservation = await reserveLoopbackPort();
  const executablePath = await resolveChromeExecutable();

  await withServerChild(
    {
      command: "pnpm",
      args: ["exec", "next", "start", "-p", String(reservation.port), "-H", reservation.host],
      readinessUrl: `${reservation.origin}/en`,
      readinessDeadlineMs: DEFAULT_READY_DEADLINE_MS,
    },
    async () => {
      const browser = await launchChromium({ executablePath });
      try {
        await verifyInBrowser(browser, reservation.origin);
      } finally {
        await browser.close();
      }
    },
  );

  console.log("channel browser contract verified");
}

export async function main() {
  await verifyChannelBrowser();
}

const isDirectExecution =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
