import {
  ANALYTICS_EVENTS,
  ANALYTICS_EVENT_NAMES,
  ANALYTICS_FEATURES,
  VISITOR_TYPE_PROPERTY,
  eventsOfFeature,
  isAnalyticsEvent,
  type AnalyticsEvent,
} from "../../src/lib/analytics/analyticsEvents";
import type {
  AudienceReport,
  BreakdownRow,
  FeatureReport,
  FeaturesReport,
  OverviewReport,
  ReportBySection,
  ReportRange,
  ReportSection,
  TrendPoint,
} from "../../src/lib/analytics/reportTypes";
import { PlausibleRequestError } from "./errors";
import type {
  PlausibleClient,
  PlausibleFilter,
  PlausibleMetric,
  PlausibleQueryResult,
} from "./plausibleClient";

export interface ReportContext {
  client: PlausibleClient;
  range: ReportRange;
  generatedAt: string;
  onOptionalFailure: (error: PlausibleRequestError) => void;
}

interface GoalTotals {
  visitors: number;
  occurrences: number;
}

type GoalTotalsByEvent = Map<AnalyticsEvent, GoalTotals>;

interface TimeSeries {
  labels: string[];
  metricsByBucket: Map<string, (number | null)[]>;
}

const GOAL_BREAKDOWN_LIMIT = 1000;
const AUDIENCE_BREAKDOWN_LIMIT = 10;
const UNKNOWN_LABEL = "Unknown";
const RETURNING_FILTER: PlausibleFilter = [
  "is",
  `event:props:${VISITOR_TYPE_PROPERTY}`,
  ["returning"],
];

const goalFilter = (goals: AnalyticsEvent[]): PlausibleFilter => [
  "is",
  "event:goal",
  goals,
];

const dateRangeOf = (range: ReportRange): [string, string] => [
  range.from,
  range.to,
];

const countAt = (
  metrics: (number | null)[] | undefined,
  index: number,
): number => Math.max(0, Math.round(metrics?.[index] ?? 0));

const decimalAt = (
  metrics: (number | null)[] | undefined,
  index: number,
): number | null => {
  const value = metrics?.[index];
  return value === null || value === undefined ? null : Math.max(0, value);
};

const firstRowMetrics = (
  result: PlausibleQueryResult,
): (number | null)[] | undefined => result.results[0]?.metrics;

const isRejectedQuery = (error: unknown): error is PlausibleRequestError =>
  error instanceof PlausibleRequestError &&
  (error.status === 400 || error.status === 422);

const optional = async <T>(
  context: ReportContext,
  task: () => Promise<T>,
): Promise<T | null> => {
  try {
    return await task();
  } catch (error) {
    if (!isRejectedQuery(error)) throw error;
    context.onOptionalFailure(error);
    return null;
  }
};

const uniqueVisitors = async (
  { client, range }: ReportContext,
  filters: PlausibleFilter[],
): Promise<number> =>
  countAt(
    firstRowMetrics(
      await client({
        metrics: ["visitors"],
        date_range: dateRangeOf(range),
        filters,
      }),
    ),
    0,
  );

const fetchGoalTotals = async (
  { client, range }: ReportContext,
  filters: PlausibleFilter[] = [],
): Promise<GoalTotalsByEvent> => {
  const { results } = await client({
    metrics: ["visitors", "events"],
    date_range: dateRangeOf(range),
    dimensions: ["event:goal"],
    filters,
    pagination: { limit: GOAL_BREAKDOWN_LIMIT },
  });
  const totals: GoalTotalsByEvent = new Map();
  for (const row of results) {
    const name = String(row.dimensions[0]);
    if (isAnalyticsEvent(name))
      totals.set(name, {
        visitors: countAt(row.metrics, 0),
        occurrences: countAt(row.metrics, 1),
      });
  }
  return totals;
};

const usageGoalsWithData = (
  events: readonly AnalyticsEvent[],
  goalTotals: GoalTotalsByEvent,
): AnalyticsEvent[] =>
  events.filter(
    (event) => ANALYTICS_EVENTS[event].countsAsUsage && goalTotals.has(event),
  );

const sumOccurrences = (
  events: AnalyticsEvent[],
  goalTotals: GoalTotalsByEvent,
): number =>
  events.reduce(
    (total, event) => total + (goalTotals.get(event)?.occurrences ?? 0),
    0,
  );

const visitorsDoingAny = async (
  context: ReportContext,
  goals: AnalyticsEvent[],
  goalTotals: GoalTotalsByEvent,
  extraFilters: PlausibleFilter[] = [],
): Promise<number> => {
  if (goals.length === 0) return 0;
  if (goals.length === 1) return goalTotals.get(goals[0])?.visitors ?? 0;
  return uniqueVisitors(context, [goalFilter(goals), ...extraFilters]);
};

const fetchTimeSeries = async (
  { client, range }: ReportContext,
  metrics: PlausibleMetric[],
  filters: PlausibleFilter[] = [],
): Promise<TimeSeries> => {
  const { results, meta } = await client({
    metrics,
    date_range: dateRangeOf(range),
    dimensions: [`time:${range.granularity}`],
    filters,
    include: { time_labels: true },
  });
  const metricsByBucket = new Map(
    results.map((row) => [String(row.dimensions[0]), row.metrics]),
  );
  return {
    labels: meta?.time_labels ?? [...metricsByBucket.keys()],
    metricsByBucket,
  };
};

const EMPTY_SERIES: TimeSeries = { labels: [], metricsByBucket: new Map() };

const mergeTrend = (traffic: TimeSeries, features: TimeSeries): TrendPoint[] =>
  traffic.labels.map((bucket) => {
    const trafficMetrics = traffic.metricsByBucket.get(bucket);
    return {
      bucket,
      visitors: countAt(trafficMetrics, 0),
      visits: countAt(trafficMetrics, 1),
      pageviews: countAt(trafficMetrics, 2),
      featureUsers: countAt(features.metricsByBucket.get(bucket), 0),
    };
  });

const fetchVisitorTypes = async ({
  client,
  range,
}: ReportContext): Promise<NonNullable<OverviewReport["visitorTypes"]>> => {
  const { results } = await client({
    metrics: ["visitors"],
    date_range: dateRangeOf(range),
    dimensions: [`event:props:${VISITOR_TYPE_PROPERTY}`],
  });
  const visitorsOf = (type: string): number =>
    countAt(results.find((row) => row.dimensions[0] === type)?.metrics, 0);
  return { new: visitorsOf("new"), returning: visitorsOf("returning") };
};

export const buildOverviewReport = async (
  context: ReportContext,
): Promise<OverviewReport> => {
  const { client, range } = context;
  const [totalsResult, goalTotals, visitorTypes, trafficTrend] =
    await Promise.all([
      client({
        metrics: [
          "visitors",
          "visits",
          "pageviews",
          "bounce_rate",
          "visit_duration",
        ],
        date_range: dateRangeOf(range),
      }),
      fetchGoalTotals(context),
      optional(context, () => fetchVisitorTypes(context)),
      fetchTimeSeries(context, ["visitors", "visits", "pageviews"]),
    ]);

  const usageGoals = usageGoalsWithData(ANALYTICS_EVENT_NAMES, goalTotals);
  const [activeFeatureUsers, featureTrend] = await Promise.all([
    visitorsDoingAny(context, usageGoals, goalTotals),
    usageGoals.length
      ? fetchTimeSeries(context, ["visitors"], [goalFilter(usageGoals)])
      : EMPTY_SERIES,
  ]);

  const totals = firstRowMetrics(totalsResult);
  return {
    range,
    generatedAt: context.generatedAt,
    totals: {
      visitors: countAt(totals, 0),
      visits: countAt(totals, 1),
      pageviews: countAt(totals, 2),
      bounceRate: decimalAt(totals, 3),
      visitDurationSeconds: decimalAt(totals, 4),
    },
    visitorTypes,
    activeFeatureUsers,
    trackedEvents: sumOccurrences([...goalTotals.keys()], goalTotals),
    trend: mergeTrend(trafficTrend, featureTrend),
  };
};

const buildFeature = async (
  context: ReportContext,
  feature: (typeof ANALYTICS_FEATURES)[number],
  goalTotals: GoalTotalsByEvent,
  returningGoalTotals: GoalTotalsByEvent | null,
): Promise<FeatureReport> => {
  const events = eventsOfFeature(feature.id);
  const usageGoals = usageGoalsWithData(events, goalTotals);
  const [visitors, returningVisitors] = await Promise.all([
    visitorsDoingAny(context, usageGoals, goalTotals),
    returningGoalTotals
      ? optional(context, () =>
          visitorsDoingAny(
            context,
            usageGoalsWithData(usageGoals, returningGoalTotals),
            returningGoalTotals,
            [RETURNING_FILTER],
          ),
        )
      : null,
  ]);

  return {
    id: feature.id,
    label: feature.label,
    visitors,
    actions: sumOccurrences(usageGoals, goalTotals),
    returningVisitors,
    events: events.map((name) => ({
      name,
      visitors: goalTotals.get(name)?.visitors ?? 0,
      occurrences: goalTotals.get(name)?.occurrences ?? 0,
      returningVisitors: returningGoalTotals
        ? (returningGoalTotals.get(name)?.visitors ?? 0)
        : null,
    })),
  };
};

export const buildFeaturesReport = async (
  context: ReportContext,
): Promise<FeaturesReport> => {
  const [goalTotals, returningGoalTotals] = await Promise.all([
    fetchGoalTotals(context),
    optional(context, () => fetchGoalTotals(context, [RETURNING_FILTER])),
  ]);
  const features = await Promise.all(
    ANALYTICS_FEATURES.map((feature) =>
      buildFeature(context, feature, goalTotals, returningGoalTotals),
    ),
  );
  return {
    range: context.range,
    generatedAt: context.generatedAt,
    features,
    eventsWithoutData: ANALYTICS_EVENT_NAMES.filter(
      (event) => !goalTotals.has(event),
    ),
  };
};

const fetchBreakdown = async (
  { client, range }: ReportContext,
  dimension: string,
): Promise<BreakdownRow[]> => {
  const { results } = await client({
    metrics: ["visitors", "percentage"],
    date_range: dateRangeOf(range),
    dimensions: [dimension],
    pagination: { limit: AUDIENCE_BREAKDOWN_LIMIT },
  });
  return results.map((row) => ({
    label: String(row.dimensions[0] ?? "") || UNKNOWN_LABEL,
    visitors: countAt(row.metrics, 0),
    percentage: decimalAt(row.metrics, 1) ?? 0,
  }));
};

export const buildAudienceReport = async (
  context: ReportContext,
): Promise<AudienceReport> => {
  const [sources, countries, devices, browsers] = await Promise.all([
    fetchBreakdown(context, "visit:source"),
    fetchBreakdown(context, "visit:country_name"),
    fetchBreakdown(context, "visit:device"),
    fetchBreakdown(context, "visit:browser"),
  ]);
  return {
    range: context.range,
    generatedAt: context.generatedAt,
    sources,
    countries,
    devices,
    browsers,
  };
};

export const REPORT_BUILDERS: {
  [S in ReportSection]: (context: ReportContext) => Promise<ReportBySection[S]>;
} = {
  overview: buildOverviewReport,
  features: buildFeaturesReport,
  audience: buildAudienceReport,
};
