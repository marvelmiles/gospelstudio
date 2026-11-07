export const REPORT_PERIODS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "last7Days", label: "Last 7 days" },
  { id: "last30Days", label: "Last 30 days" },
  { id: "thisWeek", label: "This week" },
  { id: "lastWeek", label: "Last week" },
  { id: "thisMonth", label: "This month" },
  { id: "lastMonth", label: "Last month" },
  { id: "custom", label: "Custom range" },
] as const;

export type ReportPeriod = (typeof REPORT_PERIODS)[number]["id"];

export const REPORT_PERIOD_IDS = REPORT_PERIODS.map((period) => period.id) as [
  ReportPeriod,
  ...ReportPeriod[],
];

export const DEFAULT_REPORT_PERIOD: ReportPeriod = "last7Days";

export const DEFAULT_REPORT_TIME_ZONE = "Africa/Lagos";

export const EARLIEST_REPORT_DAY = "2020-01-01";

const MAX_CUSTOM_RANGE_DAYS = 731;

export type ReportGranularity = "hour" | "day" | "week" | "month";

export interface DayRange {
  from: string;
  to: string;
}

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toUtcDate = (day: string): Date => new Date(`${day}T00:00:00Z`);

const toDay = (date: Date): string => date.toISOString().slice(0, 10);

const isCalendarDay = (value: string): boolean =>
  DAY_PATTERN.test(value) && toDay(toUtcDate(value)) === value;

export const addDays = (day: string, amount: number): string =>
  toDay(new Date(toUtcDate(day).getTime() + amount * MS_PER_DAY));

export const daysInRange = ({ from, to }: DayRange): number =>
  Math.round(
    (toUtcDate(to).getTime() - toUtcDate(from).getTime()) / MS_PER_DAY,
  ) + 1;

const startOfWeek = (day: string): string => {
  const mondayOffset = (toUtcDate(day).getUTCDay() + 6) % 7;
  return addDays(day, -mondayOffset);
};

const startOfMonth = (day: string): string => `${day.slice(0, 7)}-01`;

export const isValidTimeZone = (timeZone: string): boolean => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
};

export const todayIn = (timeZone: string, now: Date): string => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
};

export const resolvePresetRange = (
  period: Exclude<ReportPeriod, "custom">,
  today: string,
): DayRange => {
  switch (period) {
    case "today":
      return { from: today, to: today };
    case "yesterday": {
      const yesterday = addDays(today, -1);
      return { from: yesterday, to: yesterday };
    }
    case "last7Days":
      return { from: addDays(today, -6), to: today };
    case "last30Days":
      return { from: addDays(today, -29), to: today };
    case "thisWeek":
      return { from: startOfWeek(today), to: today };
    case "lastWeek": {
      const thisWeek = startOfWeek(today);
      return { from: addDays(thisWeek, -7), to: addDays(thisWeek, -1) };
    }
    case "thisMonth":
      return { from: startOfMonth(today), to: today };
    case "lastMonth": {
      const lastDayOfLastMonth = addDays(startOfMonth(today), -1);
      return {
        from: startOfMonth(lastDayOfLastMonth),
        to: lastDayOfLastMonth,
      };
    }
  }
};

export const customRangeProblem = (
  range: DayRange,
  today: string,
): string | null => {
  if (!isCalendarDay(range.from) || !isCalendarDay(range.to))
    return "Dates must be real calendar days written as YYYY-MM-DD.";
  if (range.from > range.to)
    return "The start date must be on or before the end date.";
  if (range.to > today) return "The end date cannot be in the future.";
  if (range.from < EARLIEST_REPORT_DAY)
    return `Reports start on ${EARLIEST_REPORT_DAY}.`;
  if (daysInRange(range) > MAX_CUSTOM_RANGE_DAYS)
    return `A custom range can cover at most ${MAX_CUSTOM_RANGE_DAYS} days.`;
  return null;
};

export const granularityFor = (range: DayRange): ReportGranularity => {
  const days = daysInRange(range);
  if (days <= 1) return "hour";
  if (days <= 62) return "day";
  if (days <= 366) return "week";
  return "month";
};
