import { describe, expect, it, vi } from "vitest";
import { PlausibleRequestError } from "./errors";
import {
  createPlausibleClient,
  withConcurrencyLimit,
  withQueryCache,
  type PlausibleClient,
  type PlausibleQuery,
} from "./plausibleClient";

const QUERY: PlausibleQuery = {
  metrics: ["visitors"],
  date_range: ["2026-11-01", "2026-11-06"],
};

const OK_BODY = { results: [{ dimensions: [], metrics: [12] }], meta: {} };

const jsonResponse = (status: number, body: unknown, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });

const clientWith = (fetchImpl: typeof fetch) =>
  createPlausibleClient({
    apiKey: "server-side-api-key-123456",
    siteId: "gospelstudio.app",
    baseUrl: "https://plausible.io",
    timeoutMs: 1000,
    fetchImpl,
  });

describe("Plausible client", () => {
  it("posts the query to the v2 endpoint with the site and a bearer key", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      jsonResponse(200, OK_BODY),
    );
    const result = await clientWith(fetchImpl)(QUERY);

    expect(result.results[0].metrics).toEqual([12]);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(String(url)).toBe("https://plausible.io/api/v2/query");
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("Authorization")).toBe(
      "Bearer server-side-api-key-123456",
    );
    expect(JSON.parse(String(init?.body))).toEqual({
      site_id: "gospelstudio.app",
      ...QUERY,
    });
  });

  it("turns error statuses into PlausibleRequestError with Retry-After", async () => {
    const client = clientWith(async () =>
      jsonResponse(
        429,
        { error: "Too many requests" },
        { "Retry-After": "120" },
      ),
    );
    await expect(client(QUERY)).rejects.toMatchObject({
      status: 429,
      retryAfterSeconds: 120,
    });
  });

  it("reports network failures and timeouts without a status", async () => {
    const client = clientWith(async () => {
      throw new DOMException("The operation timed out.", "TimeoutError");
    });
    await expect(client(QUERY)).rejects.toMatchObject({ status: null });
  });

  it("rejects responses that do not match the Stats API format", async () => {
    const client = clientWith(async () => jsonResponse(200, { rows: [] }));
    await expect(client(QUERY)).rejects.toBeInstanceOf(PlausibleRequestError);
  });
});

describe("query cache", () => {
  it("answers repeated queries from the cache until they expire", async () => {
    let time = 0;
    const upstream = vi.fn<PlausibleClient>(async () => OK_BODY);
    const cached = withQueryCache(upstream, {
      ttlMs: () => 100,
      maxEntries: 10,
      now: () => time,
    });

    await cached(QUERY);
    await cached({ ...QUERY });
    expect(upstream).toHaveBeenCalledTimes(1);

    time = 100;
    await cached(QUERY);
    expect(upstream).toHaveBeenCalledTimes(2);
  });

  it("never caches failures", async () => {
    const upstream = vi
      .fn<PlausibleClient>()
      .mockRejectedValueOnce(new PlausibleRequestError(500, "boom"))
      .mockResolvedValueOnce(OK_BODY);
    const cached = withQueryCache(upstream, {
      ttlMs: () => 1000,
      maxEntries: 10,
      now: () => 0,
    });

    await expect(cached(QUERY)).rejects.toBeInstanceOf(PlausibleRequestError);
    await expect(cached(QUERY)).resolves.toEqual(OK_BODY);
  });
});

describe("concurrency limit", () => {
  it("never runs more queries at once than allowed", async () => {
    let running = 0;
    let peak = 0;
    const upstream: PlausibleClient = async () => {
      running += 1;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, 5));
      running -= 1;
      return OK_BODY;
    };
    const limited = withConcurrencyLimit(upstream, 2);
    await Promise.all(Array.from({ length: 7 }, () => limited(QUERY)));
    expect(peak).toBe(2);
  });
});
