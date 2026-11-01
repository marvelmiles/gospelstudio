import { useEffect, useRef } from "react";
import { cn } from "../../../lib/utils";

interface LiveVideoProps {
  stream: MediaStream | null;
  mirror?: boolean;
  className?: string;
}

export const LiveVideo = ({ stream, mirror, className }: LiveVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.srcObject !== stream) video.srcObject = stream;
    if (stream) void video.play().catch(() => {});
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      style={{ transform: mirror ? "scaleX(-1)" : undefined }}
      className={cn("size-full bg-black object-cover", className)}
    />
  );
};
