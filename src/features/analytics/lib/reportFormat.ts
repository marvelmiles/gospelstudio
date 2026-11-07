import type { ReportGranularity } from "../../../lib/analytics/reportPeriods";
import type { ReportRange } from "../../../lib/analytics/reportTypes";

const EXACT = new Intl.NumberFormat("en-US");
const PERCENT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

const formatterFor = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...options });

const DAY_MONTH = formatterFor({ day: "numeric", month: "short" });
const DAY_MONTH_YEAR = formatterFor({
  day: "numeric",
  month: "short",
  year: "numeric",
});
const MONTH_YEAR = formatterFor({ month: "short", year: "numeric" });
const TIME = formatterFor({ hour: "2-digit", minute: "2-digit" });

const naiveUtcDate = (bucket: string): Date =>
  new Date(
    `${bucket.replace(" ", "T")}${bucket.length > 10 ? "" : "T00:00:00"}Z`,
  );

export const formatExact = (value: number): string => EXACT.format(value);

export const formatPercent = (value: number): string =>
  `${PERCENT.format(value)}%`;

export const formatBucket = (
  bucket: string,
  granularity: ReportGranularity,
): string => {
  const date = naiveUtcDate(bucket);
  if (Number.isNaN(date.getTime())) return bucket;
  switch (granularity) {
    case "hour":
      return TIME.format(date);
    case "day":
      return DAY_MONTH.format(date);
    case "week":
      return `Week of ${DAY_MONTH.format(date)}`;
    case "month":
      return MONTH_YEAR.format(date);
  }
};

export const formatRange = ({ from, to, timeZone }: ReportRange): string => {
  const start = DAY_MONTH_YEAR.format(naiveUtcDate(from));
  const end = DAY_MONTH_YEAR.format(naiveUtcDate(to));
  const days = from === to ? start : `${start} to ${end}`;
  return `${days}, ${timeZone.replace(/_/g, " ")} time`;
};

export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return minutes ? `${minutes}m ${rest}s` : `${rest}s`;
};
