# Channel Profile Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the homepage trust band's abstract channel screens with five cleared, same-origin YouTube profile images while preserving the r7 DRIFT hero, ticker behavior, accessibility, and truthful provenance.

**Architecture:** Keep channel identity in `src/content/channels.ts`, render cleared images through a small client `ChannelArtwork` with a runtime Halftone fallback, and generate deterministic 256px WebP assets from retained cleared originals. Add one asset verifier and one Playwright-core browser verifier so provenance, responsive geometry, accessibility, fallback behavior, and WebGL-context reduction are executable contracts.

**Tech Stack:** Next.js 16, React 19, TypeScript, next-intl, Node 24, sharp 0.34.5, Playwright Core 1.62.1, Node's built-in test runner.

**Spec:** `docs/superpowers/specs/2026-08-18-channel-profile-images-design.md`

---

## File map

**Create**

- `brand/reference/channels/SOURCE.md` — machine-readable provenance, relationship basis, and public-safe clearance references.
- `brand/reference/channels/original/*.jpg` — five cleared, retained 900x900 originals; not served by Next.js.
- `public/channels/*.webp` — five deterministic 256x256 served derivatives.
- `src/components/ChannelArtwork.tsx` — client image renderer with image-error Halftone fallback.
- `tools/lib/channel-art.mjs` — manifest parsing, hashing, sharp transform, and shared validation helpers.
- `tools/build-channel-art.mjs` — deterministic derivative writer.
- `tools/verify-channel-art.mjs` — provenance, dimensions, size, checksum, and regeneration verifier.
- `tools/verify-channel-browser.mjs` — built-site browser contract probe.
- `tools/tests/channel-art.test.mjs` — Node tests for manifest/transform/verification helpers.
- `tools/tests/channel-browser.test.mjs` — Node tests for browser/server lifecycle helpers.

**Modify**

- `package.json`, `pnpm-lock.yaml` — pinned sharp/playwright-core dependencies and channel commands.
- `src/content/channels.ts` — five cleared `art` paths and corrected artwork contract.
- `src/components/ChannelTicker.tsx` — use `ChannelArtwork`; retain duplicate/link semantics.
- `src/components/Halftone.tsx` — generalize stale thumbnail-only comments.
- `app/globals.css` — 16:9 wrapper, 88px desktop avatar, 64px mobile avatar.
- `messages/en.json`, `messages/ko.json` — truthful public-profile note.
- `design/CONSTITUTION.md`, `CLAUDE.md` — narrow third-party media-pixel palette exception.
- `tools/make-frames.mjs` — correct stale drop-in artwork instructions.
- `tools/README.md` — document the asset build and verification commands.

---

### Task 1: Satisfy the all-five clearance gate

**Files:**

- Create only after clearance: `brand/reference/channels/SOURCE.md`
- Create only after clearance: `brand/reference/channels/original/*.jpg`

- [ ] **Step 1: Collect public-safe grant evidence for every channel**

For `eo_korea`, `eoglobal`, `sudoremove`, `chester_roh`, and `eegirit`, obtain:

- grantor with authority over the profile image;
- grant date;
- scope explicitly covering republication on the SudoCut company website and public GitHub repository;
- a public-safe evidence reference;
- confirmation that the channel is accurately described as publishing with SudoCut.

Expected: five complete grants. If even one is missing, stop. Do not copy image bytes or add `art` paths.

- [ ] **Step 2: Create the provenance skeleton outside git first**

Use this exact bounded JSON shape inside `SOURCE.md` so tooling can parse it
without a YAML dependency. Every channel owns its relationship and permission
evidence; do not infer one channel's grant from another or invent default dates:

```md
# Channel profile image provenance

<!-- channel-art-manifest:start -->
{
  "schemaVersion": 1,
  "channels": [
    {
      "handle": "eo_korea",
      "name": "EO Korea",
      "channelUrl": "https://www.youtube.com/@eo_korea",
      "capturedImageUrl": "<exact captured URL>",
      "retrievedAt": "<observed date>",
      "relationship": {
        "basis": "<founder-supplied basis>",
        "date": "<founder-supplied date>",
        "evidence": "<public-safe evidence reference>"
      },
      "permission": {
        "status": "cleared",
        "grantor": "<supplied grantor>",
        "grantedAt": "<supplied date>",
        "scope": "<company site and public GitHub repository>",
        "evidence": "<public-safe evidence reference>"
      },
      "original": {
        "path": "brand/reference/channels/original/eo_korea.jpg",
        "width": 900,
        "height": 900,
        "sha256": "<measured hash>"
      },
      "served": {
        "path": "public/channels/eo_korea.webp",
        "width": 256,
        "height": 256,
        "maxBytes": 100000,
        "bytes": null,
        "sha256": null
      }
    }
  ]
}
<!-- channel-art-manifest:end -->
```

Populate all five entries. `bytes` and served `sha256` are intentionally null in
the source phase because the derivative does not exist yet. Keep the draft
outside the repository until every permission and relationship field comes from
the founder and every status is `cleared`. This task does not authorize outreach
or messaging to any channel owner.

- [ ] **Step 3: Acquire and verify the cleared originals outside git**

Download the five recorded 900x900 profile images into a private temporary directory. Probe dimensions and compute SHA-256. Compare each value with the provenance draft.

Expected: exactly five decodable 900x900 JPEG originals with no extra files.

- [ ] **Step 4: Hold the complete cleared set outside the worktree**

Keep the provenance draft and all five originals in one explicit private
temporary directory. Record that path in the execution notes. Do not copy or
move any media into the public worktree in this task. Task 5 is the single
movement/activation point after tooling and the red browser contract exist.

---

### Task 2: Build deterministic channel-art tooling with TDD

**Files:**

- Create: `tools/lib/channel-art.mjs`
- Create: `tools/build-channel-art.mjs`
- Create: `tools/verify-channel-art.mjs`
- Create: `tools/tests/channel-art.test.mjs`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Add pinned tooling dependencies and scripts**

Run:

```bash
pnpm add -D sharp@0.34.5 playwright-core@1.62.1
```

Add scripts:

```json
{
  "channels:build-assets": "node tools/build-channel-art.mjs",
  "channels:finalize-assets": "node tools/build-channel-art.mjs --finalize",
  "channels:verify-assets": "node tools/verify-channel-art.mjs",
  "channels:verify-browser": "node tools/verify-channel-browser.mjs",
  "channels:test": "node --test tools/tests/*.test.mjs"
}
```

- [ ] **Step 2: Write failing manifest parser tests**

Test `parseManifest(text, { phase: "source" })` and
`parseManifest(text, { phase: "final" })`. Both require exactly one bounded JSON
block, schema version 1, five unique known handles, per-channel cleared permission
and relationship evidence, exact paths, valid URLs/dates, original dimensions
and hashes, and the served byte ceiling. Source phase requires served `bytes` and
`sha256` to be null; final phase requires measured non-null values. Add rejection
cases for a missing grant, missing per-channel relationship, invented/invalid
date, non-HTTPS/wrong-host URL, wrong exact name/channel URL, duplicate handle,
unexpected original/served path, and a sixth entry.

Run:

```bash
pnpm channels:test
```

Expected: FAIL because `tools/lib/channel-art.mjs` does not exist.

- [ ] **Step 3: Implement the minimal parser and shared constants**

Export:

```js
import { createHash } from "node:crypto";

export const CHANNELS = [
  { handle: "eo_korea", name: "EO Korea" },
  { handle: "eoglobal", name: "EO" },
  { handle: "sudoremove", name: "sudoremove" },
  { handle: "chester_roh", name: "AI Frontier Korea (노정석)" },
  { handle: "eegirit", name: "이기릿 EEgirIT" },
].map((channel) => ({
  ...channel,
  channelUrl: `https://www.youtube.com/@${channel.handle}`,
  originalPath: `brand/reference/channels/original/${channel.handle}.jpg`,
  servedPath: `public/channels/${channel.handle}.webp`,
  artPath: `/channels/${channel.handle}.webp`,
}));
export const SOURCE_SIZE = 900;
export const SERVED_SIZE = 256;
export const MAX_SERVED_BYTES = 100_000;

const START = "<!-- channel-art-manifest:start -->";
const END = "<!-- channel-art-manifest:end -->";
const requireText = (value, field) => {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required`);
};
const requireDate = (value, field) => {
  requireText(value, field);
  const parsed = new Date(`${value}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`${field} must be a real YYYY-MM-DD date`);
  }
};
const requireHttpsUrl = (value, field, hostSuffix) => {
  requireText(value, field);
  const parsed = new URL(value);
  const allowedHost = parsed.hostname === hostSuffix || parsed.hostname.endsWith(`.${hostSuffix}`);
  if (parsed.protocol !== "https:" || !allowedHost) {
    throw new Error(`${field} must be an approved HTTPS URL`);
  }
};
const requireSha = (value, field) => {
  if (!/^[0-9a-f]{64}$/.test(value ?? "")) throw new Error(`${field} must be sha256`);
};

export function parseManifest(markdown, { phase }) {
  if (!["source", "final"].includes(phase)) throw new Error("phase must be source or final");
  const start = markdown.indexOf(START);
  const end = markdown.indexOf(END);
  if (start < 0 || end < 0 || markdown.indexOf(START, start + 1) >= 0 || markdown.indexOf(END, end + 1) >= 0) {
    throw new Error("manifest must contain exactly one bounded JSON block");
  }
  const data = JSON.parse(markdown.slice(start + START.length, end));
  if (data.schemaVersion !== 1 || !Array.isArray(data.channels) || data.channels.length !== 5) {
    throw new Error("manifest schema/count mismatch");
  }
  for (const [index, channel] of data.channels.entries()) {
    const expected = CHANNELS[index];
    if (channel.handle !== expected.handle || channel.name !== expected.name || channel.channelUrl !== expected.channelUrl) {
      throw new Error(`channel identity mismatch at index ${index}`);
    }
    if (channel.original?.path !== expected.originalPath || channel.served?.path !== expected.servedPath) {
      throw new Error(`${channel.handle} path mismatch`);
    }
    requireHttpsUrl(channel.channelUrl, `${channel.handle}.channelUrl`, "youtube.com");
    requireHttpsUrl(channel.capturedImageUrl, `${channel.handle}.capturedImageUrl`, "googleusercontent.com");
    requireDate(channel.retrievedAt, `${channel.handle}.retrievedAt`);
    for (const field of ["basis", "evidence"]) requireText(channel.relationship?.[field], `${channel.handle}.relationship.${field}`);
    requireDate(channel.relationship?.date, `${channel.handle}.relationship.date`);
    if (channel.permission?.status !== "cleared") throw new Error(`${channel.handle}.permission.status must be cleared`);
    for (const field of ["grantor", "scope", "evidence"]) requireText(channel.permission?.[field], `${channel.handle}.permission.${field}`);
    requireDate(channel.permission?.grantedAt, `${channel.handle}.permission.grantedAt`);
    if (channel.original?.width !== 900 || channel.original?.height !== 900) throw new Error(`${channel.handle}.original dimensions`);
    requireSha(channel.original?.sha256, `${channel.handle}.original.sha256`);
    if (channel.served?.width !== 256 || channel.served?.height !== 256 || channel.served?.maxBytes !== 100000) throw new Error(`${channel.handle}.served contract`);
    if (phase === "source" && (channel.served.bytes !== null || channel.served.sha256 !== null)) throw new Error(`${channel.handle}.served must be pending`);
    if (phase === "final") {
      if (!Number.isInteger(channel.served.bytes) || channel.served.bytes <= 0 || channel.served.bytes > 100000) throw new Error(`${channel.handle}.served.bytes`);
      requireSha(channel.served.sha256, `${channel.handle}.served.sha256`);
    }
  }
  return data;
}

export const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");
export const servedPathToArt = (servedPath) => `/${servedPath.replace(/^public\//, "")}`;
```

Run `pnpm channels:test`; expected parser tests PASS.

- [ ] **Step 4: Write failing deterministic transform tests**

Generate a square JPEG fixture with sharp in a temp directory. Assert that `buildDerivative(input, output)` creates a 256x256 sRGB WebP at fixed quality, strips metadata, stays under 100KB, and produces byte-identical output on two runs. Assert a non-900x900 source is rejected.

Run `pnpm channels:test`; expected FAIL because `buildDerivative` is missing.

- [ ] **Step 5: Implement one shared transform**

Use sharp with autorotation, sRGB conversion,
`resize(256, 256, { fit: "fill" })` only after requiring a square 900x900 source,
metadata stripping, and exactly
`webp({ quality: 88, effort: 6, smartSubsample: true })`. Both builder and
verifier call this function; neither may duplicate transform options.

The implementation is exactly:

```js
export async function buildDerivative(input, output) {
  const metadata = await sharp(input).metadata();
  if (metadata.width !== SOURCE_SIZE || metadata.height !== SOURCE_SIZE || metadata.format !== "jpeg") {
    throw new Error(`${input} must be a ${SOURCE_SIZE}x${SOURCE_SIZE} JPEG`);
  }
  await sharp(input)
    .rotate()
    .toColourspace("srgb")
    .resize(SERVED_SIZE, SERVED_SIZE, { fit: "fill" })
    .webp({ quality: 88, effort: 6, smartSubsample: true })
    .toFile(output);
}
```

Run `pnpm channels:test`; expected all tests PASS.

- [ ] **Step 6: Write a failing source-to-final manifest test**

Given a valid source-phase fixture and original, assert that
`finalizeManifest(...)` writes a derivative and returns a final manifest with
measured `bytes` and `sha256`, without changing permission, relationship, source
URL, retrieval date, or original hash.

Run `pnpm channels:test`; expected FAIL because finalization is missing.

- [ ] **Step 7: Implement the finalizing builder**

`build-channel-art.mjs --finalize` accepts only a source-phase manifest, writes
all five derivatives, measures them, and atomically replaces only the bounded
JSON block with final served metadata. Plain `build-channel-art.mjs` accepts only
a final manifest and regenerates derivatives without changing provenance.

Run `pnpm channels:test`; expected PASS.

- [ ] **Step 8: Write failing production-verifier tests**

Cover missing files, checksum mismatch, oversized derivative, bad dimensions,
uncleared permission, per-channel relationship failure, configured-art mismatch,
and regenerated-byte mismatch.

Run `pnpm channels:test`; expected FAIL because the verifier CLI is missing.

- [ ] **Step 9: Implement the verifier CLI**

`verify-channel-art.mjs` accepts only a final manifest, decodes
originals/derivatives, validates metadata/checksums/size, regenerates into
`mkdtemp`, byte-compares, cross-checks configured `art` paths, and removes only
its own validated temp directory.

For the configuration cross-check, import `src/content/channels.ts` directly
under the repository's required Node 24 type-stripping support, then compare the
five `art` strings to `servedPathToArt(channel.served.path)`. Do not compare
`public/channels/x.webp` directly to `/channels/x.webp`, and do not regex
TypeScript source.

Run:

```bash
pnpm channels:test
```

Expected: fixture tests PASS. Do not run the production verifier yet: the real
manifest is still source-phase and `art` paths are intentionally inactive.

- [ ] **Step 10: Commit tooling without publishing media**

```bash
git add package.json pnpm-lock.yaml tools/lib/channel-art.mjs tools/build-channel-art.mjs tools/verify-channel-art.mjs tools/tests/channel-art.test.mjs
git commit -m "feat: add channel artwork verification tooling"
```

---

### Task 3: Create a failing browser contract before changing UI

**Files:**

- Create: `tools/verify-channel-browser.mjs`
- Create: `tools/tests/channel-browser.test.mjs`
- Modify: `tools/README.md`

- [ ] **Step 1: Write failing harness lifecycle tests**

Test exported helpers that reserve a loopback port, resolve `CHROME` or known
Chrome paths, wait for HTTP readiness with a deadline, and terminate the exact
child on success or failure. Inject a tiny Node fixture HTTP child into lifecycle
unit tests; never invoke `next start` there because a clean checkout has no
`.next` build. The real browser CLI starts `next start` only after its caller has
run `pnpm build`.

Run `pnpm channels:test`; expected FAIL because browser helpers are missing.

- [ ] **Step 2: Implement the minimal harness helpers**

Use condition polling capped at 15 seconds. Launch Chromium with
`--enable-unsafe-swiftshader`, `--hide-scrollbars`, and
`--force-device-scale-factor=1`; those flags match existing shader probes. Capture
all `pageerror` events. Capture console errors, but allow only an explicitly
matched profile-image URL failure inside the dedicated fallback case.

Run `pnpm channels:test`; expected PASS.

- [ ] **Step 3: Write the failing identity/accessibility browser assertions**

For each of `/en` and `/ko`, add 1280px and 390px cases. Assert the exact approved
localized note (`Public channel profiles · each card opens its YouTube source.`
or `공개 채널 프로필 · 각 카드는 해당 YouTube 채널로 연결됩니다.`), five
unique asset URLs, ten profile image instances, empty decorative alts, exact five
source links, one duplicated `aria-hidden` run, duplicate links at
`tabIndex=-1`, and 88px/64px circles. Reuse one assertion function so locale
coverage cannot drift.

Run `pnpm build && pnpm channels:verify-browser`.

Expected: FAIL with zero profile images on the current abstract band.

- [ ] **Step 4: Add ticker interaction assertions**

For both locales in the same two viewport classes, assert hover and focus set
both tracks to paused. For each locale in a separate
`reducedMotion: "reduce"` context, assert animation is disabled, rail
`scrollWidth > clientWidth`, and programmatic horizontal scroll reaches the last
original channel link.

Expected: profile assertions remain the first failure.

- [ ] **Step 5: Add bounded WebGL and motion assertions**

Assert normal profile mode retains one paper canvas and one hero canvas while
`.sc-trust canvas` is zero. Screenshot only `.sc-stage-art canvas`, hash it, and
poll a new screenshot every 100ms for at most 3 seconds until the hash changes;
fail if it never changes. This proves DRIFT motion without arbitrary long sleeps.

- [ ] **Step 6: Add the isolated runtime-error case**

In a fresh context, abort exactly one `/channels/eo_korea.webp` request. Allow
only that request's expected network console error. Assert the affected original
and duplicate cards each contain a fallback canvas, the other eight cards remain
images, and no broken-image icon is exposed.

- [ ] **Step 7: Confirm the complete contract is red and commit it**

```bash
pnpm channels:test
pnpm build
pnpm channels:verify-browser
```

Expected: unit harness tests PASS; browser verifier FAILS only because activation
has not happened.

```bash
git add tools/verify-channel-browser.mjs tools/tests/channel-browser.test.mjs tools/README.md package.json
git commit -m "test: define channel profile browser contract"
```

---

### Task 4: Add an inactive image renderer without changing the page

**Files:**

- Create: `src/components/ChannelArtwork.tsx`
- Modify: `src/components/ChannelTicker.tsx`

- [ ] **Step 1: Implement `ChannelArtwork` against the existing red contract**

```tsx
"use client";

export function ChannelArtwork({ art, frame, pitch }: Props) {
  const [failed, setFailed] = useState(false);
  if (!art || failed) return <Halftone className="sc-tick-art" pitch={pitch} src={frame} />;
  return (
    <span className="sc-tick-art sc-tick-profile">
      <img
        alt=""
        className="sc-tick-avatar"
        decoding="async"
        height={256}
        onError={() => setFailed(true)}
        src={art}
        width={256}
      />
    </span>
  );
}
```

Use focused string/number props, not the entire channel object.

- [ ] **Step 2: Route current artwork through the renderer**

Replace the direct `Halftone` call with `ChannelArtwork`. Do not add `art` paths
yet, so every card still takes the abstract fallback and the public page remains
unchanged. Keep link targets, duplicate keys, `aria-hidden`, and duplicate
`tabIndex={-1}` exactly.

- [ ] **Step 3: Run current-page regression checks**

```bash
pnpm channels:test
pnpm typecheck
pnpm build
```

Expected: PASS. `pnpm channels:verify-browser` remains red on the intentionally
inactive profile contract.

- [ ] **Step 4: Commit the inactive foundation**

```bash
git add src/components/ChannelArtwork.tsx src/components/ChannelTicker.tsx
git commit -m "refactor: add channel artwork fallback renderer"
```

---

### Task 5: Activate all five cleared profile images atomically

**Files:**

- Create: `brand/reference/channels/SOURCE.md`
- Create: `brand/reference/channels/original/*.jpg`
- Create: `public/channels/*.webp`
- Modify: `src/content/channels.ts`
- Modify: `src/components/ChannelTicker.tsx`
- Modify: `src/components/Halftone.tsx`
- Modify: `tools/make-frames.mjs`
- Modify: `app/globals.css`
- Modify: `messages/en.json`
- Modify: `messages/ko.json`
- Modify: `design/CONSTITUTION.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Reconfirm the founder-supplied all-five gate**

Before moving temporary media into git, confirm all five manifest entries contain
founder-supplied per-channel relationship evidence and authoritative grants for
the company site and public repository. Stop if any field is absent; this step
does not authorize external outreach.

- [ ] **Step 2: Move originals and the source-phase manifest into place**

Copy the exact cleared originals and draft from Task 1. Run
`pnpm channels:finalize-assets`; expected five WebPs plus atomically finalized
served hashes/bytes in the bounded JSON block.

- [ ] **Step 3: Activate every `art` path**

Add `/channels/<handle>.webp` for all five channels at once. Keep every `frame` as
runtime fallback. Update `channels.ts`, `Halftone.tsx`, and `make-frames.mjs`
comments from thumbnail-specific/abstract-only language to cleared artwork and
profile fallback language.

- [ ] **Step 4: Apply responsive visual rules**

Keep `.sc-tick-art` as the 16:9 wrapper. `.sc-tick-profile` explicitly uses
`background: var(--sc-surface)`, centered flex layout, and the current rule.
`.sc-tick-avatar` is 88px square, `object-fit: cover`, 2px tokenized ink border,
and `border-radius: 50%`; the existing max-880px block changes it to 64px.

- [ ] **Step 5: Replace copy and every now-false comment/policy statement**

Use the approved English/Korean strings. Update `ChannelTicker.tsx` comments that
say “MONOCHROME, ALWAYS” and “pictures are abstract,” plus the corresponding
`globals.css` ink-only comments. Amend D8 and `CLAUDE.md` with the narrow cleared
third-party media-pixel palette exception; surrounding chrome stays tokenized
ink/paper, and D7 describes only fallback screens.

- [ ] **Step 6: Run the production asset verifier to green**

```bash
pnpm channels:verify-assets
git add brand/reference/channels public/channels
pnpm channels:build-assets
git diff --exit-code -- brand/reference/channels public/channels
```

Expected: five verified handles, deterministic regeneration, and no working-tree
asset diff against the staged cleared/finalized set. Do not commit until the
browser verifier also passes.

- [ ] **Step 7: Run the browser contract to green**

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm channels:verify-browser
```

Expected: PASS in both locales/viewports, reduced motion, normal no-canvas band,
moving hero, and isolated runtime fallback.

- [ ] **Step 8: Commit activation as one all-or-nothing change**

```bash
git add brand/reference/channels public/channels src/content/channels.ts src/components/ChannelTicker.tsx src/components/Halftone.tsx tools/make-frames.mjs app/globals.css messages/en.json messages/ko.json design/CONSTITUTION.md CLAUDE.md
git commit -m "feat: show cleared channel profile images"
```

---

### Task 6: Final verification and handoff

**Files:**

- Verify all changed files; no new feature files expected.

- [ ] **Step 1: Run every feature contract fresh**

```bash
pnpm channels:build-assets
git diff --exit-code -- brand/reference/channels public/channels
pnpm channels:verify-assets
pnpm channels:test
pnpm lint
pnpm typecheck
pnpm build
pnpm channels:verify-browser
node tools/verify-round.mjs r4
git diff --exit-code -- design/rounds/r4/manifest.json
if grep -rnE '#[0-9a-fA-F]{6}' app/ src/; then exit 1; fi
if grep -rn 'font-family:' app/ src/ | grep -v 'var(--sc-'; then exit 1; fi
```

Expected: all commands exit 0; literal guards print nothing; the only accepted lint output is the repository's pre-existing specificity warning/schema-version info unless separately fixed.

- [ ] **Step 2: Inspect the final diff and provenance gate**

```bash
git diff origin/main...HEAD --check
git status --short --branch
git log --oneline origin/main..HEAD
```

Confirm all five permissions are still `cleared`, every derivative has a retained original, and no temporary/unapproved media entered git.

- [ ] **Step 3: Request code review**

Use `superpowers:requesting-code-review` against the full branch diff. Fix substantive findings and rerun Task 6 Step 1.

- [ ] **Step 4: Document whole-feature rollback**

Before merge, whole-feature rollback means closing the PR and deleting the branch
only with explicit discard confirmation. Require squash merge so the public
rollback is one atomic command:

```bash
git revert <channel-profile-images-squash-merge-oid>
```

The revert removes originals, derivatives, art paths, copy, policy exception,
tooling, and UI behavior together. The feature commands no longer exist after
rollback, so verify only with surviving baseline commands and absence checks:

```bash
pnpm lint
pnpm typecheck
pnpm build
node tools/verify-round.mjs r4
git diff --exit-code -- design/rounds/r4/manifest.json
test ! -e brand/reference/channels
test ! -e public/channels
if rg -n '/channels/.*\.webp|third-party media pixels|Public channel profiles|공개 채널 프로필' src app messages CLAUDE.md design/CONSTITUTION.md; then exit 1; fi
if grep -rnE '#[0-9a-fA-F]{6}' app/ src/; then exit 1; fi
if grep -rn 'font-family:' app/ src/ | grep -v 'var(--sc-'; then exit 1; fi
```

- [ ] **Step 5: Prepare a concrete PR body without publishing**

Use `apply_patch` to create `/tmp/channel-profile-images-pr.md` with:

```md
## Summary
- replace five abstract trust-band screens with cleared YouTube profile images
- retain deterministic Halftone fallback and remove ten normal-path WebGL contexts
- add reproducible originals, derivatives, provenance, and automated asset/browser verification

## Clearance
- all five profile images are recorded as cleared for the company site and public repository
- public-safe evidence references live in `brand/reference/channels/SOURCE.md`

## Verification
- `pnpm channels:verify-assets`
- `pnpm channels:test`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `pnpm channels:verify-browser`
- `node tools/verify-round.mjs r4`

## Runtime
- no runtime or build-time YouTube request
- failed local profile delivery falls back to the existing abstract Halftone

## Rollback
- squash merge; revert the single merge commit to remove the complete feature atomically
```

- [ ] **Step 6: Request explicit publication authorization**

Present the verified branch, commit list, clearance summary, and prepared PR body.
Do not push, create a PR, contact channel owners, or merge based only on the
earlier design/implementation instruction.

- [ ] **Step 7: Publish only after explicit authorization**

```bash
git push -u origin channel-profile-images
gh pr create --title "feat: show channel profile images" --body-file /tmp/channel-profile-images-pr.md
```
