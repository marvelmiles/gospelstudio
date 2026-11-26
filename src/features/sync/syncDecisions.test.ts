import { describe, expect, it } from "vitest";
import {
  MAX_PUSH_BYTES,
  MAX_PUSH_CHANGES,
  MAX_RECORD_BYTES,
  type RemoteChange,
} from "@/contracts/syncContract";
import {
  planBatches,
  retryDelayAfter,
  shouldApplyRemote,
  type PreparedChange,
} from "./syncDecisions";
import type { JournalEntry } from "./syncJournal";

const THIS_DEVICE = "this-device-1234";

const remote = (
  changedAt: string,
  deviceId = "other-device-5678",
): RemoteChange => ({
  store: "manuscripts",
  recordId: "song-1",
  sequence: 7,
  deleted: false,
  data: { id: "song-1" },
  changedAt,
  deviceId,
});

const entry = (
  recordId: string,
  changedAt = "2026-11-25T10:00:00.000Z",
): JournalEntry => ({
  id: `manuscripts/${recordId}`,
  store: "manuscripts",
  recordId,
  changedAt,
});

const prepared = (recordId: string, bytes: number): PreparedChange => ({
  entry: entry(recordId),
  change: {
    operation: "delete",
    store: "manuscripts",
    recordId,
    changedAt: "2026-11-25T10:00:00.000Z",
  },
  bytes,
});

describe("applying changes from the account", () => {
  it("skips changes this device made itself", () => {
    expect(
      shouldApplyRemote(
        remote("2026-11-25T10:00:00.000Z", THIS_DEVICE),
        undefined,
        THIS_DEVICE,
      ),
    ).toBe(false);
  });

  it("applies another device's change when nothing is waiting here", () => {
    expect(
      shouldApplyRemote(
        remote("2026-11-25T10:00:00.000Z"),
        undefined,
        THIS_DEVICE,
      ),
    ).toBe(true);
  });

  it("keeps a newer change waiting on this device", () => {
    const waiting = entry("song-1", "2026-11-25T11:00:00.000Z");
    expect(
      shouldApplyRemote(
        remote("2026-11-25T10:00:00.000Z"),
        waiting,
        THIS_DEVICE,
      ),
    ).toBe(false);
  });

  it("lets a newer change from the account replace an older one waiting here", () => {
    const waiting = entry("song-1", "2026-11-25T09:00:00.000Z");
    expect(
      shouldApplyRemote(
        remote("2026-11-25T10:00:00.000Z"),
        waiting,
        THIS_DEVICE,
      ),
    ).toBe(true);
  });
});

describe("planning pushes", () => {
  it("splits pushes so none carries too many changes", () => {
    const changes = Array.from(
      { length: MAX_PUSH_CHANGES * 2 + 1 },
      (_, index) => prepared(`song-${index}`, 10),
    );
    const { batches, tooLarge } = planBatches(changes);
    expect(batches.map((batch) => batch.changes.length)).toEqual([
      MAX_PUSH_CHANGES,
      MAX_PUSH_CHANGES,
      1,
    ]);
    expect(tooLarge).toEqual([]);
  });

  it("splits pushes so none is too large to send", () => {
    const nearlyHalf = Math.floor(MAX_PUSH_BYTES / 2) - 1000;
    const { batches } = planBatches([
      prepared("a", nearlyHalf),
      prepared("b", nearlyHalf),
      prepared("c", nearlyHalf),
    ]);
    expect(
      batches.map((batch) => batch.entries.map((item) => item.recordId)),
    ).toEqual([["a", "b"], ["c"]]);
  });

  it("holds back items too large to sync instead of failing the push", () => {
    const { batches, tooLarge } = planBatches([
      prepared("small", 100),
      prepared("huge", MAX_RECORD_BYTES + 1),
    ]);
    expect(tooLarge.map((item) => item.recordId)).toEqual(["huge"]);
    expect(batches).toHaveLength(1);
    expect(batches[0]?.entries.map((item) => item.recordId)).toEqual(["small"]);
  });

  it("returns nothing to push for an empty queue", () => {
    expect(planBatches([])).toEqual({ batches: [], tooLarge: [] });
  });
});

describe("retrying after a failure", () => {
  it("waits longer after each failure, up to five minutes", () => {
    expect(retryDelayAfter(1)).toBe(5000);
    expect(retryDelayAfter(2)).toBe(10000);
    expect(retryDelayAfter(4)).toBe(40000);
    expect(retryDelayAfter(20)).toBe(5 * 60 * 1000);
  });
});
