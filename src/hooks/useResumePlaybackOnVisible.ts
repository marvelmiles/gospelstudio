import { useEffect, type RefObject } from "react";

export const useResumePlaybackOnVisible = (
  videoRef: RefObject<HTMLVideoElement | null>,
): void => {
  useEffect(() => {
    const handleVisibilityChange = () => {
      const video = videoRef.current;
      if (document.visibilityState !== "visible" || !video) return;
      if (video.srcObject && video.paused) void video.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [videoRef]);
};
