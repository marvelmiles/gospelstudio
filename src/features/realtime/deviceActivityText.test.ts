import { describe, expect, it } from "vitest";
import type {
  DeviceActivity,
  PresentDevice,
} from "@/contracts/realtimeContract";
import {
  liveTransitionsOf,
  platformListOf,
  platformNameOf,
} from "./deviceActivityText";

const LIVE: DeviceActivity = {
  liveStream: {
    status: "live",
    startedAt: "2026-11-27T09:00:00.000Z",
    platforms: [
      { platform: "youtube", state: "live" },
      { platform: "facebook", state: "live" },
    ],
  },
  recording: null,
};

const IDLE: DeviceActivity = { liveStream: null, recording: null };

const device = (
  sessionId: string,
  activity: DeviceActivity = IDLE,
): PresentDevice => ({
  sessionId,
  deviceName: sessionId === "laptop" ? "Sanctuary laptop" : "Phone",
  connectedAt: "2026-11-27T08:00:00.000Z",
  activity,
});

describe("device activity text", () => {
  it("names platforms the way people know them", () => {
    expect(platformNameOf("youtube")).toBe("YouTube");
    expect(platformNameOf("not-a-platform")).toBe("a streaming service");
    expect(platformListOf(LIVE.liveStream ?? { platforms: [] })).toBe(
      "YouTube and Facebook",
    );
    expect(
      platformListOf({
        platforms: [
          { platform: "youtube", state: "live" },
          { platform: "youtube", state: "live" },
          { platform: "x", state: "live" },
          { platform: "twitch", state: "live" },
        ],
      }),
    ).toBe("YouTube, X and Twitch");
  });

  it("announces another device going live and ending its stream", () => {
    expect(
      liveTransitionsOf([device("laptop")], [device("laptop", LIVE)], "phone"),
    ).toEqual(["Sanctuary laptop is live on YouTube and Facebook."]);
    expect(
      liveTransitionsOf([device("laptop", LIVE)], [device("laptop")], "phone"),
    ).toEqual(["Sanctuary laptop ended its live stream."]);
    expect(liveTransitionsOf([device("laptop", LIVE)], [], "phone")).toEqual([
      "Sanctuary laptop went offline during its live stream.",
    ]);
  });

  it("stays quiet about this device and about streams that keep going", () => {
    expect(
      liveTransitionsOf([device("laptop")], [device("laptop", LIVE)], "laptop"),
    ).toEqual([]);
    expect(
      liveTransitionsOf(
        [device("laptop", LIVE)],
        [device("laptop", LIVE)],
        "phone",
      ),
    ).toEqual([]);
  });
});
