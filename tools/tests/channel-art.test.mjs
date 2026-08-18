import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import sharp from "sharp";

import * as channelArt from "../lib/channel-art.mjs";

const { buildChannelAssets, buildDerivative, parseManifest } = channelArt;

const IDENTITIES = [
  ["eo_korea", "EO Korea"],
  ["eoglobal", "EO"],
  ["sudoremove", "sudoremove"],
  ["chester_roh", "AI Frontier Korea (노정석)"],
  ["eegirit", "이기릿 EEgirIT"],
  ["rlwrld.dexterity", "RLWRLD"],
];
const SHA_A = "a".repeat(64);
const SHA_B = "b".repeat(64);
const START = "<!-- channel-art-manifest:start -->";
const END = "<!-- channel-art-manifest:end -->";

function validManifest({ final = false } = {}) {
  return {
    schemaVersion: 1,
    channels: IDENTITIES.map(([handle, name], index) => ({
      handle,
      name,
      channelUrl: `https://www.youtube.com/@${handle}`,
      capturedImageUrl: `https://yt3.googleusercontent.com/avatar-${index}`,
      retrievedAt: "2026-08-18",
      relationship: {
        basis: "Published videos were edited with SudoCut.",
        date: "2026-08-18",
        evidence: `private/relationship/${handle}`,
      },
      permission: {
        status: "cleared",
        grantor: `${name} owner`,
        grantedAt: "2026-08-18",
        scope: "SudoCut website and public source repository",
        evidence: `private/permission/${handle}`,
      },
      original: {
        path: `brand/reference/channels/original/${handle}.jpg`,
        width: 900,
        height: 900,
        sha256: SHA_A,
      },
      served: {
        path: `public/channels/${handle}.webp`,
        width: 256,
        height: 256,
        maxBytes: 100000,
        bytes: final ? 12345 + index : null,
        sha256: final ? SHA_B : null,
      },
    })),
  };
}

function markdownFor(manifest) {
  return `Provenance before\n\n${START}\n${JSON.stringify(manifest, null, 2)}\n${END}\n\nNotes after\n`;
}

function mutate(mutator, options) {
  const manifest = validManifest(options);
  mutator(manifest);
  return markdownFor(manifest);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function writeOriginals(root, manifest) {
  for (const [index, channel] of manifest.channels.entries()) {
    const path = join(root, channel.original.path);
    await mkdir(join(path, ".."), { recursive: true });
    await sharp({
      create: {
        width: 900,
        height: 900,
        channels: 3,
        background: { r: 20 + index * 30, g: 80 + index * 10, b: 150 - index * 20 },
      },
    })
      .jpeg({ quality: 92 })
      .toFile(path);
    channel.original.sha256 = sha256(await readFile(path));
  }
}

async function writeSource(root, manifest) {
  const path = join(root, "brand/reference/channels/SOURCE.md");
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, markdownFor(manifest));
  return path;
}

function configuredChannels(manifest) {
  return manifest.channels.map((channel) => ({
    handle: channel.handle,
    name: channel.name,
    art: `/${channel.served.path.slice("public/".length)}`,
  }));
}

async function createFinalFixture(root) {
  const manifest = validManifest();
  await writeOriginals(root, manifest);
  const sourcePath = await writeSource(root, manifest);
  await buildChannelAssets({ root, finalize: true });
  return {
    manifest: parseManifest(await readFile(sourcePath, "utf8"), { phase: "final" }),
    sourcePath,
  };
}

async function loadVerifier() {
  return import("../verify-channel-art.mjs");
}

async function loadBuilder() {
  return import("../build-channel-art.mjs");
}

test("channel artwork tooling exposes a manifest parser", () => {
  assert.equal(typeof parseManifest, "function");
});

test("parseManifest accepts the exact source-phase contract", () => {
  const manifest = validManifest();

  assert.deepEqual(parseManifest(markdownFor(manifest), { phase: "source" }), manifest);
});

test("parseManifest accepts positive measured derivative data in the final phase", () => {
  const manifest = validManifest({ final: true });

  assert.deepEqual(parseManifest(markdownFor(manifest), { phase: "final" }), manifest);
});

test("parseManifest requires exactly one bounded JSON block", () => {
  const manifest = validManifest();
  const block = `${START}\n${JSON.stringify(manifest)}\n${END}`;

  assert.throws(() => parseManifest(JSON.stringify(manifest), { phase: "source" }), /exactly one/i);
  assert.throws(() => parseManifest(`${block}\n${block}`, { phase: "source" }), /exactly one/i);
  assert.throws(() => parseManifest(`${START}\nnot json\n${END}`, { phase: "source" }), /JSON/i);
});

test("parseManifest rejects an unsupported phase or schema version", () => {
  assert.throws(() => parseManifest(markdownFor(validManifest()), { phase: "draft" }), /phase/i);
  assert.throws(
    () => parseManifest(mutate((manifest) => (manifest.schemaVersion = 2)), { phase: "source" }),
    /schemaVersion/i,
  );
});

test("parseManifest rejects missing, extra, duplicated, or reordered channels", () => {
  const cases = [
    mutate((manifest) => manifest.channels.pop()),
    mutate((manifest) => manifest.channels.push(structuredClone(manifest.channels[0]))),
    mutate((manifest) => (manifest.channels[1] = structuredClone(manifest.channels[0]))),
    mutate((manifest) => manifest.channels.reverse()),
  ];

  for (const markdown of cases) {
    assert.throws(() => parseManifest(markdown, { phase: "source" }), /channels|handle|order/i);
  }
});

test("parseManifest rejects wrong identities, URLs, and local paths", () => {
  const cases = [
    mutate((manifest) => (manifest.channels[0].name = "EO Korea renamed")),
    mutate((manifest) => (manifest.channels[0].channelUrl = "https://youtube.com/@eoglobal")),
    mutate((manifest) => (manifest.channels[0].channelUrl = "http://www.youtube.com/@eo_korea")),
    mutate((manifest) => (manifest.channels[0].channelUrl = "https://youtube.example/@eo_korea")),
    mutate((manifest) => (manifest.channels[0].capturedImageUrl = "https://evilgoogleusercontent.com/avatar")),
    mutate((manifest) => (manifest.channels[0].capturedImageUrl = "http://yt3.googleusercontent.com/avatar")),
    mutate((manifest) => (manifest.channels[0].original.path = "brand/reference/channels/eo_korea.jpg")),
    mutate((manifest) => (manifest.channels[0].served.path = "public/channel/eo_korea.webp")),
  ];

  for (const markdown of cases) {
    assert.throws(() => parseManifest(markdown, { phase: "source" }), /name|URL|path/i);
  }
});

test("parseManifest validates real ISO calendar dates", () => {
  const cases = [
    mutate((manifest) => (manifest.channels[0].retrievedAt = "2026-02-30")),
    mutate((manifest) => (manifest.channels[0].relationship.date = "2026-13-01")),
    mutate((manifest) => (manifest.channels[0].permission.grantedAt = "August 18, 2026")),
  ];

  for (const markdown of cases) {
    assert.throws(() => parseManifest(markdown, { phase: "source" }), /date|retrievedAt|grantedAt/i);
  }
});

test("parseManifest requires complete relationship evidence", () => {
  for (const field of ["basis", "date", "evidence"]) {
    const markdown = mutate((manifest) => delete manifest.channels[0].relationship[field]);
    assert.throws(() => parseManifest(markdown, { phase: "source" }), /relationship/i);
  }
});

test("parseManifest requires an exact cleared permission grant", () => {
  const missingFields = ["grantor", "grantedAt", "scope", "evidence"];
  for (const field of missingFields) {
    const markdown = mutate((manifest) => delete manifest.channels[0].permission[field]);
    assert.throws(() => parseManifest(markdown, { phase: "source" }), /permission/i);
  }

  assert.throws(
    () =>
      parseManifest(
        mutate((manifest) => (manifest.channels[0].permission.status = "pending")),
        { phase: "source" },
      ),
    /cleared|permission/i,
  );
});

test("parseManifest enforces original image metadata and checksums", () => {
  const cases = [
    mutate((manifest) => (manifest.channels[0].original.width = 899)),
    mutate((manifest) => (manifest.channels[0].original.height = 901)),
    mutate((manifest) => (manifest.channels[0].original.sha256 = "A".repeat(64))),
    mutate((manifest) => (manifest.channels[0].original.sha256 = "a".repeat(63))),
  ];

  for (const markdown of cases) {
    assert.throws(() => parseManifest(markdown, { phase: "source" }), /original|sha256|900/i);
  }
});

test("parseManifest enforces served metadata and phase-specific measurements", () => {
  const sourceCases = [
    mutate((manifest) => (manifest.channels[0].served.width = 255)),
    mutate((manifest) => (manifest.channels[0].served.height = 257)),
    mutate((manifest) => (manifest.channels[0].served.maxBytes = 99999)),
    mutate((manifest) => (manifest.channels[0].served.bytes = 1)),
    mutate((manifest) => (manifest.channels[0].served.sha256 = SHA_B)),
  ];
  for (const markdown of sourceCases) {
    assert.throws(() => parseManifest(markdown, { phase: "source" }), /served|source|256|100000/i);
  }

  const finalCases = [
    mutate((manifest) => (manifest.channels[0].served.bytes = null), { final: true }),
    mutate((manifest) => (manifest.channels[0].served.bytes = 0), { final: true }),
    mutate((manifest) => (manifest.channels[0].served.bytes = 100001), { final: true }),
    mutate((manifest) => (manifest.channels[0].served.bytes = 1.5), { final: true }),
    mutate((manifest) => (manifest.channels[0].served.sha256 = null), { final: true }),
    mutate((manifest) => (manifest.channels[0].served.sha256 = "B".repeat(64)), { final: true }),
  ];
  for (const markdown of finalCases) {
    assert.throws(() => parseManifest(markdown, { phase: "final" }), /served|final|sha256|bytes/i);
  }
});

test("buildDerivative creates a deterministic, metadata-free 256px WebP", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "channel-art-transform-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const input = join(directory, "source.jpg");
  const first = join(directory, "first.webp");
  const second = join(directory, "second.webp");
  const pixels = Buffer.alloc(900 * 900 * 3);
  for (let index = 0; index < pixels.length; index += 3) {
    pixels[index] = (index / 3) % 251;
    pixels[index + 1] = Math.floor(index / 2700) % 241;
    pixels[index + 2] = 113;
  }
  await sharp(pixels, { raw: { width: 900, height: 900, channels: 3 } })
    .jpeg({ quality: 93 })
    .withMetadata({ orientation: 1 })
    .toFile(input);

  await buildDerivative(input, first);
  await buildDerivative(input, second);

  const [firstBytes, secondBytes, metadata] = await Promise.all([
    readFile(first),
    readFile(second),
    sharp(first).metadata(),
  ]);
  assert.deepEqual(firstBytes, secondBytes);
  assert.ok(firstBytes.byteLength > 0 && firstBytes.byteLength <= 100000);
  assert.equal(metadata.format, "webp");
  assert.equal(metadata.width, 256);
  assert.equal(metadata.height, 256);
  assert.equal(metadata.space, "srgb");
  assert.equal(metadata.exif, undefined);
  assert.equal(metadata.icc, undefined);
  assert.equal(metadata.xmp, undefined);
});

test("buildDerivative rejects non-900px and non-JPEG sources", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "channel-art-invalid-transform-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const wrongSize = join(directory, "wrong-size.jpg");
  const wrongFormat = join(directory, "wrong-format.png");
  const output = join(directory, "output.webp");
  await sharp({ create: { width: 899, height: 900, channels: 3, background: "white" } })
    .jpeg()
    .toFile(wrongSize);
  await sharp({ create: { width: 900, height: 900, channels: 3, background: "white" } })
    .png()
    .toFile(wrongFormat);

  await assert.rejects(() => buildDerivative(wrongSize, output), /900x900/i);
  await assert.rejects(() => buildDerivative(wrongFormat, output), /JPEG/i);
});

test("buildChannelAssets finalizes six derivatives and only measured served provenance", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "channel-art-finalize-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const sourceManifest = validManifest();
  await writeOriginals(root, sourceManifest);
  const sourcePath = await writeSource(root, sourceManifest);
  const beforeMarkdown = await readFile(sourcePath, "utf8");
  const calls = [];

  await buildChannelAssets({
    root,
    finalize: true,
    buildDerivativeFn: async (input, output) => {
      calls.push([input, output]);
      return buildDerivative(input, output);
    },
  });

  assert.equal(calls.length, IDENTITIES.length);
  const afterMarkdown = await readFile(sourcePath, "utf8");
  const finalized = parseManifest(afterMarkdown, { phase: "final" });
  assert.equal(
    afterMarkdown.slice(0, afterMarkdown.indexOf(START)),
    beforeMarkdown.slice(0, beforeMarkdown.indexOf(START)),
  );
  assert.equal(
    afterMarkdown.slice(afterMarkdown.indexOf(END) + END.length),
    beforeMarkdown.slice(beforeMarkdown.indexOf(END) + END.length),
  );

  for (const [index, channel] of finalized.channels.entries()) {
    const expected = structuredClone(sourceManifest.channels[index]);
    expected.served.bytes = channel.served.bytes;
    expected.served.sha256 = channel.served.sha256;
    assert.deepEqual(channel, expected);

    const derivative = await readFile(join(root, channel.served.path));
    assert.equal(channel.served.bytes, derivative.byteLength);
    assert.equal(channel.served.sha256, sha256(derivative));
  }

  const leftovers = (await readdir(join(root, "brand/reference/channels"))).filter((name) =>
    name.includes(".tmp-"),
  );
  assert.deepEqual(leftovers, []);
});

test("buildChannelAssets requires source for finalization and final for plain builds", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "channel-art-phases-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const manifest = validManifest();
  await writeOriginals(root, manifest);
  const sourcePath = await writeSource(root, manifest);

  await assert.rejects(() => buildChannelAssets({ root }), /final|served/i);

  await buildChannelAssets({ root, finalize: true });
  const finalMarkdown = await readFile(sourcePath, "utf8");
  await assert.rejects(() => buildChannelAssets({ root, finalize: true }), /source|served/i);

  await buildChannelAssets({ root });
  assert.equal(await readFile(sourcePath, "utf8"), finalMarkdown);
  for (const channel of parseManifest(finalMarkdown, { phase: "final" }).channels) {
    await access(join(root, channel.served.path));
  }
});

test("buildChannelAssets refuses to finalize an original with a mismatched checksum", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "channel-art-source-hash-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const manifest = validManifest();
  await writeOriginals(root, manifest);
  manifest.channels[2].original.sha256 = SHA_A;
  await writeSource(root, manifest);

  await assert.rejects(() => buildChannelAssets({ root, finalize: true }), /original.*checksum/i);
});

test("verifyChannelAssets validates a final fixture through a direct TypeScript config import", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "channel-art-verify-valid-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const { manifest } = await createFinalFixture(root);
  const sourceDirectory = join(root, "src/content");
  await mkdir(sourceDirectory, { recursive: true });
  await writeFile(
    join(sourceDirectory, "channels.ts"),
    `export type Channel = { handle: string; name: string; art?: string };\nexport const CHANNELS: readonly Channel[] = ${JSON.stringify(
      configuredChannels(manifest),
    )} as const;\n`,
  );
  const temporaryParent = join(root, "verification-temporary-parent");
  await mkdir(temporaryParent);
  await writeFile(join(temporaryParent, "keep-me"), "sentinel");
  const { verifyChannelAssets } = await loadVerifier();

  const result = await verifyChannelAssets({ root, temporaryParent });

  assert.equal(result.verified, IDENTITIES.length);
  assert.deepEqual(await readdir(temporaryParent), ["keep-me"]);
});

test("verifyChannelAssets accepts only a final manifest", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "channel-art-verify-source-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const manifest = validManifest();
  await writeOriginals(root, manifest);
  await writeSource(root, manifest);
  const { verifyChannelAssets } = await loadVerifier();

  await assert.rejects(
    () => verifyChannelAssets({ root, configuredChannels: configuredChannels(manifest) }),
    /final|served/i,
  );
});

test("verifyChannelAssets rejects missing original or derivative files", async (t) => {
  const { verifyChannelAssets } = await loadVerifier();
  for (const kind of ["original", "served"]) {
    await t.test(kind, async (t) => {
      const root = await mkdtemp(join(tmpdir(), `channel-art-verify-missing-${kind}-`));
      t.after(() => rm(root, { recursive: true, force: true }));
      const { manifest } = await createFinalFixture(root);
      await rm(join(root, manifest.channels[1][kind].path));

      await assert.rejects(
        () => verifyChannelAssets({ root, configuredChannels: configuredChannels(manifest) }),
        /ENOENT|missing/i,
      );
    });
  }
});

test("verifyChannelAssets rejects recorded hash or size mismatches", async (t) => {
  const { verifyChannelAssets } = await loadVerifier();
  for (const kind of ["hash", "size"]) {
    await t.test(kind, async (t) => {
      const root = await mkdtemp(join(tmpdir(), `channel-art-verify-${kind}-`));
      t.after(() => rm(root, { recursive: true, force: true }));
      const { manifest } = await createFinalFixture(root);
      if (kind === "hash") manifest.channels[0].served.sha256 = SHA_A;
      if (kind === "size") manifest.channels[0].served.bytes += 1;
      await writeSource(root, manifest);

      await assert.rejects(
        () => verifyChannelAssets({ root, configuredChannels: configuredChannels(manifest) }),
        new RegExp(kind, "i"),
      );
    });
  }
});

test("verifyChannelAssets rejects an actual derivative over the 100000-byte ceiling", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "channel-art-verify-byte-ceiling-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const { manifest } = await createFinalFixture(root);
  const channel = manifest.channels[0];
  const servedPath = join(root, channel.served.path);
  const pixels = Buffer.alloc(256 * 256 * 3);
  let state = 0x12345678;
  for (let index = 0; index < pixels.length; index += 1) {
    state = (Math.imul(state, 1664525) + 1013904223) | 0;
    pixels[index] = state >>> 24;
  }
  await sharp(pixels, { raw: { width: 256, height: 256, channels: 3 } })
    .webp({ lossless: true })
    .toFile(servedPath);
  assert.ok((await readFile(servedPath)).byteLength > 100000, "fixture must exceed the ceiling");
  const { verifyChannelAssets } = await loadVerifier();

  await assert.rejects(
    () => verifyChannelAssets({ root, configuredChannels: configuredChannels(manifest) }),
    /exceeds 100000 bytes/i,
  );
});

test("verifyChannelAssets rejects decoded dimension or format mismatches", async (t) => {
  const { verifyChannelAssets } = await loadVerifier();
  for (const kind of ["original-dimension", "served-dimension", "served-format"]) {
    await t.test(kind, async (t) => {
      const root = await mkdtemp(join(tmpdir(), `channel-art-verify-${kind}-`));
      t.after(() => rm(root, { recursive: true, force: true }));
      const { manifest } = await createFinalFixture(root);
      const channel = manifest.channels[0];
      const target = join(root, kind.startsWith("original") ? channel.original.path : channel.served.path);
      if (kind === "original-dimension") {
        await sharp({ create: { width: 899, height: 900, channels: 3, background: "white" } })
          .jpeg()
          .toFile(target);
        channel.original.sha256 = sha256(await readFile(target));
      } else if (kind === "served-dimension") {
        await sharp({ create: { width: 255, height: 256, channels: 3, background: "white" } })
          .webp()
          .toFile(target);
        const bytes = await readFile(target);
        channel.served.bytes = bytes.byteLength;
        channel.served.sha256 = sha256(bytes);
      } else {
        await sharp({ create: { width: 256, height: 256, channels: 3, background: "white" } })
          .jpeg()
          .toFile(target);
        const bytes = await readFile(target);
        channel.served.bytes = bytes.byteLength;
        channel.served.sha256 = sha256(bytes);
      }
      await writeSource(root, manifest);

      await assert.rejects(
        () => verifyChannelAssets({ root, configuredChannels: configuredChannels(manifest) }),
        /dimension|900x900|256x256|format|JPEG|WebP/i,
      );
    });
  }
});

test("verifyChannelAssets rejects uncleared permission or missing relationship provenance", async (t) => {
  const { verifyChannelAssets } = await loadVerifier();
  for (const kind of ["permission", "relationship"]) {
    await t.test(kind, async (t) => {
      const root = await mkdtemp(join(tmpdir(), `channel-art-verify-${kind}-`));
      t.after(() => rm(root, { recursive: true, force: true }));
      const { manifest } = await createFinalFixture(root);
      if (kind === "permission") manifest.channels[0].permission.status = "pending";
      if (kind === "relationship") delete manifest.channels[0].relationship.evidence;
      await writeSource(root, manifest);

      await assert.rejects(
        () => verifyChannelAssets({ root, configuredChannels: configuredChannels(manifest) }),
        new RegExp(kind, "i"),
      );
    });
  }
});

test("verifyChannelAssets rejects missing, extra, or wrong configured artwork paths", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "channel-art-verify-config-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const { manifest } = await createFinalFixture(root);
  const { verifyChannelAssets } = await loadVerifier();
  const valid = configuredChannels(manifest);
  const cases = [
    valid.slice(0, -1),
    [...valid, { handle: "extra", name: "Extra", art: "/channels/extra.webp" }],
    valid.map((channel, index) =>
      index === 2 ? { ...channel, art: "/channels/wrong.webp" } : channel,
    ),
  ];

  for (const channels of cases) {
    await assert.rejects(
      () => verifyChannelAssets({ root, configuredChannels: channels }),
      /configured|art|channels/i,
    );
  }
});

test("verifyChannelAssets rejects regenerated bytes that differ from the committed derivative", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "channel-art-verify-regenerated-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const { manifest } = await createFinalFixture(root);
  const { verifyChannelAssets } = await loadVerifier();

  await assert.rejects(
    () =>
      verifyChannelAssets({
        root,
        configuredChannels: configuredChannels(manifest),
        buildDerivativeFn: async (_input, output) => writeFile(output, "different bytes"),
      }),
    /regenerated|byte/i,
  );
});

test("build-channel-art main maps plain and finalize invocations to the shared builder", async () => {
  const { main } = await loadBuilder();
  const calls = [];
  const buildChannelAssetsFn = async (options) => {
    calls.push(options);
    return { channels: new Array(5) };
  };

  await main({ argv: [], root: "/fixture/plain", buildChannelAssetsFn, log: () => {} });
  await main({
    argv: ["--finalize"],
    root: "/fixture/finalize",
    buildChannelAssetsFn,
    log: () => {},
  });

  assert.deepEqual(calls, [
    { root: "/fixture/plain", finalize: false },
    { root: "/fixture/finalize", finalize: true },
  ]);
});

test("build-channel-art main rejects unknown arguments", async () => {
  const { main } = await loadBuilder();

  await assert.rejects(
    () => main({ argv: ["--force"], buildChannelAssetsFn: async () => {} }),
    /usage|--finalize/i,
  );
});
