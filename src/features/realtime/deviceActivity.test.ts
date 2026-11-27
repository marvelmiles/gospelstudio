import { describe, expect, it } from "vitest";
import { deviceActivityOf } from "./deviceActivity";

const STARTED_AT_MS = Date.parse("2026-11-27T09:00:00.000Z");
const FIVE_SECONDS_MS = 5000;

const asServerTime = (localMs: number): string =>
  new Date(localMs + FIVE_SECONDS_MS).toISOString();

const IDLE_LIVE = {
  phase: "idle" as const,
  startedAt: null,
  relay: null,
  includedDestinationIds: [],
};

const IDLE_RECORDING = {
  status: "idle" as const,
  elapsedMs: 0,
  runningSince: null,
};

const DESTINATIONS = [
  { id: "yt", platform: "youtube" as const },
  { id: "fb", platform: "facebook" as const },
  { id: "tw", platform: "twitch" as const },
];

describe("device activity", () => {
  it("shares nothing when this device is neither live nor recording", () => {
    expect(
      deviceActivityOf({
        live: IDLE_LIVE,
        destinations: DESTINATIONS,
        recording: IDLE_RECORDING,
        toServerTime: asServerTime,
      }),
    ).toEqual({ liveStream: null, recording: null });
  });

  it("shares the platforms in the stream and how each one is going", () => {
    const { liveStream } = deviceActivityOf({
      live: {
        phase: "live",
        startedAt: STARTED_AT_MS,
        includedDestinationIds: ["yt", "fb"],
        relay: {
          sessionId: "a".repeat(43),
          ingest: "receiving",
          receivedKbps: 4500,
          destinations: [
            { id: "yt", state: "live", error: null, retries: 0 },
            { id: "fb", state: "retrying", error: "timeout", retries: 2 },
          ],
        },
      },
      destinations: DESTINATIONS,
      recording: IDLE_RECORDING,
      toServerTime: asServerTime,
    });
    expect(liveStream).toEqual({
      status: "live",
      startedAt: "2026-11-27T09:00:05.000Z",
      platforms: [
        { platform: "youtube", state: "live" },
        { platform: "facebook", state: "problem" },
      ],
    });
  });

  it("treats a platform the relay has not reported yet as connecting", () => {
    const { liveStream } = deviceActivityOf({
      live: {
        phase: "starting",
        startedAt: null,
        includedDestinationIds: ["tw"],
        relay: null,
      },
      destinations: DESTINATIONS,
      recording: IDLE_RECORDING,
      toServerTime: asServerTime,
    });
    expect(liveStream).toEqual({
      status: "starting",
      startedAt: null,
      platforms: [{ platform: "twitch", state: "connecting" }],
    });
  });

  it("shares a recording's running time on the server clock", () => {
    const { recording } = deviceActivityOf({
      live: IDLE_LIVE,
      destinations: DESTINATIONS,
      recording: {
        status: "recording",
        elapsedMs: 1234.6,
        runningSince: STARTED_AT_MS,
      },
      toServerTime: asServerTime,
    });
    expect(recording).toEqual({
      status: "recording",
      elapsedMs: 1235,
      runningSince: "2026-11-27T09:00:05.000Z",
    });
  });
});
