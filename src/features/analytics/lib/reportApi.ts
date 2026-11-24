import type { ReportPeriod } from "@/contracts/reportPeriods";
import {
  ANALYTICS_REPORT_PATH,
  REPORT_SCHEMAS,
  type ReportBySection,
  type ReportSection,
} from "@/contracts/analyticsReport";
import { ApiRequestError, requestJson } from "../../../lib/jsonApi";
import {
  RELAY_SERVER_MISSING_HINT,
  relayServerUrl,
} from "../../../lib/relayServer";

export { ApiRequestError as ReportRequestError } from "../../../lib/jsonApi";

const SERVICE_NAME = "analytics service";

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
  return `${ANALYTICS_REPORT_PATH}?${params.toString()}`;
};

export const fetchReport = async <S extends ReportSection>(
  section: S,
  selection: ReportSelection,
  adminKey: string,
  signal: AbortSignal,
): Promise<ReportBySection[S]> => {
  const serverUrl = relayServerUrl();
  if (!serverUrl)
    throw new ApiRequestError(
      "not_configured",
      "Analytics reports are not set up on this site yet. Set VITE_RELAY_SERVER_URL to the relay server's address.",
      0,
    );
  return (await requestJson({
    url: `${serverUrl}${reportUrl(section, selection)}`,
    init: { headers: { Authorization: `Bearer ${adminKey}` }, signal },
    dataSchema: REPORT_SCHEMAS[section],
    serviceName: SERVICE_NAME,
    missingServiceHint: RELAY_SERVER_MISSING_HINT,
  })) as ReportBySection[S];
};
