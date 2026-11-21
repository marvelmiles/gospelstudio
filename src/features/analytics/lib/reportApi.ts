import type { ReportPeriod } from "../../../lib/analytics/reportPeriods";
import {
  ANALYTICS_REPORT_ENDPOINT,
  REPORT_SCHEMAS,
  type ReportBySection,
  type ReportSection,
} from "../../../lib/analytics/reportTypes";
import { requestJson } from "../../../lib/jsonApi";

export { ApiRequestError as ReportRequestError } from "../../../lib/jsonApi";

export interface ReportSelection {
  period: ReportPeriod;
  from?: string;
  to?: string;
}

export const reportUrl = (
  section: ReportSection,
  selection: ReportSelection,
): string => {
  const params = new URLSearchParams({ section, period: selection.period });
  if (selection.period === "custom" && selection.from && selection.to) {
    params.set("from", selection.from);
    params.set("to", selection.to);
  }
  return `${ANALYTICS_REPORT_ENDPOINT}?${params.toString()}`;
};

export const fetchReport = async <S extends ReportSection>(
  section: S,
  selection: ReportSelection,
  adminKey: string,
  signal: AbortSignal,
): Promise<ReportBySection[S]> =>
  (await requestJson({
    url: reportUrl(section, selection),
    init: { headers: { Authorization: `Bearer ${adminKey}` }, signal },
    dataSchema: REPORT_SCHEMAS[section],
    serviceName: "analytics service",
  })) as ReportBySection[S];
