import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useValueChange } from "@/hooks/useValueChange";
import type { PeerStatus } from "./peerStatus";

export type ConnectionPhase =
  "waiting" | "connected" | "reconnecting" | "disconnected";

export const useConnectionLifecycle = (
  status: PeerStatus,
  onDisconnected?: () => void,
): ConnectionPhase => {
  const [hasBeenLive, setHasBeenLive] = useState(status === "live");
  const hasFiredRef = useRef(false);
  const notifyDisconnected = useEffectEvent(() => onDisconnected?.());

  useValueChange(status, (next) => {
    if (next === "live") setHasBeenLive(true);
  });

  useEffect(() => {
    if (hasBeenLive && status === "failed" && !hasFiredRef.current) {
      hasFiredRef.current = true;
      notifyDisconnected();
    }
  }, [hasBeenLive, status]);

  if (status === "live") return "connected";
  if (status === "reconnecting") return "reconnecting";
  if (hasBeenLive && status === "failed") return "disconnected";
  return "waiting";
};
