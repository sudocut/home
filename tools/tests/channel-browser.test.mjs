import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chmod, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  CHROME_LAUNCH_ARGS,
  isAllowedProfileImageConsoleFailure,
  reserveLoopbackPort,
  resolveChromeExecutable,
  terminateChild,
  waitForHttpReady,
  withServerChild,
} from "../verify-channel-browser.mjs";

async function temporaryDirectory() {
  return mkdtemp(join(tmpdir(), "channel-browser-test-"));
}

async function fixtureHttpChild({ port, markerPath, startupDelayMs = 0 }) {
  return spawn(
    process.execPath,
    [
      "-e",
      `
        const fs = require("node:fs");
        const http = require("node:http");

        const port = Number(process.env.PORT);
        const markerPath = process.env.MARKER_PATH;
        const startupDelayMs = Number(process.env.STARTUP_DELAY_MS ?? 0);
        let server;

        function mark(reason) {
          if (markerPath) fs.writeFileSync(markerPath, JSON.stringify({ pid: process.pid, reason }));
        }

        process.on("SIGTERM", () => {
          mark("SIGTERM");
          if (server) {
            server.close(() => process.exit(0));
            setTimeout(() => process.exit(0), 250).unref();
          } else {
            process.exit(0);
          }
        });

        setTimeout(() => {
          server = http.createServer((request, response) => {
            response.writeHead(200, { "content-type": "text/plain" });
            response.end("ready");
          });
          server.listen(port, "127.0.0.1");
        }, startupDelayMs);

        setInterval(() => {}, 1000);
      `,
    ],
    {
      env: {
        ...process.env,
        MARKER_PATH: markerPath,
        PORT: String(port),
        STARTUP_DELAY_MS: String(startupDelayMs),
      },
      stdio: ["ignore", "ignore", "pipe"],
    },
  );
}

async function childExited(child, timeoutMs = 1_000) {
  if (child.exitCode !== null || child.signalCode !== null) return true;

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      cleanup();
      resolve(false);
    }, timeoutMs);
    const done = () => {
      cleanup();
      resolve(true);
    };
    const cleanup = () => {
      clearTimeout(timer);
      child.off("exit", done);
    };
    child.once("exit", done);
  });
}

test("reserveLoopbackPort returns a loopback port usable by a fixture HTTP child", async () => {
  const dir = await temporaryDirectory();
  try {
    const reservation = await reserveLoopbackPort();
    assert.equal(reservation.host, "127.0.0.1");
    assert.equal(reservation.origin, `http://127.0.0.1:${reservation.port}`);
    assert.ok(Number.isInteger(reservation.port));
    assert.ok(reservation.port > 0);

    const markerPath = join(dir, "server-marker.json");
    const child = await fixtureHttpChild({ port: reservation.port, markerPath });
    try {
      await waitForHttpReady(`${reservation.origin}/ready`, { deadlineMs: 1_000, intervalMs: 20 });
    } finally {
      await terminateChild(child, { timeoutMs: 1_000 });
    }

    const marker = JSON.parse(await readFile(markerPath, "utf8"));
    assert.equal(marker.pid, child.pid);
    assert.equal(marker.reason, "SIGTERM");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("resolveChromeExecutable prefers CHROME and then known executable candidates", async () => {
  const dir = await temporaryDirectory();
  try {
    const envChrome = join(dir, "env-chrome");
    const candidateChrome = join(dir, "candidate-chrome");
    await writeFile(envChrome, "#!/bin/sh\nexit 0\n");
    await writeFile(candidateChrome, "#!/bin/sh\nexit 0\n");
    await chmod(envChrome, 0o755);
    await chmod(candidateChrome, 0o755);

    assert.equal(
      await resolveChromeExecutable({
        env: { CHROME: envChrome },
        candidates: [candidateChrome],
      }),
      envChrome,
    );

    assert.equal(
      await resolveChromeExecutable({
        env: {},
        candidates: [join(dir, "missing"), candidateChrome],
      }),
      candidateChrome,
    );

    await assert.rejects(
      () => resolveChromeExecutable({ env: {}, candidates: [join(dir, "missing")] }),
      /Chrome|CHROME/i,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Chrome launch args include the shader probe flags", () => {
  assert.ok(CHROME_LAUNCH_ARGS.includes("--enable-unsafe-swiftshader"));
  assert.ok(CHROME_LAUNCH_ARGS.includes("--hide-scrollbars"));
  assert.ok(CHROME_LAUNCH_ARGS.includes("--force-device-scale-factor=1"));
});

test("profile-image console failures are allowed only for the expected aborted URL", () => {
  assert.equal(
    isAllowedProfileImageConsoleFailure(
      {
        location: { url: "http://127.0.0.1:4000/channels/eo_korea.webp" },
        text: "Failed to load resource: net::ERR_FAILED",
      },
      "/channels/eo_korea.webp",
    ),
    true,
  );
  assert.equal(
    isAllowedProfileImageConsoleFailure(
      {
        location: { url: "http://127.0.0.1:4000/channels/eoglobal.webp" },
        text: "Failed to load resource: net::ERR_FAILED",
      },
      "/channels/eo_korea.webp",
    ),
    false,
  );
  assert.equal(
    isAllowedProfileImageConsoleFailure(
      {
        location: { url: "http://127.0.0.1:4000/channels/eo_korea.webp" },
        text: "Application crashed",
      },
      "/channels/eo_korea.webp",
    ),
    false,
  );
});

test("waitForHttpReady polls until ready and rejects when the deadline expires", async () => {
  const dir = await temporaryDirectory();
  try {
    const reservation = await reserveLoopbackPort();
    const markerPath = join(dir, "server-marker.json");
    const child = await fixtureHttpChild({
      port: reservation.port,
      markerPath,
      startupDelayMs: 100,
    });

    try {
      await waitForHttpReady(`${reservation.origin}/ready`, { deadlineMs: 1_500, intervalMs: 20 });
    } finally {
      await terminateChild(child, { timeoutMs: 1_000 });
    }

    const unused = await reserveLoopbackPort();
    await assert.rejects(
      () => waitForHttpReady(unused.origin, { deadlineMs: 80, intervalMs: 10 }),
      /timed out|deadline|ready/i,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("withServerChild terminates only its child after callback success or failure", async () => {
  const dir = await temporaryDirectory();
  let sibling;
  try {
    const siblingReservation = await reserveLoopbackPort();
    const siblingMarker = join(dir, "sibling-marker.json");
    sibling = await fixtureHttpChild({
      port: siblingReservation.port,
      markerPath: siblingMarker,
    });
    await waitForHttpReady(siblingReservation.origin, { deadlineMs: 1_000, intervalMs: 20 });

    const successReservation = await reserveLoopbackPort();
    const successMarker = join(dir, "success-marker.json");
    let successPid;
    await withServerChild(
      {
        command: process.execPath,
        args: [
          "-e",
          `
            const fs = require("node:fs");
            const http = require("node:http");
            const server = http.createServer((request, response) => response.end("ok"));
            server.listen(Number(process.env.PORT), "127.0.0.1");
            process.on("SIGTERM", () => {
              fs.writeFileSync(process.env.MARKER_PATH, JSON.stringify({ pid: process.pid, reason: "SIGTERM" }));
              server.close(() => process.exit(0));
              setTimeout(() => process.exit(0), 250).unref();
            });
            setInterval(() => {}, 1000);
          `,
        ],
        env: {
          MARKER_PATH: successMarker,
          PORT: String(successReservation.port),
        },
        readinessUrl: successReservation.origin,
        readinessDeadlineMs: 1_000,
      },
      async (child) => {
        successPid = child.pid;
        assert.equal(await (await fetch(successReservation.origin)).text(), "ok");
      },
    );

    assert.equal(JSON.parse(await readFile(successMarker, "utf8")).pid, successPid);
    await assert.rejects(
      () => stat(siblingMarker),
      /ENOENT/,
      "sibling process should not receive SIGTERM when the target child is cleaned up",
    );
    assert.equal(sibling.exitCode, null);

    const failureReservation = await reserveLoopbackPort();
    const failureMarker = join(dir, "failure-marker.json");
    let failurePid;
    await assert.rejects(
      () =>
        withServerChild(
          {
            command: process.execPath,
            args: [
              "-e",
              `
                const fs = require("node:fs");
                const http = require("node:http");
                const server = http.createServer((request, response) => response.end("ok"));
                server.listen(Number(process.env.PORT), "127.0.0.1");
                process.on("SIGTERM", () => {
                  fs.writeFileSync(process.env.MARKER_PATH, JSON.stringify({ pid: process.pid, reason: "SIGTERM" }));
                  server.close(() => process.exit(0));
                  setTimeout(() => process.exit(0), 250).unref();
                });
                setInterval(() => {}, 1000);
              `,
            ],
            env: {
              MARKER_PATH: failureMarker,
              PORT: String(failureReservation.port),
            },
            readinessUrl: failureReservation.origin,
            readinessDeadlineMs: 1_000,
          },
          async (child) => {
            failurePid = child.pid;
            throw new Error("callback failed");
          },
        ),
      /callback failed/,
    );

    assert.equal(JSON.parse(await readFile(failureMarker, "utf8")).pid, failurePid);
    assert.equal(sibling.exitCode, null);
  } finally {
    if (sibling) {
      sibling.kill("SIGTERM");
      await childExited(sibling);
    }
    await rm(dir, { recursive: true, force: true });
  }
});
