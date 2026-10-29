import type { ReactNode, Ref } from "react";
import type { PipPlacement } from "../../types";
import type {
  MediaPlayback,
  SecondaryPresentState,
} from "../../lib/presentChannel";
import { pipFrameStyle } from "../../lib/pipPlacement";
import { ImageSurface } from "../../components/media/ImageSurface";
import {
  VideoSurface,
  type VideoSurfaceHandle,
} from "../../components/media/VideoSurface";
import { StreamVideo } from "../stream/StreamVideo";
import { StreamOverlayLayers } from "../stream/StreamOverlayLayers";
import {
  StreamPipLayer,
  pipFrameClassName,
  pipLabelClassName,
} from "../stream/StreamPipLayer";
import type { StreamPipWindow } from "../stream/lib/streamPipWindow";
import { secondaryLabel } from "./lib/secondaryLabel";
import { cn } from "../../lib/utils";
import type { StreamOverlay } from "../stream/lib/streamOverlay";

interface SecondaryPipContentProps {
  secondary: SecondaryPresentState;
  stream?: MediaStream | null;
  playback?: MediaPlayback;
  videoRef?: Ref<VideoSurfaceHandle>;
  onVideoTime?: (time: number, duration: number) => void;
  onVideoEnded?: () => void;
  forceMuted?: boolean;
  overlays?: StreamOverlay[];
  overlayPreview?: boolean;
  cameras?: StreamPipWindow[];
}

const waitingClassName =
  "absolute inset-0 grid place-items-center p-[4%] text-center text-[clamp(8px,6cqw,13px)] text-white/65";

export const SecondaryPipContent = ({
  secondary,
  stream,
  playback,
  videoRef,
  onVideoTime,
  onVideoEnded,
  forceMuted,
  overlays,
  overlayPreview,
  cameras,
}: SecondaryPipContentProps) => {
  const muted = forceMuted || secondary.muted;
  const item = secondary.item;

  if (secondary.kind === "stream") {
    if (!stream)
      return <div className={waitingClassName}>Waiting for the camera…</div>;
    return (
      <>
        <StreamVideo stream={stream} muted={muted} />
        {cameras && <StreamPipLayer windows={cameras} forceMuted={muted} />}
        {overlays && overlays.length > 0 && (
          <StreamOverlayLayers
            overlays={overlays}
            live
            muted={muted}
            preview={overlayPreview}
          />
        )}
      </>
    );
  }
  if (!item) {
    return (
      <div className={waitingClassName}>
        That item is no longer in the library.
      </div>
    );
  }
  if (secondary.kind === "image") return <ImageSurface item={item} />;
  return (
    <VideoSurface
      ref={videoRef}
      item={item}
      playback={playback}
      forceMuted={muted}
      onTimeUpdate={onVideoTime}
      onEnded={onVideoEnded}
    />
  );
};

export const SecondaryPipFrame = ({
  placement,
  label,
  children,
}: {
  placement: PipPlacement;
  label?: string;
  children: ReactNode;
}) => {
  return (
    <div
      style={pipFrameStyle(placement)}
      className={cn(pipFrameClassName, "z-15")}
    >
      {children}
      {label && (
        <span className={cn(pipLabelClassName, "max-w-[88%]")}>{label}</span>
      )}
    </div>
  );
};

export const SecondaryPip = ({
  showLabel,
  ...content
}: SecondaryPipContentProps & { showLabel?: boolean }) => {
  return (
    <SecondaryPipFrame
      placement={content.secondary.placement}
      label={showLabel ? secondaryLabel(content.secondary) : undefined}
    >
      <SecondaryPipContent {...content} />
    </SecondaryPipFrame>
  );
};
