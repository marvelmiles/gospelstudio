import { describe, expect, it } from "vitest";
import type { MediaItem } from "../../types";
import {
  buildLibraryIndex,
  buildSyncActivity,
  syncActivityIdOf,
  type SyncLibrarySnapshot,
} from "./syncActivity";
import type { DownloadEntry } from "./syncDownloads";
import type { JournalEntry } from "./syncJournal";

const NOW_MS = Date.parse("2026-11-27T10:00:00.000Z");
const EARLIER = "2026-11-27T09:00:00.000Z";
const LATER = "2026-11-27T09:30:00.000Z";

const video: MediaItem = {
  id: "vid-1",
  kind: "video",
  name: "Sunday intro",
  size: 50_000_000,
  createdAt: EARLIER,
  updatedAt: EARLIER,
};

const library: SyncLibrarySnapshot = {
  manuscripts: [{ id: "song-1", title: "Amazing Grace" }],
  scriptures: [],
  media: [video],
  backgrounds: [],
  themes: [],
  audio: [],
};

const upload = (
  store: JournalEntry["store"],
  recordId: string,
  changedAt = EARLIER,
): JournalEntry => ({
  id: `${store}/${recordId}`,
  store,
  recordId,
  changedAt,
});

const download = (id: string, size: number): DownloadEntry => ({
  id,
  size,
  contentType: "image/jpeg",
  changedAt: EARLIER,
});

const index = buildLibraryIndex(library, new Map());

describe("sync activity", () => {
  it("shows a video and its files as one named upload with its size", () => {
    const { uploads } = buildSyncActivity({
      uploads: [
        upload("media", "vid-1"),
        upload("files", "vid-1"),
        upload("files", "vid-1:thumb"),
      ],
      downloads: [],
      pausedItems: [],
      activeTransferId: null,
      index,
      nowMs: NOW_MS,
    });
    expect(uploads).toHaveLength(1);
    expect(uploads[0]).toMatchObject({
      key: "item:vid-1",
      kind: "video",
      name: "Sunday intro",
      bytes: 50_000_000,
      isRemoval: false,
      status: "waiting",
      entryIds: ["media/vid-1", "files/vid-1", "files/vid-1:thumb"],
    });
  });

  it("marks an upload for something no longer on this device as a removal", () => {
    const { uploads } = buildSyncActivity({
      uploads: [upload("manuscripts", "gone")],
      downloads: [],
      pausedItems: [],
      activeTransferId: null,
      index,
      nowMs: NOW_MS,
    });
    expect(uploads[0]).toMatchObject({
      kind: "manuscript",
      name: null,
      isRemoval: true,
    });
  });

  it("adds up a download's files and puts the active one first", () => {
    const { downloads } = buildSyncActivity({
      uploads: [],
      downloads: [
        download("pic-1", 2000),
        download("pic-1:thumb", 100),
        download("vid-1", 9000),
      ],
      pausedItems: [],
      activeTransferId: syncActivityIdOf("download", "item:vid-1"),
      index,
      nowMs: NOW_MS,
    });
    expect(
      downloads.map((item) => [item.key, item.status, item.bytes]),
    ).toEqual([
      ["item:vid-1", "active", 9000],
      ["item:pic-1", "waiting", 2100],
    ]);
  });

  it("orders failed items before waiting ones and paused ones last", () => {
    const { uploads } = buildSyncActivity({
      uploads: [
        upload("manuscripts", "song-1", EARLIER),
        upload("themes", "warm", LATER),
        {
          ...upload("themes", "cool", LATER),
          failure: { message: "No.", failedAt: LATER, retryAt: null },
        },
      ],
      downloads: [],
      pausedItems: ["manuscripts:song-1"],
      activeTransferId: null,
      index,
      nowMs: NOW_MS,
    });
    expect(uploads.map((item) => [item.key, item.status])).toEqual([
      ["themes:cool", "failed"],
      ["themes:warm", "waiting"],
      ["manuscripts:song-1", "paused"],
    ]);
  });
});
