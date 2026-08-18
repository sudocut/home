import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import sharp from "sharp";

export const CHANNEL_ART_MANIFEST_START = "<!-- channel-art-manifest:start -->";
export const CHANNEL_ART_MANIFEST_END = "<!-- channel-art-manifest:end -->";
export const SOURCE_SIZE = 900;
export const SERVED_SIZE = 256;
export const MAX_SERVED_BYTES = 100000;

export const CHANNEL_ART = Object.freeze(
  [
    ["eo_korea", "EO Korea"],
    ["eoglobal", "EO"],
    ["sudoremove", "sudoremove"],
    ["chester_roh", "AI Frontier Korea (노정석)"],
    ["eegirit", "이기릿 EEgirIT"],
    ["rlwrld.dexterity", "RLWRLD"],
  ].map(([handle, name]) =>
    Object.freeze({
      handle,
      name,
      channelUrl: `https://www.youtube.com/@${handle}`,
      originalPath: `brand/reference/channels/original/${handle}.jpg`,
      servedPath: `public/channels/${handle}.webp`,
      artPath: `/channels/${handle}.webp`,
    }),
  ),
);

export function servedPathToArt(servedPath) {
  const prefix = "public/";
  if (typeof servedPath !== "string" || !servedPath.startsWith(prefix)) {
    throw new Error(`Served channel artwork path must start with ${prefix}`);
  }
  return `/${servedPath.slice(prefix.length)}`;
}

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function fail(message) {
  throw new Error(`Invalid channel artwork manifest: ${message}`);
}

function requireRecord(value, path) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail(`${path} must be an object`);
  }
}

function requireNonEmptyString(value, path) {
  if (typeof value !== "string" || value.trim() === "") {
    fail(`${path} must be a non-empty string`);
  }
}

function requireDate(value, path) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    fail(`${path} must be a YYYY-MM-DD date`);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) {
    fail(`${path} must be a real calendar date`);
  }
}

function requireSha256(value, path) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) {
    fail(`${path} must be a 64-character lowercase SHA-256`);
  }
}

function requireCapturedImageUrl(value, path) {
  let url;
  try {
    url = new URL(value);
  } catch {
    fail(`${path} must be an HTTPS googleusercontent.com URL`);
  }
  if (
    url.protocol !== "https:" ||
    !(url.hostname === "googleusercontent.com" || url.hostname.endsWith(".googleusercontent.com"))
  ) {
    fail(`${path} must be an HTTPS googleusercontent.com URL`);
  }
}

function countOccurrences(value, marker) {
  let count = 0;
  let from = 0;
  while (true) {
    const index = value.indexOf(marker, from);
    if (index === -1) return count;
    count += 1;
    from = index + marker.length;
  }
}

export function parseManifest(markdown, { phase } = {}) {
  if (phase !== "source" && phase !== "final") {
    fail('phase must be exactly "source" or "final"');
  }
  if (typeof markdown !== "string") {
    fail("SOURCE.md content must be a string");
  }
  if (
    countOccurrences(markdown, CHANNEL_ART_MANIFEST_START) !== 1 ||
    countOccurrences(markdown, CHANNEL_ART_MANIFEST_END) !== 1
  ) {
    fail("SOURCE.md must contain exactly one bounded JSON block");
  }

  const start = markdown.indexOf(CHANNEL_ART_MANIFEST_START) + CHANNEL_ART_MANIFEST_START.length;
  const end = markdown.indexOf(CHANNEL_ART_MANIFEST_END);
  if (end < start) fail("manifest end marker must follow its start marker");

  let manifest;
  try {
    manifest = JSON.parse(markdown.slice(start, end).trim());
  } catch (error) {
    fail(`bounded block must contain valid JSON (${error.message})`);
  }

  requireRecord(manifest, "root");
  if (manifest.schemaVersion !== 1) fail("schemaVersion must be exactly 1");
  if (!Array.isArray(manifest.channels) || manifest.channels.length !== CHANNEL_ART.length) {
    fail(`channels must contain exactly ${CHANNEL_ART.length} entries`);
  }

  for (const [index, descriptor] of CHANNEL_ART.entries()) {
    const channel = manifest.channels[index];
    const path = `channels[${index}]`;
    requireRecord(channel, path);
    if (channel.handle !== descriptor.handle) {
      fail(`${path}.handle must be ${descriptor.handle}; channel order and identities are fixed`);
    }
    if (channel.name !== descriptor.name) fail(`${path}.name must be ${descriptor.name}`);
    if (channel.channelUrl !== descriptor.channelUrl) {
      fail(`${path}.channelUrl must be the exact HTTPS YouTube channel URL ${descriptor.channelUrl}`);
    }
    requireCapturedImageUrl(channel.capturedImageUrl, `${path}.capturedImageUrl`);
    requireDate(channel.retrievedAt, `${path}.retrievedAt`);

    requireRecord(channel.relationship, `${path}.relationship`);
    requireNonEmptyString(channel.relationship.basis, `${path}.relationship.basis`);
    requireDate(channel.relationship.date, `${path}.relationship.date`);
    requireNonEmptyString(channel.relationship.evidence, `${path}.relationship.evidence`);

    requireRecord(channel.permission, `${path}.permission`);
    if (channel.permission.status !== "cleared") {
      fail(`${path}.permission.status must be exactly cleared`);
    }
    requireNonEmptyString(channel.permission.grantor, `${path}.permission.grantor`);
    requireDate(channel.permission.grantedAt, `${path}.permission.grantedAt`);
    requireNonEmptyString(channel.permission.scope, `${path}.permission.scope`);
    requireNonEmptyString(channel.permission.evidence, `${path}.permission.evidence`);

    requireRecord(channel.original, `${path}.original`);
    if (channel.original.path !== descriptor.originalPath) {
      fail(`${path}.original.path must be ${descriptor.originalPath}`);
    }
    if (channel.original.width !== SOURCE_SIZE || channel.original.height !== SOURCE_SIZE) {
      fail(`${path}.original must be exactly ${SOURCE_SIZE}x${SOURCE_SIZE}`);
    }
    requireSha256(channel.original.sha256, `${path}.original.sha256`);

    requireRecord(channel.served, `${path}.served`);
    if (channel.served.path !== descriptor.servedPath) {
      fail(`${path}.served.path must be ${descriptor.servedPath}`);
    }
    if (channel.served.width !== SERVED_SIZE || channel.served.height !== SERVED_SIZE) {
      fail(`${path}.served must be exactly ${SERVED_SIZE}x${SERVED_SIZE}`);
    }
    if (channel.served.maxBytes !== MAX_SERVED_BYTES) {
      fail(`${path}.served.maxBytes must be exactly ${MAX_SERVED_BYTES}`);
    }

    if (phase === "source") {
      if (channel.served.bytes !== null || channel.served.sha256 !== null) {
        fail(`${path}.served bytes and sha256 must be null in the source phase`);
      }
    } else {
      if (
        !Number.isInteger(channel.served.bytes) ||
        channel.served.bytes <= 0 ||
        channel.served.bytes > MAX_SERVED_BYTES
      ) {
        fail(`${path}.served.bytes must be a positive integer no larger than ${MAX_SERVED_BYTES}`);
      }
      requireSha256(channel.served.sha256, `${path}.served.sha256`);
    }
  }

  return manifest;
}

export async function buildDerivative(inputPath, outputPath) {
  const metadata = await sharp(inputPath).metadata();
  if (metadata.format !== "jpeg") {
    throw new Error(`Channel artwork source must be JPEG, received ${metadata.format ?? "unknown"}`);
  }
  if (metadata.width !== SOURCE_SIZE || metadata.height !== SOURCE_SIZE) {
    throw new Error(
      `Channel artwork source must be exactly ${SOURCE_SIZE}x${SOURCE_SIZE}, received ${metadata.width}x${metadata.height}`,
    );
  }

  await mkdir(dirname(outputPath), { recursive: true });
  const result = await sharp(inputPath)
    .rotate()
    .toColourspace("srgb")
    .resize(SERVED_SIZE, SERVED_SIZE, { fit: "fill" })
    .webp({ quality: 88, effort: 6, smartSubsample: true })
    .toFile(outputPath);

  if (result.size > MAX_SERVED_BYTES) {
    await unlink(outputPath);
    throw new Error(
      `Channel artwork derivative is ${result.size} bytes, exceeding ${MAX_SERVED_BYTES} bytes`,
    );
  }

  return result;
}

export function replaceManifest(markdown, manifest) {
  const start = markdown.indexOf(CHANNEL_ART_MANIFEST_START);
  const end = markdown.indexOf(CHANNEL_ART_MANIFEST_END);
  if (
    start === -1 ||
    end === -1 ||
    countOccurrences(markdown, CHANNEL_ART_MANIFEST_START) !== 1 ||
    countOccurrences(markdown, CHANNEL_ART_MANIFEST_END) !== 1 ||
    end < start
  ) {
    fail("SOURCE.md must contain exactly one ordered bounded JSON block");
  }

  return `${markdown.slice(0, start + CHANNEL_ART_MANIFEST_START.length)}\n${JSON.stringify(
    manifest,
    null,
    2,
  )}\n${markdown.slice(end)}`;
}

export async function writeFileAtomically(path, contents) {
  const temporaryPath = `${path}.tmp-${process.pid}-${randomUUID()}`;
  try {
    await writeFile(temporaryPath, contents, "utf8");
    await rename(temporaryPath, path);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

export async function buildChannelAssets({
  root = process.cwd(),
  manifestPath = "brand/reference/channels/SOURCE.md",
  finalize = false,
  buildDerivativeFn = buildDerivative,
  writeManifestFn = writeFileAtomically,
} = {}) {
  const absoluteManifestPath = join(root, manifestPath);
  const markdown = await readFile(absoluteManifestPath, "utf8");
  const phase = finalize ? "source" : "final";
  const manifest = parseManifest(markdown, { phase });
  const finalized = finalize ? structuredClone(manifest) : manifest;

  for (const [index, channel] of manifest.channels.entries()) {
    const inputPath = join(root, channel.original.path);
    const outputPath = join(root, channel.served.path);
    const originalBytes = await readFile(inputPath);
    if (sha256(originalBytes) !== channel.original.sha256) {
      throw new Error(`Original checksum mismatch for ${channel.handle}`);
    }

    await buildDerivativeFn(inputPath, outputPath);
    const servedBytes = await readFile(outputPath);
    const measurement = {
      bytes: servedBytes.byteLength,
      sha256: sha256(servedBytes),
    };
    if (measurement.bytes > MAX_SERVED_BYTES) {
      throw new Error(
        `Derivative for ${channel.handle} is ${measurement.bytes} bytes, exceeding ${MAX_SERVED_BYTES}`,
      );
    }

    if (finalize) {
      finalized.channels[index].served.bytes = measurement.bytes;
      finalized.channels[index].served.sha256 = measurement.sha256;
    } else if (
      measurement.bytes !== channel.served.bytes ||
      measurement.sha256 !== channel.served.sha256
    ) {
      throw new Error(`Regenerated derivative does not match final manifest for ${channel.handle}`);
    }
  }

  if (finalize) {
    const finalizedMarkdown = replaceManifest(markdown, finalized);
    parseManifest(finalizedMarkdown, { phase: "final" });
    await writeManifestFn(absoluteManifestPath, finalizedMarkdown);
  }

  return finalized;
}
