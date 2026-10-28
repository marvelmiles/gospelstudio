import {
  Eye,
  EyeOff,
  MonitorPlay,
  PictureInPicture2,
  Smartphone,
  Unplug,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { PipCorner } from "../../types";
import { cn } from "../../lib/cn";
import { useStore } from "../../store/useStore";
import { Button } from "../../components/ui/Button";
import { IconButton } from "../../components/ui/Button";
import { PipPlacementControls } from "../../components/ui/PipPlacementControls";
import { StreamStatusBadge, connectionBadgeStatus } from "./StreamStatusBadge";
import { AudioSharingPill } from "./AudioSharingPill";
import { toggleCameraPreview, useCameraPreviewIds } from "./lib/cameraPreview";
import {
  disconnectStreamCamera,
  hideCameraSecondary,
  MAX_STREAM_CAMERAS,
  MAX_STREAM_SECONDARIES,
  setCameraMuted,
  setCameraPlacement,
  setPrimaryCamera,
  showCameraAsSecondary,
  useStreamSession,
  type StreamCamera,
  type StreamSessionState,
} from "./lib/streamSession";

interface CameraPanelProps {
  isLive?: boolean;
}

export const CameraPanel = ({ isLive = false }: CameraPanelProps) => {
  const session = useStreamSession();
  const previewIds = useCameraPreviewIds();
  const pushToast = useStore((s) => s.pushToast);

  if (session.cameras.length === 0) return null;

  const canPreview = session.cameras.length > 1;

  const cornersInUse = session.secondaryIds.flatMap((id) => {
    const camera = session.cameras.find((entry) => entry.deviceId === id);
    return camera ? [camera.placement.corner] : [];
  });

  const handleShowInCorner = (camera: StreamCamera) => {
    if (showCameraAsSecondary(camera.deviceId)) return;
    pushToast(
      `Only ${MAX_STREAM_SECONDARIES} cameras can sit in the corners at once. Take one off first.`,
      "error",
    );
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline gap-2">
        <span className="text-[15px] font-semibold text-fg">Cameras</span>
        <span className="text-[11.5px] font-bold text-dim tabular-nums">
          {session.cameras.length} of {MAX_STREAM_CAMERAS}
        </span>
      </div>

      {session.cameras.map((camera) => (
        <CameraRow
          key={camera.deviceId}
          camera={camera}
          session={session}
          isLive={isLive}
          cornersInUse={cornersInUse}
          canPreview={canPreview}
          previewing={previewIds.includes(camera.deviceId)}
          onShowInCorner={() => handleShowInCorner(camera)}
        />
      ))}
    </div>
  );
};

const CameraRow = ({
  camera,
  session,
  isLive,
  cornersInUse,
  canPreview,
  previewing,
  onShowInCorner,
}: {
  camera: StreamCamera;
  session: StreamSessionState;
  isLive: boolean;
  cornersInUse: PipCorner[];
  canPreview: boolean;
  previewing: boolean;
  onShowInCorner: () => void;
}) => {
  const isPrimary = session.primaryId === camera.deviceId;
  const slot = session.secondaryIds.indexOf(camera.deviceId);
  const isSecondary = slot >= 0;
  const role = isPrimary
    ? "Main screen"
    : isSecondary
      ? `Corner ${slot + 1}`
      : "Off screen";

  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 rounded-xl border bg-canvas px-3 py-2.75",
        isPrimary ? "border-accent/45" : "border-line",
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-[9px] bg-raise",
            isPrimary ? "text-accent-soft" : "text-sub",
          )}
        >
          <Smartphone size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-bold text-fg">
            {camera.deviceName}
          </span>
          <span
            className={cn(
              "text-[11px] font-bold tracking-[0.4px] uppercase",
              isPrimary ? "text-accent-soft" : "text-dim",
            )}
          >
            {role}
          </span>
        </span>
        <StreamStatusBadge
          status={connectionBadgeStatus(camera.status, isPrimary && isLive)}
          size="sm"
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.75">
        {!isPrimary && (
          <Button
            variant="primary"
            size="sm"
            disabled={camera.status === "failed"}
            onClick={() => setPrimaryCamera(camera.deviceId)}
            title={
              camera.status === "failed"
                ? "This camera has stopped sharing"
                : "Show this camera on the main screen"
            }
          >
            <MonitorPlay size={14} />
            Main screen
          </Button>
        )}
        {!isPrimary &&
          (isSecondary ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => hideCameraSecondary(camera.deviceId)}
              title="Take this camera off the picture, keeping it connected"
            >
              <PictureInPicture2 size={14} />
              Take off corner
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowInCorner}
              title="Show this camera in a corner of the picture"
            >
              <PictureInPicture2 size={14} />
              Show in corner
            </Button>
          ))}
        {canPreview && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleCameraPreview(camera.deviceId)}
            title={
              previewing
                ? "Close this camera's floating preview"
                : "Watch this camera in a floating window, without putting it on screen"
            }
          >
            {previewing ? <EyeOff size={14} /> : <Eye size={14} />}
            {previewing ? "Close preview" : "Preview"}
          </Button>
        )}
        <span className="flex-1" />
        <AudioSharingPill
          available={camera.audioShared}
          muted={isPrimary ? false : camera.muted}
          size="sm"
        />
        {camera.audioShared && !isPrimary && (
          <IconButton
            icon={camera.muted ? VolumeX : Volume2}
            size="sm"
            filled
            active={camera.muted}
            title={
              camera.muted
                ? "Let this corner window be heard"
                : "Silence this corner window"
            }
            onClick={() => setCameraMuted(camera.deviceId, !camera.muted)}
          />
        )}
        <IconButton
          icon={Unplug}
          size="sm"
          filled
          danger
          title="Disconnect this camera"
          onClick={() => disconnectStreamCamera(camera.deviceId)}
        />
      </div>

      {isSecondary && (
        <PipPlacementControls
          placement={camera.placement}
          takenCorners={cornersInUse}
          onChange={(patch) => setCameraPlacement(camera.deviceId, patch)}
        />
      )}
    </div>
  );
};
