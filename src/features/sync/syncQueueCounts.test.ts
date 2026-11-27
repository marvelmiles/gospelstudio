import { describe, expect, it } from "vitest";
import type { DownloadEntry } from "./syncDownloads";
import type { SyncFailure } from "./syncFailure";
import type { JournalEntry } from "./syncJournal";
import { summarizeQueue } from "./syncQueueCounts";

const NOW_MS = Date.parse("2026-11-27T10:00:00.000Z");
const CHANGED_AT = "2026-11-27T09:59:00.000Z";

const permanent: SyncFailure = {
  message: "Too large.",
  failedAt: CHANGED_AT,
  retryAt: null,
};

const upload = (
  store: JournalEntry["store"],
  recordId: string,
  failure?: SyncFailure,
): JournalEntry => ({
  id: `${store}/${recordId}`,
  store,
  recordId,
  changedAt: CHANGED_AT,
  failure,
});

const download = (id: string, failure?: SyncFailure): DownloadEntry => ({
  id,
  size: 1000,
  contentType: "image/png",
  changedAt: CHANGED_AT,
  failure,
});

describe("sync queue summary", () => {
  it("counts a video and its file and preview as one item", () => {
    expect(
      summarizeQueue({
        uploads: [
          upload("media", "vid-1"),
          upload("files", "vid-1"),
          upload("files", "vid-1:thumb"),
          upload("manuscripts", "song-1"),
        ],
        downloads: [download("pic-1"), download("pic-1:thumb")],
        pausedItems: [],
        nowMs: NOW_MS,
      }),
    ).toEqual({ uploads: 2, downloads: 1, paused: 0, failed: 0 });
  });

  it("counts paused items as paused even when they also failed", () => {
    expect(
      summarizeQueue({
        uploads: [
          upload("files", "vid-1", permanent),
          upload("manuscripts", "song-1", permanent),
        ],
        downloads: [download("pic-1")],
        pausedItems: ["item:vid-1", "item:pic-1"],
        nowMs: NOW_MS,
      }),
    ).toEqual({ uploads: 2, downloads: 1, paused: 2, failed: 1 });
  });
});
