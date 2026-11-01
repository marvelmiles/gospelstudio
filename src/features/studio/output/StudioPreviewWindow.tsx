import { useEffect } from "react";
import { Eye, RefreshCw } from "lucide-react";
import { useAutoHideChrome } from "../../../hooks/useAutoHideChrome";
import { useProjectionFullscreen } from "../../../hooks/useProjectionFullscreen";
import { useViewShortcuts } from "../../../hooks/useViewShortcuts";
import { documentTitle } from "../../../lib/appInfo";
import { cn } from "../../../lib/utils";
import { Button } from "@/components/ui/button";
import { ProjectionFullscreenButton } from "@/components/shared/ProjectionFullscreenButton";
import { useOpenerStreams } from "../hooks/useOpenerStreams";
import { usePreviewFeed } from "../hooks/usePreviewFeed";
import { ProgramStage } from "../render/ProgramStage";
import {
  RenderSurfaceContext,
  SourceStreamsContext,
} from "../render/renderSurface";
import { ScaledStage } from "../render/ScaledStage";

const CHROME_HIDE_DELAY_MS = 2500;

export const StudioPreviewWindow = () => {
  const { shown, latestSceneName, isOutOfDate, hasOperator, update } =
    usePreviewFeed();
  const streams = useOpenerStreams();
  const { isFullscreen, toggle: toggleFullscreen } = useProjectionFullscreen();
  useViewShortcuts({ onToggleFullscreen: toggleFullscreen });
  const { visible: isChromeVisible } = useAutoHideChrome({
    enabled: true,
    delayMs: CHROME_HIDE_DELAY_MS,
  });
  const isBarVisible = isChromeVisible || isOutOfDate || !hasOperator;

  useEffect(() => {
    document.title = documentTitle("Preview");
    document.body.classList.add("bg-stage");
  }, []);

  return (
    <div
      className={cn("fixed inset-0 bg-stage", !isBarVisible && "cursor-none")}
    >
      <RenderSurfaceContext.Provider value="preview">
        <SourceStreamsContext.Provider value={streams}>
          <ScaledStage background="#000000" fit="stretch" className="size-full">
            <ProgramStage program={shown} />
          </ScaledStage>
        </SourceStreamsContext.Provider>
      </RenderSurfaceContext.Provider>

      <div
        role="status"
        className={cn(
          "absolute inset-x-0 bottom-6 flex justify-center px-4 transition-opacity duration-300",
          isBarVisible ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div
          className={cn(
            "flex min-h-11 max-w-full items-center gap-3 rounded-2xl border border-white/12 bg-black/75 py-2 pl-4 text-white shadow-lg backdrop-blur-md",
            isOutOfDate ? "pr-2" : "pr-4",
          )}
        >
          <Eye size={16} className="shrink-0 text-white/70" />
          <span className="min-w-0 truncate text-[13.5px]">
            {!hasOperator
              ? "Waiting for the Studio. Keep the studio open in the other tab."
              : isOutOfDate
                ? `${latestSceneName ?? "The scene"} has changed since this preview.`
                : `Preview of ${shown?.sceneName ?? "your scene"}. This is not on the projector.`}
          </span>
          {isOutOfDate && (
            <Button size="sm" onClick={update} className="shrink-0">
              <RefreshCw />
              Update screen
            </Button>
          )}
        </div>
      </div>

      <ProjectionFullscreenButton
        isFullscreen={isFullscreen}
        visible={isChromeVisible}
        onToggle={toggleFullscreen}
      />
    </div>
  );
};
