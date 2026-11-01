import { useEffect } from "react";
import { useAutoHideChrome } from "../../../hooks/useAutoHideChrome";
import { useProjectionFullscreen } from "../../../hooks/useProjectionFullscreen";
import { useViewShortcuts } from "../../../hooks/useViewShortcuts";
import { documentTitle } from "../../../lib/appInfo";
import { cn } from "../../../lib/utils";
import { ProjectionFullscreenButton } from "@/components/shared/ProjectionFullscreenButton";
import { useOpenerStreams } from "../hooks/useOpenerStreams";
import { useProgramFeed } from "../hooks/useProgramFeed";
import { ProgramStage } from "../render/ProgramStage";
import {
  RenderSurfaceContext,
  SourceStreamsContext,
} from "../render/renderSurface";
import { ScaledStage } from "../render/ScaledStage";
import { TestPattern } from "./TestPattern";

const CHROME_HIDE_DELAY_MS = 2500;

export const StudioOutputWindow = () => {
  const { program, isTesting, hasOperator } = useProgramFeed();
  const streams = useOpenerStreams();
  const { isFullscreen, toggle: toggleFullscreen } = useProjectionFullscreen();
  useViewShortcuts({ onToggleFullscreen: toggleFullscreen });
  const { visible: isChromeVisible } = useAutoHideChrome({
    enabled: isFullscreen,
    delayMs: CHROME_HIDE_DELAY_MS,
  });

  useEffect(() => {
    document.title = documentTitle("Projector screen");
    document.body.classList.add("bg-stage");
  }, []);

  const claimFocus = () => {
    try {
      window.focus();
    } catch {}
  };

  return (
    <div
      onPointerDown={claimFocus}
      className={cn(
        "fixed inset-0 bg-stage",
        !isChromeVisible && "cursor-none",
      )}
    >
      <RenderSurfaceContext.Provider value="output">
        <SourceStreamsContext.Provider value={streams}>
          <ScaledStage background="#000000" fit="stretch" className="size-full">
            <ProgramStage program={program} />
            {isTesting && <TestPattern />}
          </ScaledStage>
        </SourceStreamsContext.Provider>
      </RenderSurfaceContext.Provider>

      {!hasOperator && !isFullscreen && (
        <p className="pointer-events-none absolute inset-x-0 bottom-6 m-0 text-center text-sm text-white/45">
          Waiting for the Studio. Keep the studio open in the other window.
        </p>
      )}

      <ProjectionFullscreenButton
        isFullscreen={isFullscreen}
        visible={isChromeVisible}
        onToggle={toggleFullscreen}
      />
    </div>
  );
};
