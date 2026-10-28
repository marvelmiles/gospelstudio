import { useEffect, useRef, useState } from "react";
import type { PeerStatus } from "./peerStatus";

export type ConnectionPhase =
  "waiting" | "connected" | "reconnecting" | "disconnected";

export const useConnectionLifecycle = (
  status: PeerStatus,
  onDisconnected?: () => void,
): ConnectionPhase => {
  const [hasBeenLive, setHasBeenLive] = useState(false);
  const hasFiredRef = useRef(false);
  const onDisconnectedRef = useRef(onDisconnected);

  useEffect(() => {
    onDisconnectedRef.current = onDisconnected;
  });

  useEffect(() => {
    if (status === "live") setHasBeenLive(true);
  }, [status]);

  useEffect(() => {
    if (hasBeenLive && status === "failed" && !hasFiredRef.current) {
      hasFiredRef.current = true;
      onDisconnectedRef.current?.();
    }
  }, [hasBeenLive, status]);

  if (status === "live") return "connected";
  if (status === "reconnecting") return "reconnecting";
  if (hasBeenLive && status === "failed") return "disconnected";
  return "waiting";
};
