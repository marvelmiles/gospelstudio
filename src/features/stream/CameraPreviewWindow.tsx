import { useState } from "react";
import { MonitorPlay, Volume2, VolumeX, X } from "lucide-react";
import { cn } from "../../lib/cn";
import { useFloatingWindow } from "../../hooks/useFloatingWindow";
import { IconButton } from "../../components/ui/Button";
import { FloatingWindowTab } from "../../components/ui/FloatingWindowTab";
import {
  FloatingWindowHeader,
  floatingWindowClassName,
} from "../../components/ui/FloatingWindowHeader";
import { StreamStatusBadge, connectionBadgeStatus } from "./StreamStatusBadge";
import { StreamVideo } from "./StreamVideo";
import { CameraStatusOverlay } from "./components/CameraStatusOverlay";
import { closeCameraPreview, useCameraPreviewIds } from "./lib/cameraPreview";
import {
  findCamera,
  setPrimaryCamera,
  useStreamSession,
  type StreamCamera,
  type StreamSessionState,
} from "./lib/streamSession";

const WIDTH = 268;

export const CameraPreviewWindows = () => {
  const previewIds = useCameraPreviewIds();
  const session = useStreamSession();

  if (previewIds.length === 0) return null;

  return (
    <>
      {previewIds.map((deviceId, index) => {
        const camera = findCamera(session, deviceId);
        if (!camera) return null;
        return (
          <CameraPreviewWindow
            key={deviceId}
            camera={camera}
            session={session}
            index={index}
          />
        );
      })}
    </>
  );
};

const CameraPreviewWindow = ({
  camera,
  session,
  index,
}: {
  camera: StreamCamera;
  session: StreamSessionState;
  index: number;
}) => {
  const { ref, position, handleProps, windowProps, stash, zIndex } =
    useFloatingWindow({
      width: WIDTH,
      estimatedHeight: 200,
      offsetIndex: index,
    });
  const [muted, setMuted] = useState(true);
  const isPrimary = session.primaryId === camera.deviceId;
  const disconnected = camera.status === "failed";

  return (
    <>
      <FloatingWindowTab
        stash={stash}
        name="Preview"
        detail={camera.deviceName}
        zIndex={zIndex}
      />
      <div
        ref={ref}
        role="region"
        aria-label={`Preview of ${camera.deviceName}`}
        onPointerDownCapture={windowProps.onPointerDownCapture}
        style={{
          ...windowProps.style,
          left: position.x,
          top: position.y,
          width: WIDTH,
        }}
        className={cn(floatingWindowClassName, "border-line")}
      >
        <FloatingWindowHeader
          handleProps={handleProps}
          title={camera.deviceName}
        >
          <StreamStatusBadge
            status={connectionBadgeStatus(camera.status, false)}
            size="sm"
          />
        </FloatingWindowHeader>

        <div className="relative aspect-video bg-stage">
          <StreamVideo stream={camera.stream} muted={muted} />
          <CameraStatusOverlay
            status={camera.status}
            hasStream={Boolean(camera.stream)}
            size="compact"
          />
        </div>

        <div className="flex items-center gap-1.5 border-t border-line px-2 py-1.75">
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-[11px] font-bold tracking-[0.4px] uppercase",
              isPrimary ? "text-accent-soft" : "text-dim",
            )}
          >
            {isPrimary ? "Main screen" : "Preview only"}
          </span>
          {camera.audioShared && (
            <IconButton
              icon={muted ? VolumeX : Volume2}
              size="sm"
              active={muted}
              title={muted ? "Listen to this preview" : "Silence this preview"}
              onClick={() => setMuted(!muted)}
            />
          )}
          {!isPrimary && (
            <IconButton
              icon={MonitorPlay}
              size="sm"
              disabled={disconnected}
              title={
                disconnected
                  ? "This camera has stopped sharing"
                  : "Cut to this camera on the main screen"
              }
              onClick={() => setPrimaryCamera(camera.deviceId)}
            />
          )}
          <IconButton
            icon={X}
            size="sm"
            title="Close this preview"
            onClick={() => closeCameraPreview(camera.deviceId)}
          />
        </div>
      </div>
    </>
  );
};
