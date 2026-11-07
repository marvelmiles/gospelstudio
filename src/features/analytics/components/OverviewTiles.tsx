import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Eye,
  Footprints,
  MousePointerClick,
  Repeat,
  Users,
} from "lucide-react";
import { formatCount } from "../../../lib/formatNumber";
import { InfoTip } from "@/components/shared/InfoTip";
import type { OverviewReport } from "../../../lib/analytics/reportTypes";
import {
  formatDuration,
  formatExact,
  formatPercent,
} from "../lib/reportFormat";

interface StatTileProps {
  icon: LucideIcon;
  label: string;
  value: number | null;
  detail?: string;
  info: string;
}

const StatTile = ({
  icon: Icon,
  label,
  value,
  detail,
  info,
}: StatTileProps) => (
  <div className="flex min-w-0 flex-col gap-2 rounded-2xl border bg-card/85 px-4 py-3.5">
    <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
      <Icon size={16} className="shrink-0 text-primary-soft" />
      <span className="min-w-0 leading-tight">{label}</span>
      <InfoTip title={label}>{info}</InfoTip>
    </span>
    <span
      className="text-[28px] leading-none font-semibold text-foreground"
      title={value === null ? undefined : formatExact(value)}
    >
      {value === null ? "Not set up" : formatCount(value)}
    </span>
    {detail && (
      <span className="text-xs leading-snug text-subtle-foreground">
        {detail}
      </span>
    )}
  </div>
);

const visitDetail = ({ totals }: OverviewReport): string | undefined => {
  const parts = [
    totals.visitDurationSeconds !== null &&
      `${formatDuration(totals.visitDurationSeconds)} per visit`,
    totals.bounceRate !== null && `${formatPercent(totals.bounceRate)} bounce`,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : undefined;
};

export const OverviewTiles = ({ report }: { report: OverviewReport }) => {
  const tiles: StatTileProps[] = [
    {
      icon: Users,
      label: "Unique visitors",
      value: report.totals.visitors,
      info: "Plausible's estimate of distinct visitors in this period. It recognises a device for one day only, so a person who comes on three days counts three times in a longer period, and a person on two devices counts twice. It is never a count of real people.",
    },
    {
      icon: Footprints,
      label: "Total visits",
      value: report.totals.visits,
      detail: visitDetail(report),
      info: "Sessions. A visit ends after 30 minutes with no activity, so one visitor can make several visits.",
    },
    {
      icon: Eye,
      label: "Page views",
      value: report.totals.pageviews,
      info: "Every page opened, including moves between pages inside the app. Reloading a page counts again.",
    },
    {
      icon: Repeat,
      label: "Returning visitors",
      value: report.visitorTypes?.returning ?? null,
      detail: report.visitorTypes
        ? `${formatCount(report.visitorTypes.new)} new`
        : undefined,
      info: "Visitors whose browser had already used GospelStudio on an earlier day. Counted once for each day they come back. Shows Not set up until the visitor_type custom property is added in Plausible.",
    },
    {
      icon: MousePointerClick,
      label: "Active feature users",
      value: report.activeFeatureUsers,
      info: "Unique visitors who did at least one tracked action, such as opening the Studio, creating a manuscript or starting a presentation. A person who does many actions still counts once per day.",
    },
    {
      icon: Activity,
      label: "Tracked actions",
      value: report.trackedEvents,
      info: "How many times tracked actions happened, including ends and failures. One visitor creating five manuscripts adds five here and one to Active feature users.",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 min-[900px]:grid-cols-3">
      {tiles.map((tile) => (
        <StatTile key={tile.label} {...tile} />
      ))}
    </div>
  );
};
