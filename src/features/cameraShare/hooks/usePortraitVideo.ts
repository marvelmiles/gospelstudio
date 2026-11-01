import { useEffect, useState, type RefObject } from "react";

export const usePortraitVideo = (
  videoRef: RefObject<HTMLVideoElement | null>,
): boolean => {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const measure = () => setIsPortrait(video.videoHeight > video.videoWidth);
    measure();
    video.addEventListener("resize", measure);
    video.addEventListener("loadedmetadata", measure);
    return () => {
      video.removeEventListener("resize", measure);
      video.removeEventListener("loadedmetadata", measure);
    };
  }, [videoRef]);

  return isPortrait;
};
