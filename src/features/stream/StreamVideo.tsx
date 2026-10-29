import { type Ref, useEffect, useImperativeHandle, useRef } from "react";
import { cn } from "../../lib/utils";
import { useResumePlaybackOnVisible } from "../../hooks/useResumePlaybackOnVisible";

interface StreamVideoProps {
  stream: MediaStream | null;
  muted?: boolean;
  objectFit?: "cover" | "contain";
  className?: string;
}

/* Phones pad video with thin green edges; zooming in very slightly hides them. */
const EDGE_OVERSCAN = 1.008;

export const StreamVideo = ({
  stream,
  muted,
  objectFit = "cover",
  className,
  ref: forwardedRef,
}: StreamVideoProps & { ref?: Ref<HTMLVideoElement> }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useImperativeHandle(forwardedRef, () => videoRef.current as HTMLVideoElement);
  useResumePlaybackOnVisible(videoRef);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!stream) {
      video.srcObject = null;
      return;
    }
    if (video.srcObject === stream) return;
    video.srcObject = stream;
    void video.play().catch(() => {});
  }, [stream]);

  return (
    <div
      className={cn("relative size-full overflow-hidden bg-stage", className)}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        style={{ objectFit, transform: `scale(${EDGE_OVERSCAN})` }}
        className="block size-full"
      />
    </div>
  );
};
