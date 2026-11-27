import { describe, expect, it } from "vitest";
import { measureClockOffset } from "./syncClock";

const SENT_AT_MS = Date.parse("2026-11-27T10:00:00.000Z");

describe("clock offset", () => {
  it("measures how far the server's clock is ahead, from the round trip midpoint", () => {
    expect(
      measureClockOffset({
        serverTime: "2026-11-27T10:05:00.200Z",
        sentAtMs: SENT_AT_MS,
        receivedAtMs: SENT_AT_MS + 400,
      }),
    ).toBe(5 * 60 * 1000);
  });

  it("measures a device clock that runs fast as a negative offset", () => {
    expect(
      measureClockOffset({
        serverTime: "2026-11-27T09:58:00.050Z",
        sentAtMs: SENT_AT_MS,
        receivedAtMs: SENT_AT_MS + 100,
      }),
    ).toBe(-2 * 60 * 1000);
  });

  it("does not trust a slow answer or an unreadable time", () => {
    expect(
      measureClockOffset({
        serverTime: "2026-11-27T10:00:05.000Z",
        sentAtMs: SENT_AT_MS,
        receivedAtMs: SENT_AT_MS + 11_000,
      }),
    ).toBeNull();
    expect(
      measureClockOffset({
        serverTime: "later",
        sentAtMs: SENT_AT_MS,
        receivedAtMs: SENT_AT_MS + 50,
      }),
    ).toBeNull();
  });
});
