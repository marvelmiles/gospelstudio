import { z } from "zod";
import { ANALYTICS_FEATURES, type AnalyticsFeature } from "./analyticsEvents";
import { REPORT_PERIOD_IDS } from "./reportPeriods";

export const ANALYTICS_REPORT_ENDPOINT = "/api/analytics/report";

const REPORT_SECTIONS = ["overview", "features", "audience"] as const;

export type ReportSection = (typeof REPORT_SECTIONS)[number];

const daySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const reportQuerySchema = z
  .object({
    section: z.enum(REPORT_SECTIONS),
    period: z.enum(REPORT_PERIOD_IDS),
    from: daySchema.optional(),
    to: daySchema.optional(),
  })
  .strict()
  .refine(
    (query) =>
      query.period === "custom"
        ? Boolean(query.from && query.to)
        : !query.from && !query.to,
    {
      message:
        "Send from and to only with the custom period, and send both of them.",
    },
  );

const countSchema = z.number().int().nonnegative();

const featureIds = ANALYTICS_FEATURES.map((feature) => feature.id) as [
  AnalyticsFeature,
  ...AnalyticsFeature[],
];

const reportRangeSchema = z.object({
  from: daySchema,
  to: daySchema,
  timeZone: z.string(),
  granularity: z.enum(["hour", "day", "week", "month"]),
});

export type ReportRange = z.infer<typeof reportRangeSchema>;

const reportMetaSchema = {
  range: reportRangeSchema,
  generatedAt: z.string(),
};

const overviewReportSchema = z.object({
  ...reportMetaSchema,
  totals: z.object({
    visitors: countSchema,
    visits: countSchema,
    pageviews: countSchema,
    bounceRate: z.number().nonnegative().nullable(),
    visitDurationSeconds: z.number().nonnegative().nullable(),
  }),
  visitorTypes: z
    .object({
      new: countSchema,
      returning: countSchema,
    })
    .nullable(),
  activeFeatureUsers: countSchema,
  trackedEvents: countSchema,
  trend: z.array(
    z.object({
      bucket: z.string(),
      visitors: countSchema,
      visits: countSchema,
      pageviews: countSchema,
      featureUsers: countSchema,
    }),
  ),
});

export type OverviewReport = z.infer<typeof overviewReportSchema>;

export type TrendPoint = OverviewReport["trend"][number];

const eventReportSchema = z.object({
  name: z.string(),
  visitors: countSchema,
  occurrences: countSchema,
  returningVisitors: countSchema.nullable(),
});

const featureReportSchema = z.object({
  id: z.enum(featureIds),
  label: z.string(),
  visitors: countSchema,
  actions: countSchema,
  returningVisitors: countSchema.nullable(),
  events: z.array(eventReportSchema),
});

export type FeatureReport = z.infer<typeof featureReportSchema>;

const featuresReportSchema = z.object({
  ...reportMetaSchema,
  features: z.array(featureReportSchema),
  eventsWithoutData: z.array(z.string()),
});

export type FeaturesReport = z.infer<typeof featuresReportSchema>;

const breakdownRowSchema = z.object({
  label: z.string(),
  visitors: countSchema,
  percentage: z.number().nonnegative(),
});

export type BreakdownRow = z.infer<typeof breakdownRowSchema>;

const audienceReportSchema = z.object({
  ...reportMetaSchema,
  sources: z.array(breakdownRowSchema),
  countries: z.array(breakdownRowSchema),
  devices: z.array(breakdownRowSchema),
  browsers: z.array(breakdownRowSchema),
});

export type AudienceReport = z.infer<typeof audienceReportSchema>;

export interface ReportBySection {
  overview: OverviewReport;
  features: FeaturesReport;
  audience: AudienceReport;
}

export const REPORT_SCHEMAS = {
  overview: overviewReportSchema,
  features: featuresReportSchema,
  audience: audienceReportSchema,
} satisfies { [S in ReportSection]: z.ZodType<ReportBySection[S]> };

export const reportErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});
