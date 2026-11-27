import { describe, expect, it } from "vitest";
import { describeSyncStatus, describeTransfer } from "./syncStatusView";
import { EMPTY_SYNC_QUEUE, type SyncQueueSummary } from "./syncStore";

const idle = (queue: Partial<SyncQueueSummary>, live = false) =>
  describeSyncStatus({
    phase: "idle",
    queue: { ...EMPTY_SYNC_QUEUE, ...queue },
    lastSyncedAt: null,
    problem: null,
    activity: null,
    transfer: null,
    live,
  });

describe("sync status", () => {
  it("asks for attention when items failed", () => {
    expect(idle({ uploads: 3, failed: 2 })).toMatchObject({
      title: "Some items need attention",
      detail: "2 items couldn't sync. Open sync activity to see why.",
    });
  });

  it("counts only items that are still moving as waiting", () => {
    expect(idle({ uploads: 2, downloads: 2, paused: 1 }).detail).toBe(
      "3 items will sync in a moment.",
    );
  });

  it("is up to date when only paused items are left", () => {
    expect(idle({ uploads: 1, paused: 1 })).toMatchObject({
      title: "Up to date",
      detail: "1 item you paused is waiting for you.",
    });
  });

  it("mentions live updates when connected", () => {
    expect(idle({}, true).detail).toBe(
      "Your library is in sync. Changes from your other devices arrive as they happen.",
    );
  });

  it("describes a download with its progress and an upload without", () => {
    expect(
      describeTransfer({
        direction: "download",
        totalBytes: 20 * 1024 * 1024,
        percent: 25,
      }),
    ).toBe("Downloading a file (20 MB), 25% done.");
    expect(
      describeTransfer({
        direction: "upload",
        totalBytes: 20 * 1024 * 1024,
        percent: null,
      }),
    ).toBe("Uploading a file (20 MB).");
  });
});
