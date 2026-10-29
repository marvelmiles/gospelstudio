import { useEffect, useRef, useState } from "react";
import {
  Maximize2,
  MonitorOff,
  MonitorUp,
  SwitchCamera,
  X,
} from "lucide-react";
import { useFloatingWindow } from "../../hooks/useFloatingWindow";
import { useViewShortcuts } from "../../hooks/useViewShortcuts";
import { FloatingWindowTab } from "@/components/shared/FloatingWindowTab";
import {
  FloatingWindowHeader,
  floatingWindowClassName,
} from "@/components/shared/FloatingWindowHeader";
import { MiniButton } from "@/components/shared/MiniButton";
import { cn } from "../../lib/utils";
import { AudioSharingPill } from "./AudioSharingPill";
import { CameraStatusOverlay } from "./components/CameraStatusOverlay";
import { StreamStatusBadge } from "./StreamStatusBadge";
import { connectionBadgeStatus } from "./lib/streamBadge";
import { StreamOverlayEditor } from "./StreamOverlayEditor";
import { StreamOverlayLayers } from "./StreamOverlayLayers";
import { StreamPipLayer } from "./StreamPipLayer";
import { cameraPipWindow } from "./lib/streamPipWindow";
import { StreamVideo } from "./StreamVideo";
import { viewCommandTitle } from "../../lib/viewCommands";
import { isPeerConnecting } from "./lib/peerStatus";
import {
  selectStreamOverlay,
  useSelectedStreamOverlayId,
  useStreamOverlays,
} from "./lib/streamOverlayStore";
import {
  endStreamSession,
  primaryCamera,
  secondaryCameras,
  setPrimaryCamera,
  setStreamMode,
  useStreamSession,
} from "./lib/streamSession";
import { useRemoteAudio } from "./lib/useRemoteAudio";
import { useStreamGoLive } from "./lib/useStreamGoLive";

const PIP_WIDTH = 300;
const PIP_MARGIN = 16;
const FALLBACK_CAMERA_NAME = "Phone camera";

export const StreamPip = () => {
  const session = useStreamSession();
  const { isLive, toggleLive } = useStreamGoLive();
  const primary = primaryCamera(session);
  const audio = useRemoteAudio(primary?.stream ?? null);
  const overlays = useStreamOverlays();
  const selectedOverlayId = useSelectedStreamOverlayId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const { position, handleProps, windowProps, stash, zIndex } =
    useFloatingWindow({
      width: PIP_WIDTH,
      margin: PIP_MARGIN,
      estimatedHeight: 220,
      elementRef: rootRef,
    });

  useEffect(() => {
    rootRef.current?.focus();
  }, []);

  /* Only reacts to view shortcuts while focused, so the rest of the app stays usable. */
  useViewShortcuts({
    onTogglePopOut: () => setStreamMode("stage"),
    isArmed: () => Boolean(rootRef.current?.contains(document.activeElement)),
  });

  const cameras = session.cameras;
  const primaryIndex = cameras.findIndex(
    (camera) => camera.deviceId === session.primaryId,
  );
  const nextCamera =
    cameras.length > 1 ? cameras[(primaryIndex + 1) % cameras.length] : null;
  const primaryStatus = primary?.status ?? "connecting";
  const isAwaitingConnection =
    isPeerConnecting(primaryStatus) || !primary?.stream;

  return (
    <>
      <FloatingWindowTab
        stash={stash}
        name="Camera"
        detail={primary?.deviceName || FALLBACK_CAMERA_NAME}
        zIndex={zIndex}
      />
      <div
        ref={rootRef}
        tabIndex={0}
        role="region"
        aria-label="Floating camera"
        onPointerDownCapture={windowProps.onPointerDownCapture}
        onPointerDown={() => rootRef.current?.focus()}
        onFocus={() => setIsFocused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null))
            setIsFocused(false);
        }}
        style={{
          ...windowProps.style,
          left: position.x,
          top: position.y,
          width: PIP_WIDTH,
        }}
        className={cn(
          floatingWindowClassName,
          isFocused ? "border-primary" : "border-border",
        )}
      >
        <FloatingWindowHeader
          handleProps={handleProps}
          title={primary?.deviceName || FALLBACK_CAMERA_NAME}
        >
          <AudioSharingPill
            available={Boolean(primary?.audioShared)}
            muted={audio.muted}
            size="sm"
          />
          {isLive && <StreamStatusBadge status="live" size="sm" />}
        </FloatingWindowHeader>

        <div className="relative aspect-video bg-stage">
          <StreamVideo stream={primary?.stream ?? null} muted={isLive} />
          <StreamPipLayer
            windows={secondaryCameras(session).map(cameraPipWindow)}
            forceMuted={isLive}
          />
          <StreamOverlayLayers
            overlays={overlays}
            live
            muted
            showDrafts
            preview
          />
          <StreamOverlayEditor
            overlays={overlays}
            selectedId={selectedOverlayId}
            onSelect={selectStreamOverlay}
          />
          <CameraStatusOverlay
            status={primaryStatus}
            hasStream={Boolean(primary?.stream)}
            size="compact"
          />
        </div>

        <div className="flex items-center gap-1.25 border-t border-border px-2.25 py-2">
          <MiniButton
            icon={isLive ? MonitorOff : MonitorUp}
            title={
              isLive
                ? "End live. Close the external display."
                : "Go live on the external display"
            }
            danger={isLive}
            disabled={!isLive && isAwaitingConnection}
            onClick={toggleLive}
          />
          {nextCamera && (
            <MiniButton
              icon={SwitchCamera}
              title={`Cut to ${nextCamera.deviceName}`}
              disabled={isAwaitingConnection}
              onClick={() => setPrimaryCamera(nextCamera.deviceId)}
            />
          )}
          <span className="flex min-w-0 flex-1 justify-center">
            <StreamStatusBadge
              status={connectionBadgeStatus(primaryStatus, isLive)}
              size="sm"
            />
          </span>
          <MiniButton
            icon={Maximize2}
            title={viewCommandTitle(
              "Maximise to the full stream window",
              "popOut",
            )}
            onClick={() => setStreamMode("stage")}
          />
          <MiniButton
            icon={X}
            title="Stop. Disconnect every camera."
            danger
            onClick={endStreamSession}
          />
        </div>
      </div>
    </>
  );
};
