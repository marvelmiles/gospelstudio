import { describe, expect, it } from "vitest";
import { baseFileId, isReadyToTransfer, syncItemKeyOf } from "./syncItems";

const NOW_MS = Date.parse("2026-11-27T10:00:00.000Z");

describe("sync items", () => {
  it("groups a video's details, file and preview under one key", () => {
    const key = syncItemKeyOf("media", "vid-1");
    expect(syncItemKeyOf("files", "vid-1")).toBe(key);
    expect(syncItemKeyOf("files", "vid-1:thumb")).toBe(key);
  });

  it("groups an uploaded sound or background with its own file", () => {
    expect(syncItemKeyOf("audio", "snd-1")).toBe(
      syncItemKeyOf("files", "snd-1"),
    );
    expect(syncItemKeyOf("backgrounds", "bg-1")).toBe(
      syncItemKeyOf("files", "bg-1:thumb"),
    );
  });

  it("keeps records from different stores apart", () => {
    expect(syncItemKeyOf("manuscripts", "x")).not.toBe(
      syncItemKeyOf("themes", "x"),
    );
  });

  it("strips the preview suffix from a file id", () => {
    expect(baseFileId("vid-1:thumb")).toBe("vid-1");
    expect(baseFileId("vid-1")).toBe("vid-1");
  });

  it("holds back paused items and items still waiting to retry", () => {
    const failure = {
      message: "Server failed.",
      failedAt: new Date(NOW_MS).toISOString(),
      retryAt: new Date(NOW_MS + 60_000).toISOString(),
    };
    const paused = new Set(["item:vid-1"]);
    expect(isReadyToTransfer("item:vid-1", undefined, paused, NOW_MS)).toBe(
      false,
    );
    expect(isReadyToTransfer("item:vid-2", failure, paused, NOW_MS)).toBe(
      false,
    );
    expect(
      isReadyToTransfer("item:vid-2", failure, paused, NOW_MS + 120_000),
    ).toBe(true);
    expect(isReadyToTransfer("item:vid-2", undefined, paused, NOW_MS)).toBe(
      true,
    );
  });
});
