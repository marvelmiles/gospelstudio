import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import { useMediaQuery } from "usehooks-ts";
import { useFullscreen } from "../../hooks/useFullscreen";
import { useViewShortcuts } from "../../hooks/useViewShortcuts";
import { CameraStatusOverlay } from "./components/CameraStatusOverlay";
import { StreamOverlayEditor } from "./StreamOverlayEditor";
import { StreamOverlayLayers } from "./StreamOverlayLayers";
import { StreamPipLayer, type StreamPipWindow } from "./StreamPipLayer";
import { StreamVideo } from "./StreamVideo";
import { useSavedOverlaySync } from "./lib/useSavedOverlaySync";
import { StageDrawerPanel, type StageDrawer } from "./stage/StageDrawerPanel";
import { StageHeader } from "./stage/StageHeader";
import {
  isPeerConnecting,
  isPeerFailed,
  type PeerStatus,
} from "./lib/peerStatus";
import { isOnAir } from "./lib/streamOverlay";
import {
  selectStreamOverlay,
  useSelectedStreamOverlayId,
  useStreamOverlays,
} from "./lib/streamOverlayStore";
import { useRemoteAudio } from "./lib/useRemoteAudio";
import { useStreamGoLive } from "./lib/useStreamGoLive";

const TABLET_QUERY = "(max-width: 1024px)";

interface ProjectionSurfaceProps {
  stream: MediaStream | null;
  status: PeerStatus;
  deviceName?: string;
  audioShared?: boolean;
  secondaries?: StreamPipWindow[];
  onStop: () => void;
  onPopOut: () => void;
  onLiveChange?: (live: boolean) => void;
  children?: ReactNode;
}

export const ProjectionSurface = ({
  stream,
  status,
  deviceName,
  audioShared = false,
  secondaries = [],
  onStop,
  onPopOut,
  onLiveChange,
  children,
}: ProjectionSurfaceProps) => {
  const { isLive, toggleLive } = useStreamGoLive();
  const audio = useRemoteAudio(stream);
  const isTablet = useMediaQuery(TABLET_QUERY);
  const overlays = useStreamOverlays();
  useSavedOverlaySync(overlays);
  const selectedOverlayId = useSelectedStreamOverlayId();
  const shellRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(shellRef);
  const [drawer, setDrawer] = useState<StageDrawer>("none");

  const isAwaitingConnection = isPeerConnecting(status) || !stream;
  const isDisconnected = isPeerFailed(status);
  const visibleDrawer = isAwaitingConnection ? "none" : drawer;
  const onAirCount = overlays.filter(isOnAir).length;

  useEffect(() => {
    onLiveChange?.(isLive);
  }, [isLive, onLiveChange]);

  useViewShortcuts({
    onTogglePopOut: onPopOut,
    onToggleFullscreen: toggleFullscreen,
  });

  const toggleDrawer = (panel: Exclude<StageDrawer, "none">) =>
    setDrawer((openPanel) => (openPanel === panel ? "none" : panel));

  return (
    <div
      ref={shellRef}
      className="fixed inset-x-0 top-0 z-200 flex h-dvh flex-col overflow-x-hidden overflow-y-auto bg-canvas"
    >
      <StageHeader
        status={status}
        deviceName={deviceName}
        isAwaitingConnection={isAwaitingConnection}
        isDisconnected={isDisconnected}
        isLive={isLive}
        isFullscreen={isFullscreen}
        audioShared={audioShared}
        isAudioMuted={audio.muted}
        secondaryCount={secondaries.length}
        onAirCount={onAirCount}
        drawer={visibleDrawer}
        onToggleAudio={audio.toggleMuted}
        onToggleDrawer={toggleDrawer}
        onToggleFullscreen={toggleFullscreen}
        onPopOut={onPopOut}
        onToggleLive={toggleLive}
        onStop={onStop}
      />

      <div
        className={cn(
          "flex min-h-0 flex-1 items-stretch",
          isTablet ? "flex-col" : "flex-row",
        )}
      >
        <div className="relative min-h-90 flex-1 bg-stage">
          <StreamVideo stream={stream} muted={isLive} />
          <StreamPipLayer
            windows={secondaries}
            showLabels
            forceMuted={isLive}
          />
          {/* You see draft overlays here; the audience only ever sees the ones on air. */}
          <StreamOverlayLayers
            overlays={overlays}
            live
            muted={isLive}
            showDrafts
            preview
          />
          {!isAwaitingConnection && (
            <StreamOverlayEditor
              overlays={overlays}
              selectedId={selectedOverlayId}
              onSelect={selectStreamOverlay}
            />
          )}
          <CameraStatusOverlay status={status} hasStream={Boolean(stream)} />
        </div>

        {visibleDrawer !== "none" && (
          <StageDrawerPanel
            drawer={visibleDrawer}
            isStacked={isTablet}
            isLive={isLive}
            overlays={overlays}
            selectedOverlayId={selectedOverlayId}
            onSelectOverlay={selectStreamOverlay}
          />
        )}
      </div>

      {children}
    </div>
  );
};
