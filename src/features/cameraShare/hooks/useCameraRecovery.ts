import { useEffect, useRef } from "react";

const HEALTH_CHECK_MS = 4000;
const MUTED_GRACE_MS = 2500;

interface CameraRecoveryOptions {
  isCapturing: boolean;
  stream: MediaStream | null;
  reopen: () => Promise<void>;
}

export const useCameraRecovery = ({
  isCapturing,
  stream,
  reopen,
}: CameraRecoveryOptions): void => {
  const mutedSinceRef = useRef<number | null>(null);
  const isReopeningRef = useRef(false);

  useEffect(() => {
    if (!isCapturing) {
      mutedSinceRef.current = null;
      return;
    }

    const isHealthy = (): boolean => {
      const track = stream?.getVideoTracks()[0];
      if (!track || track.readyState !== "live") return false;
      if (!track.muted) {
        mutedSinceRef.current = null;
        return true;
      }
      if (mutedSinceRef.current === null) mutedSinceRef.current = Date.now();
      return Date.now() - mutedSinceRef.current < MUTED_GRACE_MS;
    };

    const check = async () => {
      if (document.visibilityState !== "visible") return;
      if (isReopeningRef.current || isHealthy()) return;
      mutedSinceRef.current = null;
      isReopeningRef.current = true;
      try {
        await reopen();
      } finally {
        isReopeningRef.current = false;
      }
    };

    const handleCheck = () => void check();

    document.addEventListener("visibilitychange", handleCheck);
    window.addEventListener("pageshow", handleCheck);
    window.addEventListener("focus", handleCheck);

    const track = stream?.getVideoTracks()[0];
    track?.addEventListener("ended", handleCheck);
    track?.addEventListener("mute", handleCheck);
    track?.addEventListener("unmute", handleCheck);

    const timer = window.setInterval(handleCheck, HEALTH_CHECK_MS);

    return () => {
      document.removeEventListener("visibilitychange", handleCheck);
      window.removeEventListener("pageshow", handleCheck);
      window.removeEventListener("focus", handleCheck);
      track?.removeEventListener("ended", handleCheck);
      track?.removeEventListener("mute", handleCheck);
      track?.removeEventListener("unmute", handleCheck);
      window.clearInterval(timer);
    };
  }, [isCapturing, reopen, stream]);
};
