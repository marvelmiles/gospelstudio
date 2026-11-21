import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync, statSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ffmpegPath from "ffmpeg-static";
import { afterAll, describe, expect, it } from "vitest";
import { WebSocket } from "ws";
import type {
  RelayMessage,
  SessionSnapshot,
} from "../../src/features/liveStream/lib/liveRelayContract";
import { silentLogger } from "./logger";
import { createFfmpegLauncher } from "./media/mediaProcess";
import { createRelayServer } from "./relayServer";

const APP_ORIGIN = "https://gospelstudio.app";
const SOURCE_SECONDS = 6;
const workDir = mkdtempSync(join(tmpdir(), "relay-e2e-"));
const children: ChildProcess[] = [];

afterAll(() => {
  for (const child of children) child.kill("SIGKILL");
  rmSync(workDir, { recursive: true, force: true });
});

const run = (args: string[]) => {
  const child = spawn(ffmpegPath as string, args, { windowsHide: true });
  children.push(child);
  let stderr = "";
  child.stderr?.on("data", (chunk: Buffer) => (stderr += chunk.toString()));
  const exited = new Promise<number | null>((resolve) =>
    child.once("close", (code) => resolve(code)),
  );
  return { child, exited, stderr: () => stderr };
};

const freePort = async (): Promise<number> => {
  const { createServer } = await import("node:net");
  return new Promise((resolve) => {
    const server = createServer();
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      server.close(() => resolve(port));
    });
  });
};

const startPlatform = async (name: string) => {
  const port = await freePort();
  const file = join(workDir, `${name}.flv`);
  const listener = run([
    "-hide_banner",
    "-loglevel",
    "error",
    "-listen",
    "1",
    "-i",
    `rtmp://127.0.0.1:${port}/live/${name}-secret-key`,
    "-c",
    "copy",
    "-f",
    "flv",
    file,
  ]);
  await new Promise((resolve) => setTimeout(resolve, 700));
  return {
    url: `rtmp://127.0.0.1:${port}/live/${name}-secret-key`,
    file,
    listener,
  };
};

const probe = async (file: string) => {
  const result = run(["-hide_banner", "-i", file, "-f", "null", "-"]);
  await result.exited;
  const text = result.stderr();
  const duration = /time=(\d+):(\d+):(\d+\.\d+)/g;
  let seconds = 0;
  for (const match of text.matchAll(duration))
    seconds =
      Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
  return { text, seconds };
};

describe.skipIf(!ffmpegPath)("relay with real FFmpeg", () => {
  it("relays one H.264 and AAC stream to two RTMP platforms without re-encoding", async () => {
    const youtube = await startPlatform("youtube");
    const facebook = await startPlatform("facebook");

    const relay = createRelayServer({
      env: {
        PORT: 0,
        HOST: "127.0.0.1",
        ALLOWED_ORIGINS: [APP_ORIGIN],
        FFMPEG_PATH: ffmpegPath ?? undefined,
        MAX_SESSIONS: 5,
        MAX_INGEST_KBPS: 12_000,
        TRUST_PROXY_HOPS: 0,
        ALLOW_PRIVATE_DESTINATIONS: true,
      },
      startProcess: createFfmpegLauncher(ffmpegPath as string),
      logger: silentLogger,
    });
    await new Promise<void>((resolve) =>
      relay.server.listen(0, "127.0.0.1", resolve),
    );
    const { port } = relay.server.address() as AddressInfo;
    const base = `http://127.0.0.1:${port}`;

    const created = await fetch(`${base}/v1/sessions`, {
      method: "POST",
      headers: { Origin: APP_ORIGIN },
    });
    const { sessionId, token } = (
      (await created.json()) as { data: { sessionId: string; token: string } }
    ).data;
    const put = await fetch(`${base}/v1/sessions/${sessionId}/destinations`, {
      method: "PUT",
      headers: {
        Origin: APP_ORIGIN,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        destinations: [
          { id: "youtube", url: youtube.url },
          { id: "facebook", url: facebook.url },
        ],
      }),
    });
    expect(put.status).toBe(200);

    const socket = new WebSocket(
      `ws://127.0.0.1:${port}/v1/sessions/${sessionId}/ingest`,
      { headers: { Origin: APP_ORIGIN } },
    );
    const statuses: SessionSnapshot[] = [];
    const ready = new Promise<void>((resolve) => {
      socket.on("message", (data: Buffer) => {
        const message = JSON.parse(data.toString()) as RelayMessage;
        if (message.type === "ready") resolve();
        if (message.type === "status") statuses.push(message.session);
      });
    });
    socket.once("open", () =>
      socket.send(JSON.stringify({ type: "auth", token })),
    );
    await ready;

    const source = run([
      "-hide_banner",
      "-loglevel",
      "error",
      "-re",
      "-f",
      "lavfi",
      "-i",
      "testsrc2=size=640x360:rate=30",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=440:sample_rate=48000",
      "-t",
      String(SOURCE_SECONDS),
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-tune",
      "zerolatency",
      "-g",
      "60",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-ac",
      "2",
      "-f",
      "flv",
      "pipe:1",
    ]);
    source.child.stdout?.on("data", (chunk: Buffer) => socket.send(chunk));
    expect(await source.exited).toBe(0);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const live = statuses
      .at(-1)
      ?.destinations.map((item) => [item.id, item.state]);
    expect(live).toEqual([
      ["youtube", "live"],
      ["facebook", "live"],
    ]);

    await fetch(`${base}/v1/sessions/${sessionId}`, {
      method: "DELETE",
      headers: { Origin: APP_ORIGIN, Authorization: `Bearer ${token}` },
    });
    await Promise.all([youtube.listener.exited, facebook.listener.exited]);
    socket.close();
    await relay.close();

    for (const platform of [youtube, facebook]) {
      expect(statSync(platform.file).size).toBeGreaterThan(50_000);
      const { text, seconds } = await probe(platform.file);
      expect(text).toMatch(/Video: h264/);
      expect(text).toMatch(/Audio: aac/);
      expect(text).toMatch(/640x360/);
      expect(seconds).toBeGreaterThan(SOURCE_SECONDS - 3);
    }
  }, 60_000);
});
