import { useEffect } from "react";
import { useMediaQuery } from "usehooks-ts";
import { usePageMeta } from "../../hooks/usePageMeta";
import { useTrackEventWhen } from "../../hooks/useTrackEventOnce";
import { cn } from "../../lib/utils";
import { LoadingArea } from "@/components/shared/LoadingArea";
import { ProductionHeader } from "./header/ProductionHeader";
import { PreviewMonitor } from "./canvas/PreviewMonitor";
import { LivePanel } from "./program/LivePanel";
import { SceneStrip } from "./scenes/SceneStrip";
import { StudioSidebar } from "./sidebar/StudioSidebar";
import { SourceStreamsContext } from "./render/renderSurface";
import { useOperatorStreams } from "./hooks/useOperatorStreams";
import { useStudioShortcuts } from "./hooks/useStudioShortcuts";
import { useProductionSession } from "./hooks/useProductionSession";
import { useProductionStore } from "./store/productionStore";
import { setStudioOpen } from "./store/editorStore";

const WIDE_LAYOUT_QUERY = "(min-width: 75.25rem)";

const useStudioSession = (): void => {
  useProductionSession();
  useEffect(() => {
    setStudioOpen(true);
    return () => setStudioOpen(false);
  }, []);
};

export const StudioPage = () => {
  usePageMeta("studio");
  useStudioSession();
  useStudioShortcuts();
  const isReady = useProductionStore(
    (state) => state.status === "ready" && state.production !== null,
  );
  useTrackEventWhen("Studio Opened", isReady);
  const streams = useOperatorStreams();
  const isWide = useMediaQuery(WIDE_LAYOUT_QUERY);

  if (!isReady) return <LoadingArea />;

  return (
    <SourceStreamsContext.Provider value={streams}>
      <div className="flex h-full min-h-0 flex-col">
        <ProductionHeader />
        {isWide ? <WideLayout /> : <CompactLayout />}
      </div>
    </SourceStreamsContext.Provider>
  );
};

const SidebarCard = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "flex min-h-0 flex-col rounded-2xl border border-border bg-secondary/55 p-3",
      className,
    )}
  >
    <StudioSidebar />
  </div>
);

const WideLayout = () => (
  <div className="grid min-h-0 flex-1 grid-cols-[17.5rem_minmax(0,1fr)_clamp(18.75rem,26%,28rem)] gap-4 p-3 laptop:px-4">
    <SidebarCard />
    <div className="flex min-h-0 min-w-0 flex-col gap-3">
      <PreviewMonitor className="min-h-0 flex-1" fitHeight />
      <SceneStrip />
    </div>
    <LivePanel />
  </div>
);

const CompactLayout = () => (
  <div className="min-h-0 flex-1 overflow-y-auto p-3">
    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(16.25rem,38%)]">
      <PreviewMonitor />
      <LivePanel />
    </div>
    <SceneStrip className="mt-3" />
    <SidebarCard className="mt-3" />
  </div>
);
