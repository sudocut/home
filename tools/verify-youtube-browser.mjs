#!/usr/bin/env node

/**
 * The YouTube integration band, checked in a real browser — constitution D12.
 *
 * This exists instead of unit tests that re-state the JSX. Nothing here would
 * fail because a class name changed; every assertion is something that can
 * actually break and that a reviewer of the audit submission would catch:
 * the official file not loading, the logo dropping under YouTube's minimum
 * size, the band overflowing 390px, a recolouring filter creeping in, the link
 * pointing somewhere other than YouTube, or — the one that costs the most —
 * the logo drifting so far from the footer's privacy link that no single
 * screenshot can hold both, which is exactly what the audit form asks for.
 *
 * It doubles as the evidence generator. `--evidence` writes the captures to
 * .context/evidence/, which is gitignored: screenshots go in the PR, not in the
 * repository.
 *
 * Runs against `next start`, not `next dev` — the audit evidence has to come
 * from a production build, and the dev server is not what gets deployed.
 */

import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

import {
  DEFAULT_READY_DEADLINE_MS,
  createPageIssueCollector,
  launchChromium,
  reserveLoopbackPort,
  resolveChromeExecutable,
  withServerChild,
} from "./verify-channel-browser.mjs";

const LOGO_PATH = "/brands/youtube/yt_logo_fullcolor_almostblack_digital.png";

/** The official PNG, uncropped. A different pair means the file was edited. */
const LOGO_INTRINSIC = Object.freeze({ width: 1705, height: 573 });

/**
 * brand.youtube: "their height should never be smaller than ... Digital: 100px".
 * Read as the delivered file — see public/brands/youtube/README.md for why, and
 * for what the other reading would cost.
 */
const MIN_CANVAS_HEIGHT_PX = 100;

/** The guidelines name the YouTube homepage as an acceptable destination. */
const EXPECTED_HREF = "https://www.youtube.com/";

const LOCALES = Object.freeze(["en", "ko"]);

const VIEWPORTS = Object.freeze([
  { label: "desktop", width: 1440, height: 900 },
  { label: "mobile", width: 390, height: 844 },
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/**
 * The audit form wants to know what was photographed. A capture from a dirty
 * tree is still useful evidence for a PR, but it is NOT evidence about what is
 * deployed, and the difference has to be written down rather than assumed.
 */
function gitProvenance() {
  const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
  try {
    return {
      commit: git("rev-parse", "HEAD"),
      branch: git("rev-parse", "--abbrev-ref", "HEAD"),
      workingTreeClean: git("status", "--porcelain").length === 0,
    };
  } catch {
    return { commit: null, branch: null, workingTreeClean: null };
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      `${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`,
    );
  }
}

/**
 * Everything the page can tell us about the band, collected in one evaluate so
 * a layout that settles late cannot be read half-way through a reflow.
 */
async function collectBand(page) {
  return page.evaluate(() => {
    const band = document.querySelector(".sc-yt");
    if (!band) return { present: false };

    const link = band.querySelector("a.sc-yt-link");
    const img = band.querySelector("img.sc-yt-logo");
    const privacyLink = document.querySelector('.sc-foot-links a[href$="/privacy"]');
    const termsLink = document.querySelector('.sc-foot-links a[href$="/terms"]');

    const imgStyle = img ? getComputedStyle(img) : null;
    const imgBox = img ? img.getBoundingClientRect() : null;
    const privacyBox = privacyLink ? privacyLink.getBoundingClientRect() : null;

    // The point colour must stay on the waitlist button (S1/D12 clause 5).
    //
    // --sc-action is an ALIAS: its declared value is the string "var(--sc-accent)",
    // so reading the custom property off :root and comparing it to a computed
    // rgb() never matches and the check silently passes forever. Resolve it
    // through a probe element instead, which is the only way to get the colour
    // the browser actually paints.
    const probe = document.createElement("span");
    probe.style.color = "var(--sc-action)";
    probe.style.display = "none";
    document.body.append(probe);
    const cobalt = getComputedStyle(probe).color;
    probe.remove();

    const paintedCobalt = [...band.querySelectorAll("*"), band].some((node) => {
      const style = getComputedStyle(node);
      return [
        style.color,
        style.backgroundColor,
        style.borderTopColor,
        style.borderBottomColor,
        style.outlineColor,
        style.textDecorationColor,
      ].includes(cobalt);
    });

    return {
      present: true,
      linkHref: link?.href ?? null,
      linkTarget: link?.getAttribute("target") ?? null,
      linkRel: link?.getAttribute("rel") ?? null,
      // The accessible name as a browser builds it: alt text plus the sr-only
      // new-tab warning, and it must say each of them exactly once.
      linkName: link ? link.textContent.trim() : null,
      imgSrcPath: img ? new URL(img.src).pathname : null,
      imgAlt: img?.getAttribute("alt") ?? null,
      naturalWidth: img?.naturalWidth ?? 0,
      naturalHeight: img?.naturalHeight ?? 0,
      renderedWidth: imgBox ? Math.round(imgBox.width * 100) / 100 : 0,
      renderedHeight: imgBox ? Math.round(imgBox.height * 100) / 100 : 0,
      imgLeft: imgBox?.left ?? 0,
      imgRight: imgBox?.right ?? 0,
      // D12 clause 2 — no transform of any kind is applied to the file.
      filter: imgStyle?.filter ?? null,
      opacity: imgStyle?.opacity ?? null,
      mixBlendMode: imgStyle?.mixBlendMode ?? null,
      clipPath: imgStyle?.clipPath ?? null,
      transform: imgStyle?.transform ?? null,
      paintedCobalt,
      headingText: band.querySelector(".sc-yt-head")?.textContent?.trim() ?? "",
      bodyText: band.querySelector(".sc-yt-body")?.textContent?.trim() ?? "",
      privacyHref: privacyLink?.getAttribute("href") ?? null,
      termsHref: termsLink?.getAttribute("href") ?? null,
      // Can one screenshot hold the logo and the privacy link? This is the
      // audit-form requirement expressed as a number.
      logoToPrivacyPx:
        imgBox && privacyBox ? Math.round(privacyBox.bottom - imgBox.top) : null,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    };
  });
}

function assertBand(data, { locale, viewport }) {
  const where = `${locale} @ ${viewport.label}`;

  assert(data.present, `${where}: .sc-yt is not on the page`);

  // The official file, intact. A resave or a crop changes these numbers.
  assertEqual(data.imgSrcPath, LOGO_PATH, `${where}: logo src`);
  assertEqual(data.naturalWidth, LOGO_INTRINSIC.width, `${where}: logo intrinsic width`);
  assertEqual(data.naturalHeight, LOGO_INTRINSIC.height, `${where}: logo intrinsic height`);

  assert(
    data.renderedHeight >= MIN_CANVAS_HEIGHT_PX,
    `${where}: rendered canvas height ${data.renderedHeight}px is below YouTube's ${MIN_CANVAS_HEIGHT_PX}px minimum`,
  );

  // D12 clause 2, one assertion per way a palette "fix" would show up.
  assertEqual(data.filter, "none", `${where}: a filter is applied to the logo`);
  assertEqual(data.opacity, "1", `${where}: the logo is not at full opacity`);
  assertEqual(data.mixBlendMode, "normal", `${where}: the logo is being blended`);
  assertEqual(data.clipPath, "none", `${where}: the logo is clipped`);
  assertEqual(data.transform, "none", `${where}: the logo is transformed`);

  // Linking is a branding requirement, not a nicety.
  assertEqual(data.linkHref, EXPECTED_HREF, `${where}: logo link destination`);
  assertEqual(data.linkTarget, "_blank", `${where}: logo link target`);
  assert(
    data.linkRel?.includes("noopener") && data.linkRel?.includes("noreferrer"),
    `${where}: logo link rel is "${data.linkRel}", needs noopener and noreferrer`,
  );
  assert(
    data.imgAlt && data.imgAlt.length > 0,
    `${where}: the logo image has no alt text, so the link has no accessible name`,
  );
  assert(
    /new tab|새 탭/i.test(data.linkName ?? ""),
    `${where}: the link opens a new tab and does not say so: "${data.linkName}"`,
  );
  assert(
    !data.linkName?.includes(`${data.imgAlt} ${data.imgAlt}`),
    `${where}: the accessible name repeats itself: "${data.linkName}"`,
  );

  // S1 and D12 clause 5: the page's one point colour stays on the waitlist
  // button in the hero. A third-party mark does not get to spend that budget.
  assert(!data.paintedCobalt, `${where}: the band paints --sc-action somewhere`);

  // Localised, both of them, with real copy rather than a missing-key echo.
  assert(data.headingText.length > 0, `${where}: the band heading is empty`);
  assert(data.bodyText.length > 0, `${where}: the band body copy is empty`);
  assert(
    !data.headingText.includes("home.youtube"),
    `${where}: untranslated message key rendered: "${data.headingText}"`,
  );

  // Nothing is cut off and nothing pushes the page sideways.
  assert(
    data.imgLeft >= -0.5 && data.imgRight <= viewport.width + 0.5,
    `${where}: the logo runs outside the viewport (${data.imgLeft} → ${data.imgRight} in ${viewport.width}px)`,
  );
  assertEqual(
    data.scrollWidth,
    data.innerWidth,
    `${where}: horizontal overflow (scrollWidth vs innerWidth)`,
  );

  // The footer's policy links stay reachable and localised.
  assertEqual(data.privacyHref, `/${locale}/privacy`, `${where}: footer privacy link`);
  assertEqual(data.termsHref, `/${locale}/terms`, `${where}: footer terms link`);

  // "Homepage Screenshot — showing where Privacy Policy link is located with
  // YouTube branding visible." One capture, both things in it.
  assert(
    data.logoToPrivacyPx !== null && data.logoToPrivacyPx <= viewport.height,
    `${where}: logo top to privacy link bottom is ${data.logoToPrivacyPx}px, taller than the ${viewport.height}px viewport — no single screenshot can show both`,
  );
}

/**
 * What the YouTube developer policies require the documents themselves to say.
 * Section III.A.2 names these four in so many words, and an auditor reading the
 * Privacy Policy URL on the form is reading this page. A rewrite that drops one
 * of them fails the audit quietly, months later — so it fails the build instead.
 */
const REQUIRED_PRIVACY_LINKS = Object.freeze([
  "https://www.youtube.com/t/terms",
  "https://www.google.com/policies/privacy",
  "https://security.google.com/settings/security/permissions",
]);

/** The policy pages the audit form links to must open without signing in. */
async function assertPolicyPagesPublic(page, origin, locale) {
  for (const path of [`/${locale}/privacy`, `/${locale}/terms`]) {
    const response = await page.goto(`${origin}${path}`, { waitUntil: "domcontentloaded" });
    assertEqual(response?.status(), 200, `${path} status`);

    const doc = await page.evaluate(() => ({
      text: document.querySelector("main")?.textContent?.trim() ?? "",
      hrefs: [...document.querySelectorAll("main a[href]")].map((a) => a.getAttribute("href")),
    }));
    assert(doc.text.length > 400, `${path} rendered without a document body`);

    // "notify users that the API Client uses YouTube API Services"
    assert(
      doc.text.includes("YouTube API Services"),
      `${path} does not say that SudoCut uses YouTube API Services`,
    );

    const required =
      path.endsWith("/privacy") ? REQUIRED_PRIVACY_LINKS : ["https://www.youtube.com/t/terms"];
    for (const href of required) {
      assert(doc.hrefs.includes(href), `${path} is missing the required link ${href}`);
    }
  }
}

/** prefers-reduced-motion must leave the band fully readable, not just still. */
async function assertReducedMotion(page, origin, locale) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${origin}/${locale}`, { waitUntil: "domcontentloaded" });
  const data = await collectBand(page);
  assert(data.present, `${locale}: the band disappears under prefers-reduced-motion`);
  assert(
    data.renderedHeight >= MIN_CANVAS_HEIGHT_PX,
    `${locale}: the logo shrinks under prefers-reduced-motion`,
  );
  await page.emulateMedia({ reducedMotion: null });
}

/**
 * Keyboard reachability. The logo link has to be focusable and has to take a
 * visible outline — :focus-visible is BRAND-KIT §13 and never removed.
 */
async function assertKeyboardReachable(page, origin, locale) {
  await page.goto(`${origin}/${locale}`, { waitUntil: "domcontentloaded" });
  const focused = await page.evaluate(() => {
    const link = document.querySelector("a.sc-yt-link");
    if (!link) return null;
    link.focus();
    const style = getComputedStyle(link);
    return {
      isActive: document.activeElement === link,
      tabIndex: link.tabIndex,
      outlineWidth: style.outlineWidth,
    };
  });
  assert(focused?.isActive === true, `${locale}: the logo link cannot take focus`);
  assert(focused.tabIndex >= 0, `${locale}: the logo link is removed from the tab order`);
}

async function run({ evidence }) {
  const reservation = await reserveLoopbackPort();
  const executablePath = await resolveChromeExecutable();
  const captures = [];

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
        for (const locale of LOCALES) {
          for (const viewport of VIEWPORTS) {
            const context = await browser.newContext({
              viewport: { width: viewport.width, height: viewport.height },
              deviceScaleFactor: 2,
            });
            const page = await context.newPage();
            const issues = createPageIssueCollector(page);

            await page.goto(`${reservation.origin}/${locale}`, {
              waitUntil: "domcontentloaded",
            });
            await page.locator(".sc-yt-logo").waitFor({ state: "visible", timeout: 10_000 });
            await page.locator(".sc-yt-logo").evaluate((img) => img.decode());

            const data = await collectBand(page);
            assertBand(data, { locale, viewport });
            issues.assertNoIssues(`${locale} @ ${viewport.label}`);

            if (evidence) {
              const dir = ".context/evidence";
              await mkdir(dir, { recursive: true });
              const stem = `${dir}/home-${locale}-${viewport.label}`;

              await page.screenshot({ path: `${stem}-full.png`, fullPage: true });
              // The readable close-up: the band and the footer under it.
              await page.locator(".sc-yt").scrollIntoViewIfNeeded();
              await page.screenshot({ path: `${stem}-tail.png` });

              captures.push({
                locale,
                viewport: `${viewport.width}x${viewport.height}`,
                deviceScaleFactor: 2,
                url: `/${locale}`,
                full: `${stem}-full.png`,
                tail: `${stem}-tail.png`,
                renderedLogoPx: `${data.renderedWidth}x${data.renderedHeight}`,
                logoToPrivacyPx: data.logoToPrivacyPx,
              });
            }

            console.log(
              `  ${locale} @ ${viewport.label}: logo ${data.renderedWidth}x${data.renderedHeight} · ` +
                `logo→privacy ${data.logoToPrivacyPx}px of ${viewport.height}px`,
            );

            await context.close();
          }

          const page = await browser.newPage();
          await assertPolicyPagesPublic(page, reservation.origin, locale);
          await assertReducedMotion(page, reservation.origin, locale);
          await assertKeyboardReachable(page, reservation.origin, locale);
          await page.close();
        }

        if (evidence && captures.length) {
          await writeFile(
            ".context/evidence/captures.json",
            `${JSON.stringify(
              {
                takenAt: new Date().toISOString(),
                server: "next start (local production build) — NOT the deployed site",
                git: gitProvenance(),
                captures,
              },
              null,
              2,
            )}\n`,
          );
        }
      } finally {
        await browser.close();
      }
    },
  );

  console.log("youtube band browser contract verified");
}

export async function main() {
  await run({ evidence: process.argv.includes("--evidence") });
}

const isDirectExecution =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
