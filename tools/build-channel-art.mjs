import { pathToFileURL } from "node:url";

import { buildChannelAssets } from "./lib/channel-art.mjs";

export async function main({
  argv = process.argv.slice(2),
  root = process.cwd(),
  buildChannelAssetsFn = buildChannelAssets,
  log = console.log,
} = {}) {
  if (argv.length > 1 || (argv.length === 1 && argv[0] !== "--finalize")) {
    throw new Error("Usage: node tools/build-channel-art.mjs [--finalize]");
  }

  const finalize = argv[0] === "--finalize";
  const result = await buildChannelAssetsFn({ root, finalize });
  log(
    `${finalize ? "Finalized" : "Built"} ${result.channels.length} channel artwork derivatives.`,
  );
  return result;
}

const isDirectExecution =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectExecution) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
