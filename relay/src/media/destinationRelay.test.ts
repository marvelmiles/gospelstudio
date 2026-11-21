import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeLauncher } from "../testing/fakeMediaProcess";
import { DestinationRelay, describeFailure } from "./destinationRelay";

const KEY = "abcd-efgh-ijkl-mnop";
const URL = `rtmps://a.rtmps.youtube.com/live2/${KEY}`;

const flush = () => new Promise((resolve) => setImmediate(resolve));

const setup = () => {
  const launcher = fakeLauncher();
  const attached = new Set<string>();
  const onChange = vi.fn();
  let time = 0;
  const relay = new DestinationRelay({
    id: "youtube",
    url: URL,
    startProcess: launcher.startProcess,
    attachSink: (id) => attached.add(id),
    detachSink: (id) => attached.delete(id),
    onChange,
    now: () => time,
  });
  return {
    relay,
    launcher,
    attached,
    onChange,
    advance: (ms: number) => {
      time += ms;
    },
  };
};

describe("destination relay", () => {
  beforeEach(() =>
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] }),
  );
  afterEach(() => vi.useRealTimers());

  it("waits until started, then connects and goes live when FFmpeg writes", async () => {
    const { relay, launcher, attached } = setup();
    expect(relay.snapshot().state).toBe("waiting");

    relay.start();
    expect(relay.snapshot().state).toBe("connecting");
    expect(attached.has("youtube")).toBe(true);
    expect(launcher.started[0].args.at(-1)).toBe(URL);
    expect(launcher.started[0].args).toEqual(
      expect.arrayContaining(["-c", "copy", "-f", "flv"]),
    );

    launcher.started[0].reportProgress(0);
    await flush();
    expect(relay.snapshot().state).toBe("connecting");
    launcher.started[0].reportProgress(1_000_000);
    await flush();
    expect(relay.snapshot().state).toBe("live");
  });

  it("retries with growing delays and explains the failure without the key", async () => {
    const { relay, launcher } = setup();
    relay.start();
    launcher.started[0].fail(`[flv] ${URL}: Input/output error\n`);
    await flush();
    const snapshot = relay.snapshot();
    expect(snapshot.state).toBe("retrying");
    expect(snapshot.retries).toBe(1);
    expect(snapshot.error).toMatch(/stream key/);
    expect(JSON.stringify(snapshot)).not.toContain(KEY);

    vi.advanceTimersByTime(1999);
    expect(launcher.started).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(launcher.started).toHaveLength(2);

    launcher.started[1].fail("Connection refused\n");
    await flush();
    vi.advanceTimersByTime(3999);
    expect(launcher.started).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(launcher.started).toHaveLength(3);
  });

  it("gives up after repeated failures that never went live, until asked again", async () => {
    const { relay, launcher } = setup();
    relay.start();
    for (let attempt = 0; attempt < 6; attempt += 1) {
      launcher.started.at(-1)?.fail("Input/output error\n");
      await flush();
      vi.runOnlyPendingTimers();
    }
    expect(relay.snapshot().state).toBe("failed");
    const attempts = launcher.started.length;
    vi.advanceTimersByTime(60_000);
    expect(launcher.started).toHaveLength(attempts);

    relay.retryNow();
    expect(launcher.started).toHaveLength(attempts + 1);
    expect(relay.snapshot()).toMatchObject({
      state: "connecting",
      error: null,
    });
  });

  it("forgets earlier failures once a platform has been live for a while", async () => {
    const { relay, launcher, advance } = setup();
    relay.start();
    for (let attempt = 0; attempt < 4; attempt += 1) {
      launcher.started.at(-1)?.fail("Connection refused\n");
      await flush();
      vi.runOnlyPendingTimers();
    }
    const current = launcher.started.at(-1);
    current?.reportProgress(500_000);
    await flush();
    advance(25_000);
    current?.reportProgress(25_000_000);
    await flush();
    current?.fail("Connection reset by peer\n");
    await flush();
    expect(relay.snapshot().state).toBe("retrying");
    vi.advanceTimersByTime(2000);
    expect(launcher.started.at(-1)).not.toBe(current);
  });

  it("stops FFmpeg and never restarts once stopped", async () => {
    const { relay, launcher, attached } = setup();
    relay.start();
    relay.stop();
    expect(launcher.started[0].isStopped).toBe(true);
    expect(attached.size).toBe(0);
    vi.advanceTimersByTime(60_000);
    expect(launcher.started).toHaveLength(1);
  });

  it("restarts with a fresh FFmpeg when the studio's stream restarts", () => {
    const { relay, launcher } = setup();
    relay.start();
    relay.start();
    expect(launcher.started).toHaveLength(2);
    expect(launcher.started[0].isStopped).toBe(true);
    expect(relay.snapshot().retries).toBe(0);
  });
});

describe("failure descriptions", () => {
  it("redacts stream keys from unknown FFmpeg errors", () => {
    expect(
      describeFailure(`Something odd happened with ${URL}`, 1),
    ).not.toContain(KEY);
  });

  it("falls back to the exit code when FFmpeg printed nothing", () => {
    expect(describeFailure("", 183)).toMatch(/183/);
  });
});
