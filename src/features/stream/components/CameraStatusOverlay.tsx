import { WifiOff } from "lucide-react";
import { Spinner } from "../../../components/ui/Spinner";
import { cn } from "../../../lib/cn";
import { isPeerConnecting, type PeerStatus } from "../lib/peerStatus";

interface CameraStatusOverlayProps {
  status: PeerStatus;
  hasStream: boolean;
  size?: "stage" | "compact";
}

interface OverlayCopy {
  title: string;
  detail: string;
  isBusy: boolean;
  isBlocking: boolean;
}

const overlayCopy = (
  status: PeerStatus,
  hasStream: boolean,
): OverlayCopy | null => {
  if (status === "failed") {
    return {
      title: "The camera disconnected",
      detail: "Open Cameras to switch, or press Stop.",
      isBusy: false,
      isBlocking: true,
    };
  }
  if (status === "reconnecting") {
    return {
      title: "Reconnecting to the camera",
      detail: "The sharing device went quiet. It resumes when it wakes.",
      isBusy: true,
      isBlocking: false,
    };
  }
  if (isPeerConnecting(status) || !hasStream) {
    return {
      title: "Waiting for the camera to connect",
      detail: "Keep the sharing device open and on the same WiFi.",
      isBusy: true,
      isBlocking: true,
    };
  }
  return null;
};

export const CameraStatusOverlay = ({
  status,
  hasStream,
  size = "stage",
}: CameraStatusOverlayProps) => {
  const copy = overlayCopy(status, hasStream);
  if (!copy) return null;
  const isCompact = size === "compact";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "absolute inset-0 z-5 grid place-items-center text-center",
        isCompact ? "p-2.5" : "p-6",
        copy.isBlocking ? "bg-stage/72" : "bg-stage/40",
        copy.isBlocking && !isCompact
          ? "pointer-events-auto"
          : "pointer-events-none",
      )}
    >
      <div
        className={cn(
          "flex flex-col items-center",
          isCompact ? "gap-1.5" : "gap-3",
        )}
      >
        {copy.isBusy ? (
          <Spinner size={isCompact ? 18 : 34} />
        ) : (
          <WifiOff size={isCompact ? 18 : 30} className="text-white" />
        )}
        <div
          className={cn(
            "text-white",
            isCompact ? "text-xs font-semibold" : "text-lg font-bold",
          )}
        >
          {copy.title}
        </div>
        {!isCompact && (
          <div className="text-[13.5px] text-white/70">{copy.detail}</div>
        )}
      </div>
    </div>
  );
};
