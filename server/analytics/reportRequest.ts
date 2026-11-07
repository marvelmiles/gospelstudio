import {
  customRangeProblem,
  granularityFor,
  resolvePresetRange,
  type DayRange,
} from "../../src/lib/analytics/reportPeriods";
import {
  reportQuerySchema,
  type ReportRange,
  type ReportSection,
} from "../../src/lib/analytics/reportTypes";
import { AnalyticsApiError } from "./errors";

interface ReportRequest {
  section: ReportSection;
  range: ReportRange;
}

const invalidRequest = (message: string): AnalyticsApiError =>
  new AnalyticsApiError(400, "invalid_request", message);

export const parseReportRequest = (
  url: URL,
  timeZone: string,
  today: string,
): ReportRequest => {
  const parsed = reportQuerySchema.safeParse(
    Object.fromEntries(url.searchParams),
  );
  if (!parsed.success)
    throw invalidRequest(
      parsed.error.issues[0]?.message ?? "The report request is not valid.",
    );

  const { section, period, from, to } = parsed.data;
  let days: DayRange;
  if (period === "custom") {
    if (!from || !to) throw invalidRequest("Send both from and to.");
    days = { from, to };
    const problem = customRangeProblem(days, today);
    if (problem) throw invalidRequest(problem);
  } else {
    days = resolvePresetRange(period, today);
  }

  return {
    section,
    range: { ...days, timeZone, granularity: granularityFor(days) },
  };
};
