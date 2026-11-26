import { describe, expect, it } from "vitest";
import {
  baseContentType,
  changesQuerySchema,
  localChangeSchema,
  pushRequestSchema,
  recordIdSchema,
} from "./syncContract";

const CHANGED_AT = "2026-11-25T10:00:00.000Z";

describe("sync contract", () => {
  it("accepts the record ids the app creates", () => {
    for (const id of [
      "V1StGXR8_Z5j",
      "hymn-achild-of-the-king",
      "V1StGXR8_Z5j:thumb",
      "app",
      "snd-calm-pad",
    ])
      expect(recordIdSchema.safeParse(id).success).toBe(true);
    for (const id of ["", "../etc/passwd", "a b", "a/b", "x".repeat(201)])
      expect(recordIdSchema.safeParse(id).success).toBe(false);
  });

  it("requires a put to carry the record's own id", () => {
    const put = {
      operation: "put",
      store: "manuscripts",
      recordId: "abc",
      changedAt: CHANGED_AT,
    };
    expect(
      localChangeSchema.safeParse({ ...put, data: { id: "abc" } }).success,
    ).toBe(true);
    expect(
      localChangeSchema.safeParse({ ...put, data: { id: "other" } }).success,
    ).toBe(false);
  });

  it("only takes files through the upload route, but deletes them by push", () => {
    expect(
      localChangeSchema.safeParse({
        operation: "put",
        store: "files",
        recordId: "abc",
        changedAt: CHANGED_AT,
        data: { id: "abc" },
      }).success,
    ).toBe(false);
    expect(
      localChangeSchema.safeParse({
        operation: "delete",
        store: "files",
        recordId: "abc",
        changedAt: CHANGED_AT,
      }).success,
    ).toBe(true);
  });

  it("limits how many changes one push may carry", () => {
    const change = {
      operation: "delete",
      store: "themes",
      recordId: "t",
      changedAt: CHANGED_AT,
    };
    const push = (count: number) =>
      pushRequestSchema.safeParse({
        deviceId: "device-123",
        changes: Array.from({ length: count }, () => change),
      }).success;
    expect(push(0)).toBe(false);
    expect(push(100)).toBe(true);
    expect(push(101)).toBe(false);
  });

  it("reads paging from the query string with defaults", () => {
    expect(changesQuerySchema.parse({})).toEqual({ after: 0, limit: 200 });
    expect(changesQuerySchema.parse({ after: "42", limit: "10" })).toEqual({
      after: 42,
      limit: 10,
    });
    expect(changesQuerySchema.safeParse({ limit: "9999" }).success).toBe(false);
    expect(changesQuerySchema.safeParse({ after: "-1" }).success).toBe(false);
  });

  it("strips parameters from a file's content type", () => {
    expect(baseContentType("video/webm;codecs=vp9")).toBe("video/webm");
    expect(baseContentType(" Image/PNG ")).toBe("image/png");
    expect(baseContentType("")).toBe("application/octet-stream");
    expect(baseContentType(undefined)).toBe("application/octet-stream");
  });
});
