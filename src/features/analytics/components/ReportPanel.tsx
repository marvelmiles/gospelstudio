import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Panel, PanelTitle } from "@/components/shared/Panel";
import { LoadingArea } from "@/components/shared/LoadingArea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ReportState } from "../hooks/useAnalyticsReport";

interface ReportPanelProps<T> {
  title: string;
  icon?: LucideIcon;
  info?: ReactNode;
  trailing?: ReactNode;
  state: ReportState<T>;
  className?: string;
  children: (data: T) => ReactNode;
}

export const ReportPanel = <T,>({
  title,
  icon,
  info,
  trailing,
  state,
  className,
  children,
}: ReportPanelProps<T>) => (
  <Panel className={cn("min-w-0", className)}>
    <PanelTitle title={title} icon={icon} info={info} trailing={trailing} />
    <ReportBody state={state}>{children}</ReportBody>
  </Panel>
);

export const ReportBody = <T,>({
  state,
  children,
}: {
  state: ReportState<T>;
  children: (data: T) => ReactNode;
}) => {
  if (state.error) return <ReportError state={state} />;
  if (!state.data) return <LoadingArea size={44} />;
  return (
    <div
      aria-busy={state.isLoading}
      className={cn(
        "transition-opacity duration-200",
        state.isLoading && "opacity-55",
      )}
    >
      {children(state.data)}
    </div>
  );
};

const ReportError = <T,>({ state }: { state: ReportState<T> }) => (
  <Alert variant="destructive">
    <TriangleAlert />
    <AlertTitle>This report didn&apos;t load</AlertTitle>
    <AlertDescription>
      <p className="m-0">{state.error?.message}</p>
      <Button
        variant="secondary"
        size="sm"
        className="mt-2"
        onClick={state.retry}
      >
        <RefreshCw size={14} />
        Try again
      </Button>
    </AlertDescription>
  </Alert>
);
