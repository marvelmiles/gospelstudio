import {
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
} from "react";
import { useResizeObserver } from "usehooks-ts";
import { ChartLine, Table2 } from "lucide-react";
import { cn } from "../../../lib/utils";
import { formatCount } from "../../../lib/formatNumber";
import type { ReportGranularity } from "../../../lib/analytics/reportPeriods";
import type { TrendPoint } from "../../../lib/analytics/reportTypes";
import { Button } from "@/components/ui/button";
import { SegmentedTabs } from "@/components/shared/SegmentedTabs";
import { evenlySpacedIndexes, niceTicks } from "../lib/chartScale";
import { formatBucket, formatExact } from "../lib/reportFormat";

type TrendMetric = Exclude<keyof TrendPoint, "bucket">;
type TrendView = "people" | "traffic";

interface TrendSeries {
  metric: TrendMetric;
  label: string;
  strokeClassName: string;
  fillClassName: string;
  swatchClassName: string;
}

const PRIMARY_SERIES = {
  strokeClassName: "stroke-primary-soft",
  fillClassName: "fill-primary-soft",
  swatchClassName: "bg-primary-soft",
};

const SECONDARY_SERIES = {
  strokeClassName: "stroke-chart-2",
  fillClassName: "fill-chart-2",
  swatchClassName: "bg-chart-2",
};

const TREND_VIEWS: Record<TrendView, TrendSeries[]> = {
  people: [
    { metric: "visitors", label: "Unique visitors", ...PRIMARY_SERIES },
    {
      metric: "featureUsers",
      label: "Active feature users",
      ...SECONDARY_SERIES,
    },
  ],
  traffic: [
    { metric: "visits", label: "Visits", ...PRIMARY_SERIES },
    { metric: "pageviews", label: "Page views", ...SECONDARY_SERIES },
  ],
};

const VIEW_TABS = [
  { id: "people" as const, label: "People" },
  { id: "traffic" as const, label: "Traffic" },
];

const CHART_HEIGHT = 230;
const MARGIN = { top: 12, right: 14, bottom: 28, left: 46 };
const MIN_LABEL_SPACING = 78;
const TOOLTIP_WIDTH = 190;

interface TrendChartProps {
  points: TrendPoint[];
  granularity: ReportGranularity;
}

export const TrendChart = ({ points, granularity }: TrendChartProps) => {
  const [view, setView] = useState<TrendView>("people");
  const [isTableShown, setIsTableShown] = useState(false);
  const series = TREND_VIEWS[view];

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="w-full max-w-56">
          <SegmentedTabs
            tabs={VIEW_TABS}
            value={view}
            onChange={setView}
            ariaLabel="Trend to show"
            minSegmentWidth={90}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-[13px] text-muted-foreground">
            {series.map((entry) => (
              <li key={entry.metric} className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className={cn(
                    "h-0.5 w-3.5 rounded-full",
                    entry.swatchClassName,
                  )}
                />
                {entry.label}
              </li>
            ))}
          </ul>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsTableShown((shown) => !shown)}
          >
            {isTableShown ? <ChartLine size={14} /> : <Table2 size={14} />}
            {isTableShown ? "Show chart" : "Show table"}
          </Button>
        </div>
      </div>
      {isTableShown ? (
        <TrendTable points={points} granularity={granularity} />
      ) : (
        <LinePlot points={points} series={series} granularity={granularity} />
      )}
    </div>
  );
};

interface LinePlotProps {
  points: TrendPoint[];
  series: TrendSeries[];
  granularity: ReportGranularity;
}

const LinePlot = ({ points, series, granularity }: LinePlotProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width = 0 } = useResizeObserver({
    ref: containerRef as RefObject<HTMLDivElement>,
  });
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const plotWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const plotHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;
  const maxValue = Math.max(
    0,
    ...points.flatMap((point) => series.map((entry) => point[entry.metric])),
  );
  const ticks = niceTicks(maxValue, 4);
  const topValue = ticks[ticks.length - 1];
  const lastIndex = points.length - 1;

  const xAt = (index: number): number =>
    MARGIN.left +
    (lastIndex <= 0 ? plotWidth / 2 : (index * plotWidth) / lastIndex);
  const yAt = (value: number): number =>
    MARGIN.top + plotHeight - (value / topValue) * plotHeight;

  const linePath = (metric: TrendMetric): string =>
    points
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"}${xAt(index).toFixed(1)},${yAt(point[metric]).toFixed(1)}`,
      )
      .join(" ");

  const labelIndexes = evenlySpacedIndexes(
    points.length,
    Math.max(2, Math.floor(plotWidth / MIN_LABEL_SPACING)),
  );

  const indexAtPointer = (event: PointerEvent<SVGSVGElement>): number => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio =
      (event.clientX - bounds.left - MARGIN.left) / (plotWidth || 1);
    return Math.min(lastIndex, Math.max(0, Math.round(ratio * lastIndex)));
  };

  const moveWithKeys = (event: KeyboardEvent<SVGSVGElement>): void => {
    const current = activeIndex ?? lastIndex;
    const next =
      event.key === "ArrowLeft"
        ? current - 1
        : event.key === "ArrowRight"
          ? current + 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? lastIndex
              : null;
    if (next === null) return;
    event.preventDefault();
    setActiveIndex(Math.min(lastIndex, Math.max(0, next)));
  };

  const activePoint = activeIndex === null ? null : points[activeIndex];
  const tooltipLeft =
    activeIndex === null
      ? 0
      : Math.min(
          Math.max(xAt(activeIndex) - TOOLTIP_WIDTH / 2, 0),
          Math.max(0, width - TOOLTIP_WIDTH),
        );

  if (points.length === 0)
    return (
      <p className="m-0 py-10 text-center text-sm text-muted-foreground">
        No data for this period yet.
      </p>
    );

  return (
    <div ref={containerRef} className="relative min-w-0">
      {width > 0 && (
        <svg
          width={width}
          height={CHART_HEIGHT}
          role="img"
          tabIndex={0}
          aria-label={`${series.map((entry) => entry.label).join(" and ")} over ${points.length} periods. Use the arrow keys to read each period, or show the table.`}
          className="block touch-pan-y rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          onPointerMove={(event) => setActiveIndex(indexAtPointer(event))}
          onPointerLeave={() => setActiveIndex(null)}
          onFocus={() => setActiveIndex((current) => current ?? lastIndex)}
          onBlur={() => setActiveIndex(null)}
          onKeyDown={moveWithKeys}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={MARGIN.left}
                x2={MARGIN.left + plotWidth}
                y1={yAt(tick)}
                y2={yAt(tick)}
                className="stroke-foreground/8"
                strokeWidth={1}
              />
              <text
                x={MARGIN.left - 8}
                y={yAt(tick)}
                dy="0.32em"
                textAnchor="end"
                className="fill-subtle-foreground text-[11px] tabular-nums"
              >
                {formatCount(tick)}
              </text>
            </g>
          ))}
          {labelIndexes.map((index) => (
            <text
              key={points[index].bucket}
              x={xAt(index)}
              y={CHART_HEIGHT - 8}
              textAnchor={
                index === 0 && lastIndex > 0
                  ? "start"
                  : index === lastIndex && lastIndex > 0
                    ? "end"
                    : "middle"
              }
              className="fill-subtle-foreground text-[11px]"
            >
              {formatBucket(points[index].bucket, granularity)}
            </text>
          ))}
          {activeIndex !== null && (
            <line
              x1={xAt(activeIndex)}
              x2={xAt(activeIndex)}
              y1={MARGIN.top}
              y2={MARGIN.top + plotHeight}
              className="stroke-foreground/25"
              strokeWidth={1}
            />
          )}
          {series.map((entry) => (
            <path
              key={entry.metric}
              d={linePath(entry.metric)}
              fill="none"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              className={entry.strokeClassName}
            />
          ))}
          {series.map((entry) => {
            const index = activeIndex ?? lastIndex;
            return (
              <circle
                key={entry.metric}
                cx={xAt(index)}
                cy={yAt(points[index][entry.metric])}
                r={4}
                strokeWidth={2}
                className={cn(entry.fillClassName, "stroke-secondary")}
              />
            );
          })}
        </svg>
      )}
      {activePoint && (
        <div
          aria-live="polite"
          className="pointer-events-none absolute top-0 z-10 grid gap-1.5 rounded-lg border bg-popover px-3 py-2 text-[12.5px] shadow-overlay"
          style={{ left: tooltipLeft, width: TOOLTIP_WIDTH }}
        >
          <span className="text-subtle-foreground">
            {formatBucket(activePoint.bucket, granularity)}
          </span>
          {series.map((entry) => (
            <span key={entry.metric} className="flex items-center gap-2">
              <span
                aria-hidden
                className={cn(
                  "h-0.5 w-3 shrink-0 rounded-full",
                  entry.swatchClassName,
                )}
              />
              <strong className="font-semibold text-foreground tabular-nums">
                {formatExact(activePoint[entry.metric])}
              </strong>
              <span className="truncate text-muted-foreground">
                {entry.label}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const TABLE_COLUMNS: { metric: TrendMetric; label: string }[] = [
  { metric: "visitors", label: "Unique visitors" },
  { metric: "visits", label: "Visits" },
  { metric: "pageviews", label: "Page views" },
  { metric: "featureUsers", label: "Active feature users" },
];

const TrendTable = ({
  points,
  granularity,
}: {
  points: TrendPoint[];
  granularity: ReportGranularity;
}) => (
  <div className="max-h-80 overflow-auto rounded-lg border">
    <table className="w-full min-w-120 border-collapse text-[13px]">
      <thead className="sticky top-0 bg-secondary">
        <tr className="text-left text-[11.5px] tracking-[0.4px] text-subtle-foreground uppercase">
          <th scope="col" className="px-3 py-2 font-semibold">
            Period
          </th>
          {TABLE_COLUMNS.map((column) => (
            <th
              key={column.metric}
              scope="col"
              className="px-3 py-2 text-right font-semibold"
            >
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {points.map((point) => (
          <tr key={point.bucket} className="border-t">
            <th
              scope="row"
              className="px-3 py-1.5 text-left font-normal text-foreground"
            >
              {formatBucket(point.bucket, granularity)}
            </th>
            {TABLE_COLUMNS.map((column) => (
              <td
                key={column.metric}
                className="px-3 py-1.5 text-right text-muted-foreground tabular-nums"
              >
                {formatExact(point[column.metric])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
