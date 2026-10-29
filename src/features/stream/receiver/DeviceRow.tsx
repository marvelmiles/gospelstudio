import { Smartphone, Unplug, Wifi } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "@/components/ui/button";
import { StreamStatusBadge } from "../StreamStatusBadge";
import { connectionBadgeStatus } from "../lib/streamBadge";
import type { DeviceEntry } from "../lib/signaling";
import {
  MAX_STREAM_CAMERAS,
  type StreamCamera,
  type StreamSessionState,
} from "../lib/streamSession";

interface DeviceRowProps {
  device: DeviceEntry;
  camera: StreamCamera | null;
  session: StreamSessionState;
  isFull: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

const cameraRole = (session: StreamSessionState, deviceId: string): string => {
  if (session.primaryId === deviceId) return "Main screen";
  if (session.secondaryIds.includes(deviceId)) return "In a corner";
  return "Ready to cut to";
};

export const DeviceRow = ({
  device,
  camera,
  session,
  isFull,
  onConnect,
  onDisconnect,
}: DeviceRowProps) => {
  const isConnected = camera?.status === "live";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-background px-3.5 py-3",
        isConnected ? "border-primary" : "border-border",
      )}
    >
      <span className="grid size-9.5 shrink-0 place-items-center rounded-[10px] bg-secondary text-primary-soft">
        <Smartphone size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">
          {device.name}
        </span>
        {camera && (
          <span className="text-[11px] font-bold tracking-[0.4px] text-subtle-foreground uppercase">
            {cameraRole(session, device.id)}
          </span>
        )}
      </span>
      {camera ? (
        <>
          <StreamStatusBadge
            status={connectionBadgeStatus(camera.status, false)}
            size="sm"
          />
          <Button
            variant="destructive"
            size="sm"
            title="Disconnect this camera"
            onClick={onDisconnect}
          >
            <Unplug size={14} />
            Drop
          </Button>
        </>
      ) : (
        <Button
          size="sm"
          onClick={onConnect}
          disabled={isFull}
          title={
            isFull
              ? `Already holding ${MAX_STREAM_CAMERAS} cameras. Drop one first.`
              : "Connect this camera"
          }
        >
          <Wifi size={14} />
          Connect
        </Button>
      )}
    </div>
  );
};
