import { describe, expect, it, vi } from "vitest";
import { PlausibleRequestError } from "./errors";
import {
  buildAudienceReport,
  buildFeaturesReport,
  buildOverviewReport,
  type ReportContext,
} from "./reportService";
import {
  createFakePlausible,
  type FakePlausibleData,
} from "./testing/fakePlausible";

const RANGE = {
  from: "2026-11-01",
  to: "2026-11-06",
  timeZone: "Africa/Lagos",
  granularity: "day" as const,
};

const baseData = (): FakePlausibleData => ({
  totals: [40, 55, 210, 37.5, 125],
  goals: [
    { goal: "Manuscript Created", visitors: 1, events: 5 },
    { goal: "Manuscript Edited", visitors: 3, events: 4 },
    { goal: "Studio Opened", visitors: 6, events: 9 },
    { goal: "Presentation Started", visitors: 4, events: 6 },
    { goal: "Presentation Ended", visitors: 4, events: 6 },
    { goal: "Outbound Link: Click", visitors: 9, events: 9 },
  ],
  returningGoals: [{ goal: "Studio Opened", visitors: 2, events: 2 }],
  visitorTypes: { new: 30, returning: 12 },
  uniqueVisitorsForGoals: (goals, returningOnly) =>
    returningOnly ? 2 : goals.length > 2 ? 8 : 3,
  timeLabels: ["2026-11-01", "2026-11-02"],
});

const contextFor = (data: FakePlausibleData) => {
  const fake = createFakePlausible(
    data,
    () => new PlausibleRequestError(400, "Unknown property"),
  );
  const onOptionalFailure = vi.fn();
  const context: ReportContext = {
    client: fake.client,
    range: RANGE,
    generatedAt: "2026-11-06T10:00:00.000Z",
    onOptionalFailure,
  };
  return { context, queries: fake.queries, onOptionalFailure };
};

describe("overview report", () => {
  it("reports Plausible's totals and the returning visitor split", async () => {
    const { context } = contextFor(baseData());
    const report = await buildOverviewReport(context);
    expect(report.totals).toEqual({
      visitors: 40,
      visits: 55,
      pageviews: 210,
      bounceRate: 37.5,
      visitDurationSeconds: 125,
    });
    expect(report.visitorTypes).toEqual({ new: 30, returning: 12 });
  });

  it("asks Plausible for deduplicated feature users instead of adding goal visitors", async () => {
    const { context, queries } = contextFor(baseData());
    const report = await buildOverviewReport(context);
    expect(report.activeFeatureUsers).toBe(8);
    const featureUserQuery = queries.find(
      (query) =>
        !query.dimensions?.length &&
        query.filters?.some((filter) => filter[1] === "event:goal"),
    );
    expect(featureUserQuery?.filters?.[0]?.[2]).toEqual([
      "Studio Opened",
      "Manuscript Created",
      "Manuscript Edited",
      "Presentation Started",
    ]);
  });

  it("adds up occurrences, which are counts and safe to add, and ignores goals outside the catalog", async () => {
    const { context } = contextFor(baseData());
    const report = await buildOverviewReport(context);
    expect(report.trackedEvents).toBe(5 + 4 + 9 + 6 + 6);
  });

  it("fills one trend point per Plausible time label", async () => {
    const { context } = contextFor(baseData());
    const report = await buildOverviewReport(context);
    expect(report.trend.map((point) => point.bucket)).toEqual([
      "2026-11-01",
      "2026-11-02",
    ]);
  });

  it("shows returning visitors as not set up when Plausible rejects the property", async () => {
    const { context, onOptionalFailure } = contextFor({
      ...baseData(),
      visitorTypes: "rejected",
    });
    const report = await buildOverviewReport(context);
    expect(report.visitorTypes).toBeNull();
    expect(onOptionalFailure).toHaveBeenCalledOnce();
  });

  it("asks no goal-filtered questions when no tracked goal has data", async () => {
    const { context, queries } = contextFor({ ...baseData(), goals: [] });
    const report = await buildOverviewReport(context);
    expect(report.activeFeatureUsers).toBe(0);
    expect(
      queries.some((query) =>
        query.filters?.some((filter) => filter[1] === "event:goal"),
      ),
    ).toBe(false);
  });
});

describe("features report", () => {
  it("keeps unique visitors and occurrences apart for one visitor creating five manuscripts", async () => {
    const { context } = contextFor(baseData());
    const report = await buildFeaturesReport(context);
    const manuscripts = report.features.find(
      (feature) => feature.id === "manuscripts",
    );
    const created = manuscripts?.events.find(
      (event) => event.name === "Manuscript Created",
    );
    expect(created).toMatchObject({ visitors: 1, occurrences: 5 });
    expect(manuscripts?.visitors).toBe(3);
    expect(manuscripts?.actions).toBe(9);
  });

  it("uses the goal's own visitors when a feature has a single goal with data", async () => {
    const { context, queries } = contextFor(baseData());
    const report = await buildFeaturesReport(context);
    const studio = report.features.find((feature) => feature.id === "studio");
    expect(studio?.visitors).toBe(6);
    expect(
      queries.some(
        (query) =>
          !query.dimensions?.length &&
          JSON.stringify(query.filters) ===
            JSON.stringify([["is", "event:goal", ["Studio Opened"]]]),
      ),
    ).toBe(false);
  });

  it("leaves session ends out of a feature's actions", async () => {
    const { context } = contextFor(baseData());
    const report = await buildFeaturesReport(context);
    const presentations = report.features.find(
      (feature) => feature.id === "presentations",
    );
    expect(presentations?.actions).toBe(6);
  });

  it("lists catalog events with no data so missing goals are easy to spot", async () => {
    const { context } = contextFor(baseData());
    const report = await buildFeaturesReport(context);
    expect(report.eventsWithoutData).toContain("Bible Opened");
    expect(report.eventsWithoutData).not.toContain("Studio Opened");
  });

  it("marks returning visitors as unknown when Plausible rejects the property", async () => {
    const { context } = contextFor({
      ...baseData(),
      returningGoals: "rejected",
    });
    const report = await buildFeaturesReport(context);
    for (const feature of report.features) {
      expect(feature.returningVisitors).toBeNull();
      for (const event of feature.events)
        expect(event.returningVisitors).toBeNull();
    }
  });
});

describe("audience report", () => {
  it("labels empty dimension values as Unknown", async () => {
    const { context } = contextFor(baseData());
    const report = await buildAudienceReport(context);
    expect(report.sources).toEqual([
      { label: "Google", visitors: 7, percentage: 70 },
      { label: "Unknown", visitors: 3, percentage: 30 },
    ]);
  });
});
