import { z } from "zod";
import { PlausibleRequestError } from "./errors";

export type PlausibleMetric =
  | "visitors"
  | "visits"
  | "pageviews"
  | "bounce_rate"
  | "visit_duration"
  | "events"
  | "percentage";

export type PlausibleFilter = ["is", string, string[]];

export interface PlausibleQuery {
  metrics: PlausibleMetric[];
  date_range: [string, string];
  dimensions?: string[];
  filters?: PlausibleFilter[];
  include?: { time_labels?: boolean };
  pagination?: { limit: number };
}

const plausibleResultSchema = z.object({
  results: z.array(
    z.object({
      dimensions: z.array(z.union([z.string(), z.number()])),
      metrics: z.array(z.number().nullable()),
    }),
  ),
  meta: z
    .object({
      time_labels: z.array(z.string()).optional(),
    })
    .passthrough()
    .optional(),
});

export type PlausibleQueryResult = z.infer<typeof plausibleResultSchema>;

export type PlausibleClient = (
  query: PlausibleQuery,
) => Promise<PlausibleQueryResult>;

interface PlausibleClientOptions {
  apiKey: string;
  siteId: string;
  baseUrl: string;
  timeoutMs: number;
  fetchImpl: typeof fetch;
}

const MAX_DETAIL_LENGTH = 300;

const responseDetail = async (response: Response): Promise<string> => {
  try {
    return (await response.text()).slice(0, MAX_DETAIL_LENGTH);
  } catch {
    return "";
  }
};

const retryAfterSeconds = (response: Response): number | null => {
  const seconds = Number(response.headers.get("retry-after"));
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
};

const describeFailure = (error: unknown): string =>
  error instanceof Error ? error.name : "network error";

export const createPlausibleClient = ({
  apiKey,
  siteId,
  baseUrl,
  timeoutMs,
  fetchImpl,
}: PlausibleClientOptions): PlausibleClient => {
  const endpoint = new URL("/api/v2/query", baseUrl);

  return async (query) => {
    let response: Response;
    try {
      response = await fetchImpl(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ site_id: siteId, ...query }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      throw new PlausibleRequestError(null, describeFailure(error));
    }

    if (!response.ok)
      throw new PlausibleRequestError(
        response.status,
        await responseDetail(response),
        retryAfterSeconds(response),
      );

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new PlausibleRequestError(response.status, "Response was not JSON");
    }
    const parsed = plausibleResultSchema.safeParse(body);
    if (!parsed.success)
      throw new PlausibleRequestError(
        response.status,
        "Response did not match the Stats API format",
      );
    return parsed.data;
  };
};

export const withConcurrencyLimit = (
  client: PlausibleClient,
  maxConcurrent: number,
): PlausibleClient => {
  let running = 0;
  const waiting: (() => void)[] = [];

  const acquire = async (): Promise<void> => {
    if (running < maxConcurrent) {
      running += 1;
      return;
    }
    await new Promise<void>((resolve) => waiting.push(resolve));
  };

  const release = (): void => {
    const next = waiting.shift();
    if (next) next();
    else running -= 1;
  };

  return async (query) => {
    await acquire();
    try {
      return await client(query);
    } finally {
      release();
    }
  };
};

interface CacheEntry {
  expiresAt: number;
  result: Promise<PlausibleQueryResult>;
}

interface QueryCacheOptions {
  ttlMs: (query: PlausibleQuery) => number;
  maxEntries: number;
  now: () => number;
}

export const withQueryCache = (
  client: PlausibleClient,
  { ttlMs, maxEntries, now }: QueryCacheOptions,
): PlausibleClient => {
  const entries = new Map<string, CacheEntry>();

  const evict = (at: number): void => {
    for (const [key, entry] of entries)
      if (entry.expiresAt <= at) entries.delete(key);
    while (entries.size > maxEntries) {
      const oldest = entries.keys().next().value;
      if (oldest === undefined) break;
      entries.delete(oldest);
    }
  };

  return (query) => {
    const key = JSON.stringify(query);
    const at = now();
    const cached = entries.get(key);
    if (cached && cached.expiresAt > at) return cached.result;

    const result = client(query);
    entries.set(key, { expiresAt: at + ttlMs(query), result });
    result.catch(() => {
      if (entries.get(key)?.result === result) entries.delete(key);
    });
    evict(at);
    return result;
  };
};
