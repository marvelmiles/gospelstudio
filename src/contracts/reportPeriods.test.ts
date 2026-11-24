import { describe, expect, it } from "vitest";
import {
  customRangeProblem,
  daysInRange,
  granularityFor,
  resolvePresetRange,
  todayIn,
} from "./reportPeriods";

const THURSDAY = "2026-11-05";

describe("report periods", () => {
  it("reads today in the reporting time zone, not the server's", () => {
    const lateEveningUtc = new Date("2026-11-05T23:30:00Z");
    expect(todayIn("Africa/Lagos", lateEveningUtc)).toBe("2026-11-06");
    expect(todayIn("UTC", lateEveningUtc)).toBe("2026-11-05");
  });

  it("counts rolling ranges including today", () => {
    expect(resolvePresetRange("today", THURSDAY)).toEqual({
      from: THURSDAY,
      to: THURSDAY,
    });
    expect(resolvePresetRange("yesterday", THURSDAY)).toEqual({
      from: "2026-11-04",
      to: "2026-11-04",
    });
    expect(daysInRange(resolvePresetRange("last7Days", THURSDAY))).toBe(7);
    expect(daysInRange(resolvePresetRange("last30Days", THURSDAY))).toBe(30);
  });

  it("starts weeks on Monday", () => {
    expect(resolvePresetRange("thisWeek", THURSDAY)).toEqual({
      from: "2026-11-02",
      to: THURSDAY,
    });
    expect(resolvePresetRange("lastWeek", THURSDAY)).toEqual({
      from: "2026-10-26",
      to: "2026-11-01",
    });
    expect(resolvePresetRange("thisWeek", "2026-11-08")).toEqual({
      from: "2026-11-02",
      to: "2026-11-08",
    });
  });

  it("uses whole calendar months", () => {
    expect(resolvePresetRange("thisMonth", THURSDAY)).toEqual({
      from: "2026-11-01",
      to: THURSDAY,
    });
    expect(resolvePresetRange("lastMonth", "2026-03-15")).toEqual({
      from: "2026-02-01",
      to: "2026-02-28",
    });
    expect(resolvePresetRange("lastMonth", "2026-01-10")).toEqual({
      from: "2025-12-01",
      to: "2025-12-31",
    });
  });

  it("rejects custom ranges that are backwards, in the future, too long or not real days", () => {
    expect(
      customRangeProblem({ from: "2026-10-01", to: THURSDAY }, THURSDAY),
    ).toBeNull();
    expect(
      customRangeProblem({ from: THURSDAY, to: "2026-10-01" }, THURSDAY),
    ).not.toBeNull();
    expect(
      customRangeProblem({ from: "2026-10-01", to: "2026-11-30" }, THURSDAY),
    ).not.toBeNull();
    expect(
      customRangeProblem({ from: "2020-01-01", to: THURSDAY }, THURSDAY),
    ).not.toBeNull();
    expect(
      customRangeProblem({ from: "2026-02-30", to: "2026-03-01" }, THURSDAY),
    ).not.toBeNull();
  });

  it("picks a chart bucket size that keeps the trend readable", () => {
    expect(granularityFor({ from: THURSDAY, to: THURSDAY })).toBe("hour");
    expect(granularityFor({ from: "2026-10-07", to: THURSDAY })).toBe("day");
    expect(granularityFor({ from: "2026-01-01", to: THURSDAY })).toBe("week");
    expect(granularityFor({ from: "2025-01-01", to: THURSDAY })).toBe("month");
  });
});
