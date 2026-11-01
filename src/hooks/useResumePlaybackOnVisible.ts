import { useEffect, type RefObject } from "react";

export const useResumePlaybackOnVisible = (
  mediaRef: RefObject<HTMLMediaElement | null>,
): void => {
  useEffect(() => {
    const handleVisibilityChange = () => {
      const media = mediaRef.current;
      if (document.visibilityState !== "visible" || !media) return;
      if (media.srcObject && media.paused) void media.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [mediaRef]);
};
