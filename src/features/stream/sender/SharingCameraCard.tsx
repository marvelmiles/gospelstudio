import { useRef, type ReactNode, type RefObject } from "react";
import {
  Maximize2,
  Minimize2,
  Radio,
  SwitchCamera,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { cn } from "../../../lib/cn";
import { useAutoHideChrome } from "../../../hooks/useAutoHideChrome";
import { useFullscreen } from "../../../hooks/useFullscreen";
import { Button, StageButton } from "../../../components/ui/Button";
import { Panel, PanelTitle } from "../../../components/ui/Panel";
import type { FacingMode } from "../lib/cameras";

interface SharingCameraCardProps {
  videoRef: RefObject<HTMLVideoElement>;
  badge?: ReactNode;
  statusLine?: ReactNode;
  isAudioOn: boolean;
  onToggleAudio: () => void;
  facing: FacingMode;
  hasMultipleCameras: boolean;
  onFlip: () => void;
  onStop: () => void;
}

const audioTitle = (isAudioOn: boolean): string =>
  isAudioOn
    ? "Audio is shared with the other device. Click to mute."
    : "Include this device's microphone in the stream.";

const flipTitle = (isFrontCamera: boolean): string =>
  isFrontCamera ? "Switch to the back camera" : "Switch to the front camera";

export const SharingCameraCard = ({
  videoRef,
  badge,
  statusLine,
  isAudioOn,
  onToggleAudio,
  facing,
  hasMultipleCameras,
  onFlip,
  onStop,
}: SharingCameraCardProps) => {
  const shellRef = useRef<HTMLDivElement>(null);
  const {
    isFullscreen,
    fillStyle,
    toggle: toggleFullscreen,
  } = useFullscreen(shellRef);
  /* In full screen the buttons hide, and come back on a touch, click or mouse move. */
  const chrome = useAutoHideChrome({ enabled: isFullscreen });
  const isFrontCamera = facing === "user";

  /* Controls are hidden, not removed, so the camera picture keeps playing. */
  return (
    <div
      ref={shellRef}
      style={(isFullscreen && fillStyle) || undefined}
      className={cn(isFullscreen && "flex size-full bg-black")}
    >
      <Panel
        className={cn(
          isFullscreen &&
            "flex min-w-0 flex-1 flex-col rounded-none border-none bg-black p-0",
        )}
      >
        {!isFullscreen && (
          <PanelTitle icon={Radio} title="Your camera" trailing={badge} />
        )}
        <div
          onPointerDown={chrome.wake}
          onPointerMove={chrome.wake}
          className={cn(
            "relative overflow-hidden bg-stage",
            isFullscreen ? "min-h-0 flex-1" : "aspect-video rounded-xl",
          )}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn(
              "block size-full",
              isFullscreen ? "object-contain" : "object-cover",
            )}
          />
          {isFullscreen && (
            <div
              onPointerEnter={() => chrome.onHoverChange(true)}
              onPointerLeave={() => chrome.onHoverChange(false)}
              className={cn(
                "absolute bottom-5.5 left-1/2 flex -translate-x-1/2 items-center gap-2.5 rounded-2xl border border-stage-line bg-stage-overlay-strong px-3 py-2.25 shadow-[0_10px_30px_rgb(0_0_0/0.45)] backdrop-blur-[10px] transition-opacity duration-300",
                chrome.visible
                  ? "pointer-events-auto opacity-100"
                  : "pointer-events-none opacity-0",
              )}
            >
              <StageButton
                icon={isAudioOn ? Volume2 : VolumeX}
                title={audioTitle(isAudioOn)}
                active={isAudioOn}
                solid
                onClick={onToggleAudio}
              />
              {hasMultipleCameras && (
                <StageButton
                  icon={SwitchCamera}
                  title={flipTitle(isFrontCamera)}
                  solid
                  onClick={onFlip}
                />
              )}
              <StageButton
                icon={Minimize2}
                title="Leave full screen"
                solid
                onClick={toggleFullscreen}
              />
            </div>
          )}
        </div>

        {!isFullscreen && statusLine}

        {!isFullscreen && (
          <div className="mt-3.5 flex flex-wrap gap-2">
            <Button
              variant={isAudioOn ? "primary" : "ghost"}
              size="sm"
              onClick={onToggleAudio}
              title={audioTitle(isAudioOn)}
            >
              {isAudioOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
              {isAudioOn ? "Audio on" : "Include audio"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              title="Fill this screen with the camera, the way the other device shows it"
            >
              <Maximize2 size={14} />
              Full screen
            </Button>
            {hasMultipleCameras && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onFlip}
                title={flipTitle(isFrontCamera)}
              >
                <SwitchCamera
                  size={14}
                  className={cn(isFrontCamera && "-scale-x-100")}
                />
                Switch camera
              </Button>
            )}
            <Button variant="danger" size="sm" onClick={onStop}>
              <X size={14} />
              Stop
            </Button>
          </div>
        )}
      </Panel>
    </div>
  );
};
