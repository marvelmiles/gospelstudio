import { describe, expect, it } from "vitest";
import { destinationStatusOf } from "./destinationStatus";
import type { SessionSnapshot } from "@/contracts/liveRelay";

const relay: SessionSnapshot = {
  sessionId: "a".repeat(22),
  ingest: "receiving",
  receivedKbps: 2600,
  destinations: [
    { id: "youtube", state: "live", error: null, retries: 0 },
    {
      id: "facebook",
      state: "failed",
      error: "The platform refused the stream key.",
      retries: 6,
    },
  ],
};

describe("destination status", () => {
  it("is idle when the platform is not part of the stream", () => {
    expect(destinationStatusOf("youtube", relay, false)).toEqual({
      state: "idle",
      error: null,
    });
  });

  it("shows what the relay reports for each platform by its id", () => {
    expect(destinationStatusOf("youtube", relay, true).state).toBe("live");
    expect(destinationStatusOf("facebook", relay, true)).toEqual({
      state: "failed",
      error: "The platform refused the stream key.",
    });
  });

  it("waits until the relay has heard about a newly added platform", () => {
    expect(destinationStatusOf("twitch", relay, true).state).toBe("waiting");
    expect(destinationStatusOf("twitch", null, true).state).toBe("waiting");
  });
});
