import { describe, expect, it, vi } from "vitest";
import { ANALYTICS_REPORT_ENDPOINT } from "../../src/lib/analytics/reportTypes";
import { config as functionConfig } from "../../netlify/functions/analytics-report";
import { createReportHandler } from "./reportHandler";
import {
  answerFakeQuery,
  type FakePlausibleData,
} from "./testing/fakePlausible";
import type { PlausibleQuery } from "./plausibleClient";

const ADMIN_TOKEN = "a-very-long-admin-token-for-tests-1234567890";
const API_KEY = "server-side-api-key-123456";

const ENV = {
  PLAUSIBLE_API_KEY: API_KEY,
  PLAUSIBLE_SITE_ID: "gospelstudio.app",
  ANALYTICS_ADMIN_TOKEN: ADMIN_TOKEN,
};

const DATA: FakePlausibleData = {
  totals: [10, 12, 30, 40, 60],
  goals: [{ goal: "Bible Opened", visitors: 4, events: 6 }],
  returningGoals: [],
  visitorTypes: { new: 7, returning: 3 },
  uniqueVisitorsForGoals: () => 4,
  timeLabels: ["2026-11-06"],
};

const plausibleFetch = vi.fn<typeof fetch>(async (_url, init) => {
  const query = JSON.parse(String(init?.body)) as PlausibleQuery;
  return new Response(JSON.stringify(answerFakeQuery(DATA, query)), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

const silentLogger = { warn: vi.fn(), error: vi.fn() };

const handlerWith = (
  env: Record<string, string | undefined> = ENV,
  fetchImpl: typeof fetch = plausibleFetch,
) =>
  createReportHandler({
    env,
    fetchImpl,
    now: () => new Date("2026-11-06T09:00:00Z"),
    logger: silentLogger,
  });

const request = (
  query: string,
  {
    token = ADMIN_TOKEN,
    method = "GET",
  }: { token?: string | null; method?: string } = {},
) =>
  new Request(`https://gospelstudio.app${ANALYTICS_REPORT_ENDPOINT}?${query}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

describe("analytics report handler", () => {
  it("serves the function at the shared report endpoint", () => {
    expect(functionConfig.path).toBe(ANALYTICS_REPORT_ENDPOINT);
  });

  it("answers an authorised request with the report and no caching", async () => {
    const response = await handlerWith()(
      request("section=overview&period=today"),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const body = (await response.json()) as {
      data: {
        totals: { visitors: number };
        range: { from: string; timeZone: string };
      };
    };
    expect(body.data.totals.visitors).toBe(10);
    expect(body.data.range).toMatchObject({
      from: "2026-11-06",
      timeZone: "Africa/Lagos",
    });
  });

  it("never sends the Plausible API key back to the browser", async () => {
    const response = await handlerWith()(
      request("section=features&period=last7Days"),
    );
    expect(await response.text()).not.toContain(API_KEY);
  });

  it("refuses requests without the admin key, before asking Plausible anything", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const handler = handlerWith(ENV, fetchImpl);
    const missing = await handler(
      request("section=overview&period=today", { token: null }),
    );
    const wrong = await handler(
      request("section=overview&period=today", { token: "x".repeat(40) }),
    );
    expect(missing.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(missing.headers.get("WWW-Authenticate")).toContain("Bearer");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects invalid sections, periods and ranges with 400", async () => {
    const handler = handlerWith();
    const cases = [
      "section=everything&period=today",
      "section=overview&period=forever",
      "section=overview&period=custom&from=2026-11-01",
      "section=overview&period=today&from=2026-11-01&to=2026-11-02",
      "section=overview&period=custom&from=2026-11-05&to=2026-11-01",
      "section=overview&period=custom&from=2026-11-01&to=2026-12-01",
      "section=overview&period=today&extra=1",
    ];
    for (const query of cases)
      expect((await handler(request(query))).status, query).toBe(400);
  });

  it("only allows GET", async () => {
    const response = await handlerWith()(
      request("section=overview&period=today", { method: "POST" }),
    );
    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("GET");
  });

  it("says the service is not set up when server variables are missing", async () => {
    const response = await handlerWith({ ...ENV, PLAUSIBLE_API_KEY: "" })(
      request("section=overview&period=today"),
    );
    expect(response.status).toBe(503);
    expect(
      ((await response.json()) as { error: { code: string } }).error.code,
    ).toBe("not_configured");
  });

  it("turns Plausible's rate limit into 503 with Retry-After", async () => {
    const rateLimited: typeof fetch = async () =>
      new Response("Too many requests", {
        status: 429,
        headers: { "Retry-After": "90" },
      });
    const response = await handlerWith(
      ENV,
      rateLimited,
    )(request("section=audience&period=yesterday"));
    expect(response.status).toBe(503);
    expect(response.headers.get("Retry-After")).toBe("90");
  });

  it("explains a rejected server key without exposing it", async () => {
    const unauthorised: typeof fetch = async () =>
      new Response("Invalid API key", { status: 401 });
    const response = await handlerWith(
      ENV,
      unauthorised,
    )(request("section=audience&period=yesterday"));
    const text = await response.text();
    expect(response.status).toBe(502);
    expect(text).toContain("provider_auth_failed");
    expect(text).not.toContain(API_KEY);
  });
});
