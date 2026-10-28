import {
  Layers,
  Maximize2,
  Minimize2,
  MonitorPlay,
  MonitorX,
  PictureInPicture2,
  Video,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { keepsSelectionProps } from "../../../lib/selectionScope";
import { viewCommandTitle } from "../../../lib/viewCommands";
import { AudioSharingPill } from "../AudioSharingPill";
import { StreamStatusBadge, connectionBadgeStatus } from "../StreamStatusBadge";
import type { PeerStatus } from "../lib/peerStatus";
import type { StageDrawer } from "./StageDrawerPanel";

interface StageHeaderProps {
  status: PeerStatus;
  deviceName?: string;
  isAwaitingConnection: boolean;
  isDisconnected: boolean;
  isLive: boolean;
  isFullscreen: boolean;
  audioShared: boolean;
  isAudioMuted: boolean;
  secondaryCount: number;
  onAirCount: number;
  drawer: StageDrawer;
  onToggleAudio: () => void;
  onToggleDrawer: (drawer: Exclude<StageDrawer, "none">) => void;
  onToggleFullscreen: () => void;
  onPopOut: () => void;
  onToggleLive: () => void;
  onStop: () => void;
}

export const StageHeader = ({
  status,
  deviceName,
  isAwaitingConnection,
  isDisconnected,
  isLive,
  isFullscreen,
  audioShared,
  isAudioMuted,
  secondaryCount,
  onAirCount,
  drawer,
  onToggleAudio,
  onToggleDrawer,
  onToggleFullscreen,
  onPopOut,
  onToggleLive,
  onStop,
}: StageHeaderProps) => {
  const waitingTitle = isAwaitingConnection
    ? "Available once the camera connects"
    : undefined;

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line bg-raise px-3.5 py-2.5">
      <span className="inline-flex min-w-0 flex-wrap items-center gap-2.5">
        <StreamStatusBadge status={connectionBadgeStatus(status, isLive)} />
        <AudioSharingPill available={audioShared} muted={isAudioMuted} />
        {deviceName && (
          <span className="min-w-0 truncate text-[13px] font-semibold text-fg">
            {deviceName}
          </span>
        )}
      </span>

      <div className="flex flex-wrap gap-2">
        {audioShared && (
          <Button
            variant={isAudioMuted ? "ghost" : "primary"}
            size="sm"
            onClick={onToggleAudio}
            disabled={isAwaitingConnection}
            title={
              waitingTitle ??
              (isAudioMuted
                ? "Unmute the sender's audio"
                : "Mute the sender's audio")
            }
          >
            {isAudioMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            {isAudioMuted ? "Unmute audio" : "Mute audio"}
          </Button>
        )}
        <Button
          variant={drawer === "cameras" ? "primary" : "ghost"}
          size="sm"
          onClick={() => onToggleDrawer("cameras")}
          disabled={isAwaitingConnection}
          title={
            waitingTitle ??
            "Choose which camera fills the screen and which sit in the corners"
          }
        >
          <Video size={14} />
          {secondaryCount > 0 ? `Cameras (+${secondaryCount})` : "Cameras"}
        </Button>
        <span {...keepsSelectionProps} className="inline-flex">
          <Button
            variant={drawer === "overlays" ? "primary" : "ghost"}
            size="sm"
            onClick={() => onToggleDrawer("overlays")}
            disabled={isAwaitingConnection}
            title={
              waitingTitle ??
              "Passages, manuscripts, pictures, clips and announcements over the camera"
            }
          >
            <Layers size={14} />
            {onAirCount > 0 ? `Overlays (${onAirCount} on air)` : "Overlays"}
          </Button>
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleFullscreen}
          title={viewCommandTitle(
            isFullscreen ? "Exit fullscreen" : "Fullscreen",
            "fullscreen",
          )}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onPopOut}
          title={viewCommandTitle(
            "Shrink the stage into the floating window and keep using the app",
            "popOut",
          )}
        >
          <PictureInPicture2 size={14} />
          Pop out
        </Button>
        <Button
          variant={isLive ? "danger" : "primary"}
          size="sm"
          onClick={onToggleLive}
          disabled={!isLive && (isAwaitingConnection || isDisconnected)}
          title={waitingTitle}
        >
          {isLive ? <MonitorX size={14} /> : <MonitorPlay size={14} />}
          {isLive ? "End live" : "Go live"}
        </Button>
        <Button variant="danger" size="sm" onClick={onStop}>
          <X size={14} />
          Stop
        </Button>
      </div>
    </div>
  );
};
