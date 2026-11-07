import { z } from "zod";
import type { ReportPeriod } from "../../../lib/analytics/reportPeriods";
import {
  ANALYTICS_REPORT_ENDPOINT,
  REPORT_SCHEMAS,
  reportErrorSchema,
  type ReportBySection,
  type ReportSection,
} from "../../../lib/analytics/reportTypes";

export interface ReportSelection {
  period: ReportPeriod;
  from?: string;
  to?: string;
}

export class ReportRequestError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ReportRequestError";
    this.code = code;
    this.status = status;
  }
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

const isJsonResponse = (response: Response): boolean =>
  response.headers.get("content-type")?.includes("application/json") ?? false;

const readJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const fetchReport = async <S extends ReportSection>(
  section: S,
  selection: ReportSelection,
  adminKey: string,
  signal: AbortSignal,
): Promise<ReportBySection[S]> => {
  let response: Response;
  try {
    response = await fetch(reportUrl(section, selection), {
      headers: {
        Authorization: `Bearer ${adminKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal,
    });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new ReportRequestError(
      "network",
      "Couldn't reach the analytics service. Check the connection and try again.",
      0,
    );
  }

  if (!isJsonResponse(response))
    throw new ReportRequestError(
      "service_missing",
      "The analytics service isn't running at this address. Open the deployed site, or run it locally with netlify dev.",
      response.status,
    );

  const body = await readJson(response);
  if (!response.ok) {
    const parsed = reportErrorSchema.safeParse(body);
    throw parsed.success
      ? new ReportRequestError(
          parsed.data.error.code,
          parsed.data.error.message,
          response.status,
        )
      : new ReportRequestError(
          "unexpected",
          `The analytics service answered with status ${response.status}.`,
          response.status,
        );
  }

  const parsed = z.object({ data: REPORT_SCHEMAS[section] }).safeParse(body);
  if (!parsed.success)
    throw new ReportRequestError(
      "invalid_response",
      "The analytics service sent a report this page can't read.",
      response.status,
    );
  return parsed.data.data as ReportBySection[S];
};
