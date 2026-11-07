import { useCallback, useState } from "react";
import {
  AppWindow,
  ChartLine,
  Globe,
  Layers,
  Link2,
  LogOut,
  RefreshCw,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import {
  DEFAULT_REPORT_PERIOD,
  DEFAULT_REPORT_TIME_ZONE,
  todayIn,
} from "../../lib/analytics/reportPeriods";
import type {
  AudienceReport,
  BreakdownRow,
  FeaturesReport,
} from "../../lib/analytics/reportTypes";
import { PageHeader, pageClassName } from "@/components/shared/PageHeader";
import { Panel, PanelTitle } from "@/components/shared/Panel";
import { Button } from "@/components/ui/button";
import { useAdminKey } from "./hooks/useAdminKey";
import { useAnalyticsReport } from "./hooks/useAnalyticsReport";
import type { ReportSelection } from "./lib/reportApi";
import { formatCount } from "../../lib/formatNumber";
import { formatPercent, formatRange } from "./lib/reportFormat";
import { AdminKeyForm } from "./components/AdminKeyForm";
import { ReportBody, ReportPanel } from "./components/ReportPanel";
import { ReportFilters } from "./components/ReportFilters";
import { OverviewTiles } from "./components/OverviewTiles";
import { TrendChart } from "./components/TrendChart";
import { RankedBars, type RankedBarItem } from "./components/RankedBars";
import { FeatureTable } from "./components/FeatureTable";
import { MeasurementNotes } from "./components/MeasurementNotes";

const PAGE_TITLE = "Analytics";
const PAGE_SUBTITLE = "Visitors and feature use, measured with Plausible";
const REJECTED_KEY_MESSAGE =
  "That admin key was not accepted. Check it and try again.";

const featureBars = (report: FeaturesReport): RankedBarItem[] =>
  [...report.features]
    .filter((feature) => feature.visitors > 0)
    .sort((a, b) => b.visitors - a.visitors)
    .map((feature) => ({
      key: feature.id,
      label: feature.label,
      value: feature.visitors,
      detail: `${formatCount(feature.actions)} actions`,
    }));

const breakdownBars = (rows: BreakdownRow[]): RankedBarItem[] =>
  rows.map((row) => ({
    key: row.label,
    label: row.label,
    value: row.visitors,
    detail: formatPercent(row.percentage),
  }));

const AUDIENCE_LISTS: {
  key: keyof Omit<AudienceReport, "range" | "generatedAt">;
  title: string;
  icon: LucideIcon;
}[] = [
  { key: "sources", title: "Sources", icon: Link2 },
  { key: "countries", title: "Countries", icon: Globe },
  { key: "devices", title: "Devices", icon: Smartphone },
  { key: "browsers", title: "Browsers", icon: AppWindow },
];

interface AnalyticsReportsProps {
  adminKey: string;
  onSignOut: () => void;
  onRejected: () => void;
}

const AnalyticsReports = ({
  adminKey,
  onSignOut,
  onRejected,
}: AnalyticsReportsProps) => {
  const [selection, setSelection] = useState<ReportSelection>({
    period: DEFAULT_REPORT_PERIOD,
  });
  const [reloadToken, setReloadToken] = useState(0);
  const [today] = useState(() => todayIn(DEFAULT_REPORT_TIME_ZONE, new Date()));

  const overview = useAnalyticsReport(
    "overview",
    selection,
    adminKey,
    reloadToken,
    onRejected,
  );
  const features = useAnalyticsReport(
    "features",
    selection,
    adminKey,
    reloadToken,
    onRejected,
  );
  const audience = useAnalyticsReport(
    "audience",
    selection,
    adminKey,
    reloadToken,
    onRejected,
  );
  const isLoading =
    overview.isLoading || features.isLoading || audience.isLoading;
  const range =
    overview.data?.range ?? features.data?.range ?? audience.data?.range;

  return (
    <>
      <PageHeader
        title={PAGE_TITLE}
        subtitle={PAGE_SUBTITLE}
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              disabled={isLoading}
              onClick={() => setReloadToken((token) => token + 1)}
            >
              <RefreshCw size={14} />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={onSignOut}>
              <LogOut size={14} />
              Sign out
            </Button>
          </>
        }
      />
      <ReportFilters
        selection={selection}
        today={today}
        onChange={setSelection}
      />
      {range && (
        <p className="mt-0 mb-4 text-[13px] text-muted-foreground">
          Showing {formatRange(range)}
        </p>
      )}

      <div className="grid gap-4">
        <ReportBody state={overview}>
          {(report) => (
            <div className="grid gap-4">
              <OverviewTiles report={report} />
              <Panel className="min-w-0">
                <PanelTitle
                  title="Trend"
                  icon={ChartLine}
                  info="Each point is counted on its own. Unique visitors in a point are never added up to make the period total above."
                />
                <TrendChart
                  points={report.trend}
                  granularity={report.range.granularity}
                />
              </Panel>
            </div>
          )}
        </ReportBody>

        <ReportPanel
          title="Feature engagement"
          icon={Layers}
          info="Unique visitors who used each feature, how many actions they took and how many of them were returning visitors."
          state={features}
        >
          {(report) => (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
              <div className="min-w-0">
                <h3 className="mt-0 mb-3 text-[13px] font-semibold text-muted-foreground">
                  Most used, by unique visitors
                </h3>
                <RankedBars
                  items={featureBars(report)}
                  unit="unique visitors"
                  emptyMessage="No feature use recorded in this period."
                />
              </div>
              <div className="min-w-0">
                <FeatureTable report={report} />
              </div>
            </div>
          )}
        </ReportPanel>

        <ReportPanel
          title="Where visitors come from"
          icon={Globe}
          info="Top ten of each, by unique visitors. The percentage is each row's share of all visitors in the period."
          state={audience}
        >
          {(report) => (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {AUDIENCE_LISTS.map(({ key, title, icon: Icon }) => (
                <section key={key} className="min-w-0">
                  <h3 className="mt-0 mb-3 flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground">
                    <Icon size={15} className="text-primary-soft" />
                    {title}
                  </h3>
                  <RankedBars
                    items={breakdownBars(report[key])}
                    unit="unique visitors"
                    emptyMessage="No visits in this period."
                  />
                </section>
              ))}
            </div>
          )}
        </ReportPanel>

        <MeasurementNotes />
      </div>
    </>
  );
};

export const AnalyticsDashboardPage = () => {
  useDocumentTitle(PAGE_TITLE);
  const { adminKey, saveAdminKey, clearAdminKey } = useAdminKey();
  const [keyProblem, setKeyProblem] = useState<string | null>(null);

  const rejectKey = useCallback(() => {
    clearAdminKey();
    setKeyProblem(REJECTED_KEY_MESSAGE);
  }, [clearAdminKey]);

  const openWithKey = (key: string) => {
    setKeyProblem(null);
    saveAdminKey(key);
  };

  return (
    <div className={pageClassName}>
      {adminKey ? (
        <AnalyticsReports
          key={adminKey}
          adminKey={adminKey}
          onSignOut={clearAdminKey}
          onRejected={rejectKey}
        />
      ) : (
        <>
          <PageHeader title={PAGE_TITLE} subtitle={PAGE_SUBTITLE} />
          <AdminKeyForm problem={keyProblem} onSubmit={openWithKey} />
        </>
      )}
    </div>
  );
};
