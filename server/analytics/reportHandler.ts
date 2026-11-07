import { todayIn } from "../../src/lib/analytics/reportPeriods";
import { isAuthorizedAdmin } from "./adminAuth";
import {
  AnalyticsApiError,
  PlausibleRequestError,
  toAnalyticsApiError,
} from "./errors";
import {
  createPlausibleClient,
  withConcurrencyLimit,
  withQueryCache,
  type PlausibleClient,
} from "./plausibleClient";
import { parseReportRequest } from "./reportRequest";
import { REPORT_BUILDERS } from "./reportService";
import { parseServerEnv, type ServerEnv } from "./serverEnv";

const PLAUSIBLE_TIMEOUT_MS = 10_000;
const MAX_CONCURRENT_QUERIES = 4;
const MAX_CACHED_QUERIES = 300;
const CURRENT_RANGE_TTL_MS = 2 * 60 * 1000;
const PAST_RANGE_TTL_MS = 60 * 60 * 1000;

type Logger = Pick<Console, "warn" | "error">;

interface ReportHandlerOptions {
  env: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  now?: () => Date;
  logger?: Logger;
}

const BASE_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

const jsonResponse = (
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...BASE_HEADERS, ...headers },
  });

const errorHeaders = (error: AnalyticsApiError): Record<string, string> => {
  if (error.status === 405) return { Allow: "GET" };
  if (error.status === 401)
    return { "WWW-Authenticate": 'Bearer realm="analytics"' };
  if (error.retryAfterSeconds !== null)
    return { "Retry-After": String(error.retryAfterSeconds) };
  return {};
};

const errorResponse = (error: AnalyticsApiError): Response =>
  jsonResponse(
    error.status,
    { error: { code: error.code, message: error.message } },
    errorHeaders(error),
  );

const describeError = (error: unknown): string =>
  error instanceof Error ? error.message : "Unknown error";

const createReportClient = (
  env: ServerEnv,
  fetchImpl: typeof fetch,
  now: () => Date,
): PlausibleClient =>
  withQueryCache(
    withConcurrencyLimit(
      createPlausibleClient({
        apiKey: env.PLAUSIBLE_API_KEY,
        siteId: env.PLAUSIBLE_SITE_ID,
        baseUrl: env.PLAUSIBLE_API_BASE_URL,
        timeoutMs: PLAUSIBLE_TIMEOUT_MS,
        fetchImpl,
      }),
      MAX_CONCURRENT_QUERIES,
    ),
    {
      ttlMs: (query) =>
        query.date_range[1] >= todayIn(env.ANALYTICS_TIMEZONE, now())
          ? CURRENT_RANGE_TTL_MS
          : PAST_RANGE_TTL_MS,
      maxEntries: MAX_CACHED_QUERIES,
      now: () => now().getTime(),
    },
  );

export const createReportHandler = ({
  env,
  fetchImpl = fetch,
  now = () => new Date(),
  logger = console,
}: ReportHandlerOptions): ((request: Request) => Promise<Response>) => {
  const config = parseServerEnv(env);
  if (!config.ok)
    logger.warn(
      `Analytics report API is not configured. Check: ${config.invalidVariables.join(", ")}`,
    );
  const client = config.ok
    ? createReportClient(config.env, fetchImpl, now)
    : null;

  const logOptionalFailure = (error: PlausibleRequestError): void =>
    logger.warn(`Optional analytics query skipped: ${error.message}`);

  return async (request) => {
    try {
      if (request.method !== "GET")
        throw new AnalyticsApiError(
          405,
          "method_not_allowed",
          "Use GET for analytics reports.",
        );
      if (!config.ok || !client)
        throw new AnalyticsApiError(
          503,
          "not_configured",
          "The analytics report service is not set up yet.",
        );
      if (
        !isAuthorizedAdmin(
          request.headers.get("authorization"),
          config.env.ANALYTICS_ADMIN_TOKEN,
        )
      )
        throw new AnalyticsApiError(
          401,
          "unauthorized",
          "The admin key is missing or wrong.",
        );

      const timeZone = config.env.ANALYTICS_TIMEZONE;
      const generatedAt = now();
      const { section, range } = parseReportRequest(
        new URL(request.url),
        timeZone,
        todayIn(timeZone, generatedAt),
      );
      const data = await REPORT_BUILDERS[section]({
        client,
        range,
        generatedAt: generatedAt.toISOString(),
        onOptionalFailure: logOptionalFailure,
      });
      return jsonResponse(200, { data });
    } catch (error) {
      const apiError = toAnalyticsApiError(error);
      if (apiError.status >= 500)
        logger.error(`Analytics report failed: ${describeError(error)}`);
      return errorResponse(apiError);
    }
  };
};
