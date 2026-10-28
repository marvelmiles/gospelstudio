import { useEffect, useState, type ReactNode, type RefObject } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  MonitorOff,
  MonitorUp,
  Pause,
  Play,
  RotateCcw,
  StickyNote,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useFloatingWindow } from "../../hooks/useFloatingWindow";
import { FloatingWindowTab } from "../../components/ui/FloatingWindowTab";
import { FloatingWindowHeader } from "../../components/ui/FloatingWindowHeader";
import { videoProgressPercent, type VideoProgress } from "../../lib/media";
import { mediaSurfaceProps } from "../../lib/mediaKeys";
import { viewCommandTitle } from "../../lib/viewCommands";
import { SlideCanvas } from "../../components/SlideCanvas";
import { ImageSurface } from "../../components/media/ImageSurface";
import { PortalSlot } from "../../components/ui/PortalSlot";
import { MiniButton } from "../../components/ui/MiniButton";
import { VideoTimecode } from "../../components/media/VideoTimecode";
import type { StageFrame } from "./stageContent";
import { cn } from "../../lib/cn";

const WIDTH = 320;
const MARGIN = 16;

interface PresenterPipProps {
  title: string;
  moduleName: string;
  currentLabel: string;
  notes?: string;
  frame: StageFrame;
  slideIndex: number;
  total: number;
  paused: boolean;
  isLive: boolean;
  videoHost: HTMLElement;
  videoProgress?: VideoProgress;
  videoMuted: boolean;
  onSeekVideo: (time: number) => void;
  onToggleVideoMuted: () => void;
  onRestartVideo: () => void;
  secondaryLayer?: ReactNode;
  secondaryMenu?: ReactNode;
  rootRef: RefObject<HTMLDivElement>;
  onPrev: () => void;
  onNext: () => void;
  onTogglePause: () => void;
  onOpenStage: () => void;
  onGoLive: () => void;
  onStopLive: () => void;
  onExit: () => void;
}

export const PresenterPip = ({
  title,
  moduleName,
  currentLabel,
  notes,
  frame,
  slideIndex,
  total,
  paused,
  isLive,
  videoHost,
  videoProgress,
  videoMuted,
  onSeekVideo,
  onToggleVideoMuted,
  onRestartVideo,
  secondaryLayer,
  secondaryMenu,
  rootRef,
  onPrev,
  onNext,
  onTogglePause,
  onOpenStage,
  onGoLive,
  onStopLive,
  onExit,
}: PresenterPipProps) => {
  const [focused, setFocused] = useState(false);
  const { position, handleProps, windowProps, stash, zIndex } =
    useFloatingWindow({
      width: WIDTH,
      margin: MARGIN,
      estimatedHeight: 260,
      elementRef: rootRef,
    });

  useEffect(() => {
    rootRef.current?.focus();
  }, [rootRef]);

  const { content } = frame;
  const navigable = total > 1;
  const isVideo = content.kind === "video";

  return (
    <>
      <FloatingWindowTab
        stash={stash}
        name={moduleName}
        detail={title}
        zIndex={zIndex}
      />
      <div
        ref={rootRef}
        tabIndex={0}
        role="region"
        aria-label="Floating presenter"
        data-presenter-pip=""
        onPointerDownCapture={windowProps.onPointerDownCapture}
        onPointerDown={() => rootRef.current?.focus()}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null))
            setFocused(false);
        }}
        style={{
          ...windowProps.style,
          left: position.x,
          top: position.y,
          width: WIDTH,
        }}
        className={floatingPanelClassName(focused)}
      >
        <FloatingWindowHeader handleProps={handleProps} title={title}>
          {isLive && <LiveBadge title="Projecting to the audience display" />}
        </FloatingWindowHeader>

        <div
          {...(isVideo ? mediaSurfaceProps : {})}
          className="relative aspect-video bg-black"
        >
          {content.kind === "text" && (
            <SlideCanvas
              slide={content.slide}
              style={content.style}
              lineStyles={content.lineStyles}
              bg={content.background}
              bgImage={content.backgroundImage}
              bgVideo={content.backgroundVideo}
              radius={0}
              fill
            />
          )}
          {content.kind === "image" && (
            <ImageSurface item={content.item} variant="thumb" />
          )}
          {isVideo && <PortalSlot host={videoHost} />}
          {isVideo && videoProgress && (
            <>
              <VideoTimecode
                progress={videoProgress}
                className="absolute bottom-2.5 left-2 rounded-full bg-black/60 px-1.75 py-0.5 text-[10.5px] font-bold text-white"
              />
              <VideoScrubber progress={videoProgress} onSeek={onSeekVideo} />
            </>
          )}
          {secondaryLayer}
        </div>

        {notes && (
          <div className="flex items-start gap-1.75 border-t border-line bg-accent/9 px-2.5 py-2">
            <StickyNote size={13} className="mt-px shrink-0 text-accent-soft" />
            <div className="max-h-16.5 min-w-0 flex-1 overflow-y-auto text-[11.5px] leading-[1.45] font-medium whitespace-pre-line text-fg">
              {notes}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.25 border-t border-line px-2.25 py-2">
          {navigable && (
            <MiniButton
              icon={ChevronLeft}
              title="Previous slide (Left arrow)"
              onClick={onPrev}
            />
          )}
          <MiniButton
            icon={paused ? Play : Pause}
            title={
              isVideo
                ? paused
                  ? "Play the clip (Space)"
                  : "Pause the clip (Space)"
                : paused
                  ? "Resume (Space)"
                  : "Pause (Space)"
            }
            active={paused}
            onClick={onTogglePause}
          />
          {navigable && (
            <MiniButton
              icon={ChevronRight}
              title="Next slide (Right arrow)"
              onClick={onNext}
            />
          )}
          {isVideo && (
            <>
              <MiniButton
                icon={RotateCcw}
                title="Replay the clip from the beginning"
                onClick={onRestartVideo}
              />
              <MiniButton
                icon={videoMuted ? VolumeX : Volume2}
                title={videoMuted ? "Unmute the clip (M)" : "Mute the clip (M)"}
                active={videoMuted}
                onClick={onToggleVideoMuted}
              />
            </>
          )}
          <span className="min-w-0 flex-1 truncate text-center text-[10.5px] font-semibold text-dim tabular-nums">
            {navigable ? `${slideIndex + 1}/${total}` : ""}
            {navigable && currentLabel ? " · " : ""}
            {currentLabel}
          </span>
          {secondaryMenu}
          {isLive ? (
            <MiniButton
              icon={MonitorOff}
              title="Stop live, closing the audience display"
              danger
              onClick={onStopLive}
            />
          ) : (
            <MiniButton
              icon={MonitorUp}
              title="Go live on the audience display"
              onClick={onGoLive}
            />
          )}
          <MiniButton
            icon={Maximize2}
            title={viewCommandTitle(
              "Open the full presentation view",
              "popOut",
            )}
            onClick={onOpenStage}
          />
          <MiniButton
            icon={X}
            title="End presentation (Esc)"
            danger
            onClick={onExit}
          />
        </div>

        <div
          className={cn(
            "px-2.5 pb-2.25 text-[10px] leading-[1.45]",
            focused ? "text-accent-soft" : "text-dim",
          )}
        >
          {focused
            ? "Shortcuts active: arrows, Ctrl+number, P, Esc."
            : "Click this window to use presentation shortcuts."}
        </div>
      </div>
    </>
  );
};

interface VideoScrubberProps {
  progress: VideoProgress;
  onSeek: (time: number) => void;
}

const VideoScrubber = ({ progress, onSeek }: VideoScrubberProps) => {
  const end = Math.max(progress.end, progress.start + 0.1);
  const position = Math.min(Math.max(progress.time, progress.start), end);
  const filled = videoProgressPercent(progress);

  return (
    <input
      type="range"
      className="absolute inset-x-0 bottom-0 scrubber w-full"
      aria-label="Clip position"
      min={progress.start}
      max={end}
      step={0.05}
      value={position}
      onChange={(event) => onSeek(Number(event.target.value))}
      onPointerDown={(event) => event.stopPropagation()}
      style={{
        background: `linear-gradient(90deg, var(--color-accent) ${filled}%, rgb(255 255 255 / 0.2) ${filled}%)`,
      }}
    />
  );
};

const floatingPanelClassName = (focused: boolean): string =>
  cn(
    "fixed overflow-hidden rounded-[14px] border bg-panel-solid/96 backdrop-blur-[18px] backdrop-saturate-150 transition-[border-color,box-shadow] duration-150 outline-none",
    focused
      ? "border-accent/55 shadow-[0_20px_55px_rgb(0_0_0/0.6),0_0_0_3px_rgb(37_99_235/0.18)]"
      : "border-line shadow-[0_18px_45px_rgb(0_0_0/0.5)]",
  );

const LiveBadge = ({ title }: { title: string }) => (
  <span
    title={title}
    className="inline-flex items-center gap-1 rounded-full bg-danger px-1.75 py-0.5 text-[9.5px] font-extrabold tracking-[0.5px] text-on-accent"
  >
    <span className="size-1.25 rounded-full bg-on-accent" />
    LIVE
  </span>
);
