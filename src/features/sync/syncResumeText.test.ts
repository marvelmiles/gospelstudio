import { describe, expect, it } from "vitest";
import { syncResumeTextOf } from "./syncResumeText";

describe("sync resume question", () => {
  it("asks a device joining the account to add its library", () => {
    expect(syncResumeTextOf("joining", 12)).toEqual({
      title: "Sync this device?",
      message:
        "Add 12 items from this device to your account and bring your library here.",
    });
  });

  it("asks before sending what changed while signed out or offline", () => {
    expect(syncResumeTextOf("signed-out", 1).message).toBe(
      "You changed 1 item on this device while you were signed out. Sync them to your account and your other devices now?",
    );
    expect(syncResumeTextOf("offline", 3)).toEqual({
      title: "Back online. Continue syncing?",
      message:
        "You changed 3 items while this device was offline. Sync them to your account and your other devices now?",
    });
  });
});
