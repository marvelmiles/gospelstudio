import { useRef, type ReactNode, type RefObject } from "react";
import {
  Maximize2,
  Minimize2,
  Radio,
  RotateCw,
  SwitchCamera,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAutoHideChrome } from "../../hooks/useAutoHideChrome";
import { useFullscreen } from "../../hooks/useFullscreen";
import { Button } from "@/components/ui/button";
import { StageButton } from "@/components/shared/StageButton";
import { Panel, PanelTitle } from "@/components/shared/Panel";
import type { FacingMode } from "../pairing/lib/cameras";
import { usePortraitVideo } from "./hooks/usePortraitVideo";

interface SharingCameraCardProps {
  videoRef: RefObject<HTMLVideoElement | null>;
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
    ? "The Studio hears this microphone. Click to stop sharing it."
    : "Let the Studio hear this device's microphone.";

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
  const chrome = useAutoHideChrome({ enabled: isFullscreen });
  const isPortrait = usePortraitVideo(videoRef);
  const isFrontCamera = facing === "user";

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
          {isPortrait && (
            <p
              role="status"
              className="pointer-events-none absolute inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] m-0 flex justify-center"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-stage-overlay-strong px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur-md">
                <RotateCw size={13} aria-hidden />
                Turn the phone sideways for a sharp, full picture
              </span>
            </p>
          )}
          {isFullscreen && (
            <div
              onPointerEnter={() => chrome.onHoverChange(true)}
              onPointerLeave={() => chrome.onHoverChange(false)}
              className={cn(
                "absolute top-[max(1.375rem,env(safe-area-inset-top))] left-1/2 flex -translate-x-1/2 items-center gap-2.5 rounded-2xl border border-stage-line bg-stage-overlay-strong px-3 py-2.25 shadow-[0_10px_30px_rgb(0_0_0/0.45)] backdrop-blur-[10px] transition-opacity duration-300",
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
              variant={isAudioOn ? "default" : "secondary"}
              size="sm"
              onClick={onToggleAudio}
              title={audioTitle(isAudioOn)}
            >
              {isAudioOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
              {isAudioOn ? "Audio on" : "Include audio"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={toggleFullscreen}
              title="Fill this screen with the camera picture"
            >
              <Maximize2 size={14} />
              Full screen
            </Button>
            {hasMultipleCameras && (
              <Button
                variant="secondary"
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
            <Button variant="destructive" size="sm" onClick={onStop}>
              <X size={14} />
              Stop
            </Button>
          </div>
        )}
      </Panel>
    </div>
  );
};
