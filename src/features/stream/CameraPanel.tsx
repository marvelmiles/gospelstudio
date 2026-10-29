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
import { cn } from "../../lib/utils";
import { useStore } from "../../store/useStore";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/shared/IconButton";
import { PipPlacementControls } from "@/components/shared/PipPlacementControls";
import { StreamStatusBadge } from "./StreamStatusBadge";
import { connectionBadgeStatus } from "./lib/streamBadge";
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
        <span className="text-[15px] font-semibold text-foreground">
          Cameras
        </span>
        <span className="text-[11.5px] font-bold text-subtle-foreground tabular-nums">
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
        "flex flex-col gap-2.5 rounded-xl border bg-background px-3 py-2.75",
        isPrimary ? "border-primary/45" : "border-border",
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-[9px] bg-secondary",
            isPrimary ? "text-primary-soft" : "text-muted-foreground",
          )}
        >
          <Smartphone size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-bold text-foreground">
            {camera.deviceName}
          </span>
          <span
            className={cn(
              "text-[11px] font-bold tracking-[0.4px] uppercase",
              isPrimary ? "text-primary-soft" : "text-subtle-foreground",
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
              variant="secondary"
              size="sm"
              onClick={() => hideCameraSecondary(camera.deviceId)}
              title="Take this camera off the picture, keeping it connected"
            >
              <PictureInPicture2 size={14} />
              Take off corner
            </Button>
          ) : (
            <Button
              variant="secondary"
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
            variant="secondary"
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
