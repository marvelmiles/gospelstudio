import { useEffect, useRef } from "react";
import { Camera, CameraOff, Loader, Smartphone } from "lucide-react";
import { useResumePlaybackOnVisible } from "../../../hooks/useResumePlaybackOnVisible";
import type { CameraLayer } from "../types/layer";
import type { CameraStatus } from "../types/mediaSource";
import { useSourceState } from "../store/cameraStore";
import { useSources } from "../store/productionStore";
import { useSourceStream } from "../render/renderSurface";
import { ElementPlaceholder } from "./ElementPlaceholder";

const STATUS_TITLES: Partial<Record<CameraStatus, string>> = {
  starting: "Starting the camera",
  denied: "Camera access is blocked",
  missing: "Camera not connected",
  busy: "Camera is busy",
  unsupported: "Cameras are not available here",
  error: "Camera could not start",
};

export const CameraElement = ({ layer }: { layer: CameraLayer }) => {
  const stream = useSourceStream(layer.sourceId);
  const videoRef = useRef<HTMLVideoElement>(null);
  useResumePlaybackOnVisible(videoRef);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.srcObject !== stream) video.srcObject = stream;
    if (stream) void video.play().catch(() => {});
  }, [stream]);

  return (
    <div className="relative size-full bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          objectFit: layer.fit,
          transform: layer.mirror ? "scaleX(-1)" : undefined,
        }}
        className="size-full"
      />
      {!stream && (
        <div className="absolute inset-0">
          <CameraPlaceholder sourceId={layer.sourceId} />
        </div>
      )}
    </div>
  );
};

const CameraPlaceholder = ({ sourceId }: { sourceId: string | null }) => {
  const { status, message } = useSourceState(sourceId);
  const source = useSources().find((entry) => entry.id === sourceId);

  if (!sourceId)
    return (
      <ElementPlaceholder
        icon={Camera}
        title="Choose a camera"
        hint="Select this box, then pick a camera."
      />
    );

  if (source?.type === "remote" && status === "idle")
    return (
      <ElementPlaceholder
        icon={Smartphone}
        title={`${source.deviceLabel} is not connected`}
        hint="Select this box, then press Connect again."
      />
    );

  return (
    <ElementPlaceholder
      icon={status === "starting" ? Loader : CameraOff}
      title={STATUS_TITLES[status] ?? "Waiting for the camera"}
      hint={message ?? undefined}
    />
  );
};
