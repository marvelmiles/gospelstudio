import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { WebSocket } from "ws";
import {
  aacSequenceHeaderData,
  avcSequenceHeaderData,
  avcVideoData,
  createFlvHeader,
  encodeFlvTag,
  FLV_TAG_AUDIO,
  FLV_TAG_VIDEO,
} from "../../src/features/liveStream/lib/flv";
import {
  INGEST_CLOSE_CODES,
  type RelayMessage,
} from "../../src/features/liveStream/lib/liveRelayContract";
import type { RelayEnv } from "./config/relayEnv";
import { silentLogger } from "./logger";
import { createRelayServer, type RelayServer } from "./relayServer";
import { fakeLauncher } from "./testing/fakeMediaProcess";

const APP_ORIGIN = "https://gospelstudio.app";
const YOUTUBE = "rtmps://a.rtmps.youtube.com/live2/abcd-efgh-ijkl-mnop";
const FACEBOOK = "rtmps://live-api-s.facebook.com:443/rtmp/FB-123-0-AbCdEf";

const ENV: RelayEnv = {
  PORT: 0,
  HOST: "127.0.0.1",
  ALLOWED_ORIGINS: [APP_ORIGIN],
  FFMPEG_PATH: undefined,
  MAX_SESSIONS: 2,
  MAX_INGEST_KBPS: 12_000,
  TRUST_PROXY_HOPS: 0,
  ALLOW_PRIVATE_DESTINATIONS: false,
};

const DNS: Record<string, string[]> = {
  "a.rtmps.youtube.com": ["142.250.1.1"],
  "live-api-s.facebook.com": ["157.240.1.1"],
  "sneaky.example.com": ["10.0.0.7"],
};

let relay: RelayServer | null = null;

afterEach(async () => {
  await relay?.close();
  relay = null;
});

const start = async (env: Partial<RelayEnv> = {}) => {
  const launcher = fakeLauncher();
  relay = createRelayServer({
    env: { ...ENV, ...env },
    startProcess: launcher.startProcess,
    logger: silentLogger,
    resolveHost: async (host) => {
      const addresses = DNS[host];
      if (!addresses) throw new Error("ENOTFOUND");
      return addresses;
    },
  });
  await new Promise<void>((resolve) =>
    relay?.server.listen(0, "127.0.0.1", resolve),
  );
  const { port } = relay.server.address() as AddressInfo;
  return { base: `http://127.0.0.1:${port}`, port, launcher };
};

const call = (
  base: string,
  path: string,
  init: RequestInit & { token?: string } = {},
) =>
  fetch(`${base}${path}`, {
    ...init,
    headers: {
      Origin: APP_ORIGIN,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
      ...init.headers,
    },
  });

const createSession = async (base: string) => {
  const response = await call(base, "/v1/sessions", { method: "POST" });
  return (
    (await response.json()) as { data: { sessionId: string; token: string } }
  ).data;
};

const errorCode = async (response: Response) =>
  ((await response.json()) as { error: { code: string } }).error.code;

const putDestinations = (
  base: string,
  session: { sessionId: string; token: string },
  destinations: { id: string; url: string }[],
) =>
  call(base, `/v1/sessions/${session.sessionId}/destinations`, {
    method: "PUT",
    token: session.token,
    body: JSON.stringify({ destinations }),
  });

const openIngest = (port: number, sessionId: string, origin = APP_ORIGIN) =>
  new WebSocket(`ws://127.0.0.1:${port}/v1/sessions/${sessionId}/ingest`, {
    headers: { Origin: origin },
  });

const nextMessage = (socket: WebSocket, type: RelayMessage["type"]) =>
  new Promise<RelayMessage>((resolve) => {
    const listen = (data: Buffer) => {
      const message = JSON.parse(data.toString()) as RelayMessage;
      if (message.type !== type) return;
      socket.off("message", listen);
      resolve(message);
    };
    socket.on("message", listen);
  });

const closeCode = (socket: WebSocket) =>
  new Promise<number>((resolve) =>
    socket.once("close", (code) => resolve(code)),
  );

const mediaStart = (): Buffer =>
  Buffer.concat([
    createFlvHeader(),
    encodeFlvTag(
      FLV_TAG_VIDEO,
      0,
      avcSequenceHeaderData(new Uint8Array([1, 100, 0, 31])),
    ),
    encodeFlvTag(
      FLV_TAG_AUDIO,
      0,
      aacSequenceHeaderData(new Uint8Array([0x11, 0x90])),
    ),
    encodeFlvTag(
      FLV_TAG_VIDEO,
      0,
      avcVideoData(new Uint8Array([0, 0, 0, 1, 0x65]), true),
    ),
  ]);

const waitFor = async (check: () => boolean) => {
  for (let attempt = 0; attempt < 100 && !check(); attempt += 1)
    await new Promise((resolve) => setTimeout(resolve, 10));
  expect(check()).toBe(true);
};

describe("relay HTTP API", () => {
  it("creates a session with a private key and never caches it", async () => {
    const { base } = await start();
    const response = await call(base, "/v1/sessions", { method: "POST" });
    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("access-control-allow-origin")).toBe(
      APP_ORIGIN,
    );
    const { data } = (await response.json()) as {
      data: { sessionId: string; token: string };
    };
    expect(data.sessionId).toMatch(/^[A-Za-z0-9_-]{16,}$/);
    expect(data.token.length).toBeGreaterThanOrEqual(32);
  });

  it("says when the server is full instead of failing silently", async () => {
    const { base } = await start();
    await createSession(base);
    await createSession(base);
    const response = await call(base, "/v1/sessions", { method: "POST" });
    expect(response.status).toBe(503);
    expect(await errorCode(response)).toBe("capacity_reached");
  });

  it("only serves the sites it is set up for", async () => {
    const { base } = await start();
    const foreign = await call(base, "/v1/sessions", {
      method: "POST",
      headers: { Origin: "https://evil.example" },
    });
    expect(foreign.status).toBe(403);
    expect(foreign.headers.get("access-control-allow-origin")).toBe(
      "https://evil.example",
    );
    const refusal = (await foreign.json()) as { error: { message: string } };
    expect(refusal.error.message).toContain("ALLOWED_ORIGINS");
    expect(relay?.registry.size).toBe(0);
    const preflight = await call(base, "/v1/sessions", { method: "OPTIONS" });
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get("access-control-allow-headers")).toContain(
      "Authorization",
    );
  });

  it("keeps sessions private to whoever holds the key", async () => {
    const { base } = await start();
    const session = await createSession(base);
    const path = `/v1/sessions/${session.sessionId}`;
    const missing = await call(base, path);
    const wrong = await call(base, path, { token: "x".repeat(43) });
    const unknown = await call(base, `/v1/sessions/${"a".repeat(22)}`, {
      token: session.token,
    });
    const right = await call(base, path, { token: session.token });
    expect(missing.status).toBe(401);
    expect(missing.headers.get("www-authenticate")).toContain("Bearer");
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(404);
    expect(right.status).toBe(200);
  });

  it("validates destinations and blocks local or internal servers", async () => {
    const { base } = await start();
    const session = await createSession(base);
    const cases: [{ id: string; url: string }[], number, string][] = [
      [
        [{ id: "a", url: "https://youtube.com/live2/key1" }],
        400,
        "invalid_request",
      ],
      [
        [{ id: "a", url: "rtmp://127.0.0.1/live/key1" }],
        422,
        "destination_not_allowed",
      ],
      [
        [{ id: "a", url: "rtmp://sneaky.example.com/live/key1" }],
        422,
        "destination_not_allowed",
      ],
      [
        [{ id: "a", url: "rtmp://unknown.example.com/live/key1" }],
        422,
        "destination_not_allowed",
      ],
      [
        [
          { id: "a", url: YOUTUBE },
          { id: "a", url: FACEBOOK },
        ],
        400,
        "invalid_request",
      ],
    ];
    for (const [destinations, status, code] of cases) {
      const response = await putDestinations(base, session, destinations);
      expect(response.status, JSON.stringify(destinations)).toBe(status);
      expect(await errorCode(response)).toBe(code);
    }
    const notJson = await call(
      base,
      `/v1/sessions/${session.sessionId}/destinations`,
      {
        method: "PUT",
        token: session.token,
        headers: { "Content-Type": "text/plain" },
        body: "youtube",
      },
    );
    expect(notJson.status).toBe(415);
  });

  it("accepts real platforms and reports them waiting for the studio's picture", async () => {
    const { base, launcher } = await start();
    const session = await createSession(base);
    const response = await putDestinations(base, session, [
      { id: "yt", url: YOUTUBE },
      { id: "fb", url: FACEBOOK },
    ]);
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).not.toContain("abcd-efgh-ijkl-mnop");
    const { data } = JSON.parse(text) as {
      data: { destinations: { id: string; state: string }[] };
    };
    expect(data.destinations.map((item) => [item.id, item.state])).toEqual([
      ["yt", "waiting"],
      ["fb", "waiting"],
    ]);
    expect(launcher.started).toHaveLength(0);
  });

  it("names the allowed methods", async () => {
    const { base } = await start();
    const response = await call(base, "/v1/sessions");
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
  });
});

describe("relay ingest", () => {
  it("refuses a connection from another site", async () => {
    const { base, port } = await start();
    const session = await createSession(base);
    const socket = openIngest(port, session.sessionId, "https://evil.example");
    const error = await new Promise<Error>((resolve) =>
      socket.once("error", resolve),
    );
    expect(error.message).toMatch(/403/);
  });

  it("closes a connection that does not sign in with the session key", async () => {
    const { base, port } = await start();
    const session = await createSession(base);
    const socket = openIngest(port, session.sessionId);
    socket.once("open", () =>
      socket.send(JSON.stringify({ type: "auth", token: "y".repeat(43) })),
    );
    expect(await closeCode(socket)).toBe(INGEST_CLOSE_CODES.unauthorized);
  });

  it("starts every platform on the first key frame and streams the same FLV to each", async () => {
    const { base, port, launcher } = await start();
    const session = await createSession(base);
    await putDestinations(base, session, [
      { id: "yt", url: YOUTUBE },
      { id: "fb", url: FACEBOOK },
    ]);
    const socket = openIngest(port, session.sessionId);
    const ready = nextMessage(socket, "ready");
    socket.once("open", () =>
      socket.send(JSON.stringify({ type: "auth", token: session.token })),
    );
    await ready;

    socket.send(mediaStart());
    await waitFor(() => launcher.started.length === 2);
    await waitFor(() =>
      launcher.started.every((process) => process.received.length > 0),
    );
    for (const process of launcher.started) {
      const output = Buffer.concat(process.received);
      expect(output.subarray(0, 3).toString()).toBe("FLV");
      expect(output.byteLength).toBe(mediaStart().byteLength);
    }
    expect(
      launcher.started.map((process) => process.args.at(-1)).sort(),
    ).toEqual([FACEBOOK, YOUTUBE].sort());

    const status = nextMessage(socket, "status");
    launcher.started[0].reportProgress(1_000_000);
    const message = await status;
    expect(message.type === "status" && message.session.ingest).toBe(
      "receiving",
    );
    socket.close();
  });

  it("restarts platforms cleanly when the studio reconnects, and ends on DELETE", async () => {
    const { base, port, launcher } = await start();
    const session = await createSession(base);
    await putDestinations(base, session, [{ id: "yt", url: YOUTUBE }]);

    const connect = async () => {
      const socket = openIngest(port, session.sessionId);
      const ready = nextMessage(socket, "ready");
      socket.once("open", () =>
        socket.send(JSON.stringify({ type: "auth", token: session.token })),
      );
      await ready;
      return socket;
    };

    const first = await connect();
    first.send(mediaStart());
    await waitFor(() => launcher.started.length === 1);

    const firstClosed = closeCode(first);
    const second = await connect();
    expect(await firstClosed).toBe(INGEST_CLOSE_CODES.replaced);
    second.send(mediaStart());
    await waitFor(() => launcher.started.length === 2);
    expect(launcher.started[0].isStopped).toBe(true);

    const secondClosed = closeCode(second);
    const ended = await call(base, `/v1/sessions/${session.sessionId}`, {
      method: "DELETE",
      token: session.token,
    });
    expect(ended.status).toBe(200);
    expect(await secondClosed).toBe(INGEST_CLOSE_CODES.sessionEnded);
    expect(launcher.started[1].isStopped).toBe(true);
    const after = await call(base, `/v1/sessions/${session.sessionId}`, {
      token: session.token,
    });
    expect(after.status).toBe(404);
  });

  it("drops a stream that is not FLV", async () => {
    const { base, port } = await start();
    const session = await createSession(base);
    const socket = openIngest(port, session.sessionId);
    const ready = nextMessage(socket, "ready");
    socket.once("open", () =>
      socket.send(JSON.stringify({ type: "auth", token: session.token })),
    );
    await ready;
    const closed = closeCode(socket);
    socket.send(Buffer.from("this is definitely not a video stream"));
    expect(await closed).toBe(INGEST_CLOSE_CODES.invalidMedia);
  });
});
