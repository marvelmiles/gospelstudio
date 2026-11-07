import { describe, expect, it } from "vitest";
import { classifyVisitor, localDay, validFirstActiveDay } from "./visitorType";

describe("visitor type", () => {
  it("writes days in local time as YYYY-MM-DD", () => {
    expect(localDay(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });

  it("treats a browser first seen today as new", () => {
    expect(classifyVisitor(null, "2026-11-06")).toBe("new");
    expect(classifyVisitor("2026-11-06", "2026-11-06")).toBe("new");
  });

  it("treats a browser first seen on an earlier day as returning", () => {
    expect(classifyVisitor("2026-11-05", "2026-11-06")).toBe("returning");
  });

  it("ignores stored days that are malformed or in the future", () => {
    expect(validFirstActiveDay("2026-11-01", "2026-11-06")).toBe("2026-11-01");
    expect(validFirstActiveDay("yesterday", "2026-11-06")).toBeNull();
    expect(validFirstActiveDay("2027-01-01", "2026-11-06")).toBeNull();
    expect(validFirstActiveDay(null, "2026-11-06")).toBeNull();
  });
});
