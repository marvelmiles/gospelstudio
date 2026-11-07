type AnalyticsErrorCode =
  | "method_not_allowed"
  | "not_configured"
  | "unauthorized"
  | "invalid_request"
  | "provider_auth_failed"
  | "provider_plan"
  | "provider_rejected_query"
  | "rate_limited"
  | "provider_unavailable"
  | "internal_error";

export class AnalyticsApiError extends Error {
  readonly status: number;
  readonly code: AnalyticsErrorCode;
  readonly retryAfterSeconds: number | null;

  constructor(
    status: number,
    code: AnalyticsErrorCode,
    message: string,
    retryAfterSeconds: number | null = null,
  ) {
    super(message);
    this.name = "AnalyticsApiError";
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class PlausibleRequestError extends Error {
  readonly status: number | null;
  readonly detail: string;
  readonly retryAfterSeconds: number | null;

  constructor(
    status: number | null,
    detail: string,
    retryAfterSeconds: number | null = null,
  ) {
    super(
      status === null
        ? `Plausible request failed: ${detail}`
        : `Plausible responded with ${status}: ${detail}`,
    );
    this.name = "PlausibleRequestError";
    this.status = status;
    this.detail = detail;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

const DEFAULT_RETRY_AFTER_SECONDS = 60;

export const toAnalyticsApiError = (error: unknown): AnalyticsApiError => {
  if (error instanceof AnalyticsApiError) return error;
  if (!(error instanceof PlausibleRequestError))
    return new AnalyticsApiError(
      500,
      "internal_error",
      "Something went wrong while building the report.",
    );
  switch (error.status) {
    case null:
      return new AnalyticsApiError(
        504,
        "provider_unavailable",
        "Plausible did not answer in time. Try again in a moment.",
      );
    case 401:
    case 403:
      return new AnalyticsApiError(
        502,
        "provider_auth_failed",
        "Plausible rejected the server's Stats API key. Check PLAUSIBLE_API_KEY and PLAUSIBLE_SITE_ID.",
      );
    case 402:
      return new AnalyticsApiError(
        502,
        "provider_plan",
        "The Plausible plan for this site does not include the Stats API.",
      );
    case 429:
      return new AnalyticsApiError(
        503,
        "rate_limited",
        "Plausible's hourly request limit was reached. Try again later.",
        error.retryAfterSeconds ?? DEFAULT_RETRY_AFTER_SECONDS,
      );
    default:
      return error.status >= 500
        ? new AnalyticsApiError(
            502,
            "provider_unavailable",
            "Plausible is having trouble right now. Try again in a moment.",
          )
        : new AnalyticsApiError(
            502,
            "provider_rejected_query",
            "Plausible could not answer this report. Check that the goals are set up in Plausible.",
          );
  }
};
