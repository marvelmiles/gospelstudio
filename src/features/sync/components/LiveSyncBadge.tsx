import { Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRealtimeStore } from "../../realtime/realtimeStore";
import { useSyncStore } from "../syncStore";

const LIVE_HINT = "Changes from your other devices arrive as they happen.";

export const LiveSyncBadge = () => {
  const isConnected = useRealtimeStore((state) => state.status === "connected");
  const phase = useSyncStore((state) => state.phase);
  if (!isConnected || phase === "paused" || phase === "offline") return null;

  return (
    <Badge variant="soft" title={LIVE_HINT} aria-label={`Live. ${LIVE_HINT}`}>
      <Radio aria-hidden />
      Live
    </Badge>
  );
};
