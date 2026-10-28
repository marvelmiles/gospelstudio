import { useEffect, useRef } from "react";
import { useAutoHideChrome } from "../../hooks/useAutoHideChrome";
import { useProjectionFullscreen } from "../../hooks/useProjectionFullscreen";
import { useViewShortcuts } from "../../hooks/useViewShortcuts";
import { ProjectionFullscreenButton } from "../../components/ui/ProjectionFullscreenButton";
import { StreamOverlayLayers } from "./StreamOverlayLayers";
import { StreamPipLayer } from "./StreamPipLayer";
import { StreamVideo } from "./StreamVideo";
import { useMirroredStreamOverlays } from "./lib/streamOverlayStore";
import { useOpenerLiveComposition } from "./lib/useOpenerComposition";
import { useOverlayContentSync } from "./lib/useOverlayContentSync";
import { documentTitle } from "../../lib/appInfo";

const HINT_DELAY_MS = 2500;

export const StreamWindow = () => {
  const overlays = useMirroredStreamOverlays();
  useOverlayContentSync(overlays);
  const composition = useOpenerLiveComposition();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isFullscreen, toggle: toggleFullscreen } = useProjectionFullscreen();
  useViewShortcuts({ onToggleFullscreen: toggleFullscreen });
  const { visible: isChromeVisible } = useAutoHideChrome({
    enabled: isFullscreen,
    delayMs: HINT_DELAY_MS,
  });
  const stream = composition.primary;

  useEffect(() => {
    document.title = documentTitle("Live camera");
    document.body.classList.add("bg-stage");
  }, []);

  const claimFocus = () => {
    try {
      window.focus();
    } catch {}
    void videoRef.current?.play().catch(() => {});
  };

  return (
    <div onPointerDown={claimFocus} className="fixed inset-0 bg-stage">
      <StreamVideo ref={videoRef} stream={stream} />

      <StreamPipLayer windows={composition.secondaries} />

      <StreamOverlayLayers overlays={overlays} live />

      {!stream && (
        <div className="absolute inset-0 grid place-items-center text-[15px] text-white/60">
          Waiting for the camera…
        </div>
      )}

      <ProjectionFullscreenButton
        isFullscreen={isFullscreen}
        visible={isChromeVisible}
        onToggle={toggleFullscreen}
      />
    </div>
  );
};
