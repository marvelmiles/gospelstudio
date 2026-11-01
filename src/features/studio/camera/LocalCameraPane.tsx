import { useState } from "react";
import {
  Camera,
  CameraOff,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "@/components/ui/button";
import {
  refreshDevices,
  requestCameraAccess,
  type CameraFailure,
} from "../lib/cameraService";
import type { InputDevice } from "../store/cameraStore";
import type { LocalCameras } from "../hooks/useLocalCameras";
import { useCameraPreview } from "../hooks/useCameraPreview";
import { CameraNotice } from "./CameraNotice";
import { LiveVideo } from "./LiveVideo";

interface LocalCameraPaneProps {
  local: LocalCameras;
  onSelect: (deviceId: string) => void;
}

export const LocalCameraPane = ({ local, onSelect }: LocalCameraPaneProps) => {
  const { cameras, activeCamera, needsAccess, isSupported } = local;
  const [accessFailure, setAccessFailure] = useState<CameraFailure | null>(
    null,
  );
  const [isAsking, setIsAsking] = useState(false);
  const preview = useCameraPreview(
    needsAccess ? null : (activeCamera?.deviceId ?? null),
  );

  const askForAccess = () => {
    setIsAsking(true);
    void requestCameraAccess()
      .then(setAccessFailure)
      .finally(() => setIsAsking(false));
  };

  if (!isSupported)
    return (
      <CameraNotice
        icon={ShieldAlert}
        title="Cameras are not available here"
        message="Cameras only open on a secure (https) address in a modern browser such as Chrome or Edge. Open GospelStudio from its https address and try again."
      />
    );

  if (needsAccess)
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CameraNotice
          icon={Camera}
          title="Allow camera access"
          message="Your browser asks once before GospelStudio can see your cameras. Choose Allow when it asks. Nothing is recorded or uploaded."
        />
        {accessFailure && (
          <p className="m-0 max-w-110 text-[13px] leading-relaxed text-destructive">
            {accessFailure.message}
          </p>
        )}
        <Button onClick={askForAccess} busy={isAsking}>
          <Camera size={15} />
          Allow camera access
        </Button>
      </div>
    );

  if (cameras.length === 0)
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CameraNotice
          icon={CameraOff}
          title="No camera found"
          message="Plug in a webcam or capture card, then press Look again. To use a phone instead, choose Another device above."
        />
        <Button variant="secondary" onClick={() => void refreshDevices()}>
          <RefreshCw size={15} />
          Look again
        </Button>
      </div>
    );

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
      <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-black">
        <LiveVideo stream={preview.stream} />
        {!preview.stream && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-[13px] leading-relaxed text-white/75">
            {preview.failure ? (
              preview.failure.message
            ) : (
              <LoaderCircle
                className="animate-spin"
                aria-label="Starting the camera"
              />
            )}
          </div>
        )}
      </div>
      <CameraList
        cameras={cameras}
        activeId={activeCamera?.deviceId ?? null}
        onSelect={onSelect}
      />
    </div>
  );
};

const CameraList = ({
  cameras,
  activeId,
  onSelect,
}: {
  cameras: InputDevice[];
  activeId: string | null;
  onSelect: (deviceId: string) => void;
}) => (
  <div role="radiogroup" aria-label="Cameras" className="flex flex-col gap-1.5">
    {cameras.map((camera) => {
      const isActive = camera.deviceId === activeId;
      return (
        <button
          key={camera.deviceId}
          type="button"
          role="radio"
          aria-checked={isActive}
          onClick={() => onSelect(camera.deviceId)}
          className={cn(
            "flex items-center gap-2.5 rounded-[11px] border px-3 py-2.5 text-left text-[13px] font-semibold",
            isActive
              ? "border-primary/50 bg-primary/14 text-foreground"
              : "border-border bg-background text-muted-foreground hover:border-primary/30",
          )}
        >
          <Camera
            size={16}
            className={cn("shrink-0", isActive && "text-primary-soft")}
          />
          <span className="min-w-0 truncate">{camera.label}</span>
        </button>
      );
    })}
  </div>
);
