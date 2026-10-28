import { ChevronLeft, ChevronRight } from "lucide-react";
import { fmtClock } from "../../lib/id";
import type { VideoProgress } from "../../lib/media";
import { cn } from "../../lib/cn";
import { useWindowSize } from "usehooks-ts";
import { StageButton } from "../../components/ui/Button";
import { SlideCanvas } from "../../components/SlideCanvas";
import { ImageSurface } from "../../components/media/ImageSurface";
import { VideoThumb } from "../../components/media/VideoThumb";
import { VideoTimecode } from "../../components/media/VideoTimecode";
import type { StageFrame } from "./stageContent";

interface PresenterBarProps {
  title: string;
  currentLabel: string;
  notes?: string;
  nextFrame: StageFrame | null;
  endLabel: string;
  slideIndex: number;
  total: number;
  elapsed: number;
  paused: boolean;
  videoProgress?: VideoProgress;
  visible: boolean;
  onHoverChange: (hovering: boolean) => void;
  onPrev: () => void;
  onNext: () => void;
}

const labelClassName =
  "text-[10.5px] font-bold tracking-[0.6px] text-accent uppercase";

const counterClassName = "text-xs text-sub tabular-nums";

const NextPreview = ({
  frame,
  endLabel,
}: {
  frame: StageFrame | null;
  endLabel: string;
}) => {
  if (!frame)
    return (
      <div className="grid aspect-video w-55 place-items-center rounded-[7px] bg-white/5 text-[13px] text-dim">
        {endLabel}
      </div>
    );
  const { content } = frame;
  return (
    <div className="w-55 shadow-[0_6px_18px_rgb(0_0_0/0.5)]">
      {content.kind === "text" ? (
        <SlideCanvas
          slide={content.slide}
          style={content.style}
          lineStyles={content.lineStyles}
          bg={content.background}
          bgImage={content.backgroundImage}
          radius={7}
        />
      ) : (
        <div className="relative aspect-video overflow-hidden rounded-[7px]">
          {content.kind === "image" ? (
            <ImageSurface item={content.item} variant="thumb" />
          ) : (
            <VideoThumb item={content.item} />
          )}
        </div>
      )}
    </div>
  );
};

export const PresenterBar = ({
  title,
  currentLabel,
  notes,
  nextFrame,
  endLabel,
  slideIndex,
  total,
  elapsed,
  paused,
  videoProgress,
  visible,
  onHoverChange,
  onPrev,
  onNext,
}: PresenterBarProps) => {
  const { width } = useWindowSize();
  const navigable = total > 1;
  const showNext = width >= 720 && navigable;

  return (
    <div
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      className={cn(
        "fixed inset-x-0 bottom-0 z-20 grid items-center gap-4 border-t border-stage-line bg-stage-overlay-strong px-4.5 py-3 backdrop-blur-md transition-opacity duration-300",
        showNext ? "grid-cols-[1fr_220px_auto]" : "grid-cols-[1fr_auto]",
        visible
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0",
      )}
    >
      <div className="min-w-0">
        <div className={labelClassName}>
          {title} · {currentLabel}
        </div>
        <div
          className={cn(
            "mt-1 max-h-11 overflow-hidden text-[13.5px] leading-[1.45]",
            notes ? "text-white" : "text-dim",
          )}
        >
          {notes || "No presenter notes for this slide."}
        </div>
      </div>

      {showNext && (
        <div>
          <div className={cn(labelClassName, "mb-1.25")}>Up Next</div>
          <NextPreview frame={nextFrame} endLabel={endLabel} />
        </div>
      )}

      <div className="flex items-center gap-3.5">
        <div className="text-right">
          <div className="text-[22px] text-white tabular-nums">
            {fmtClock(elapsed)}
          </div>
          {navigable && (
            <div className={counterClassName}>
              {slideIndex + 1} / {total}
            </div>
          )}
          {videoProgress && (
            <VideoTimecode
              progress={videoProgress}
              className={cn(counterClassName, "block")}
            />
          )}
        </div>
        {navigable && (
          <div
            className={cn(
              "flex gap-1.75",
              paused && "pointer-events-none opacity-40",
            )}
          >
            <StageButton icon={ChevronLeft} title="Previous" onClick={onPrev} />
            <StageButton icon={ChevronRight} title="Next" onClick={onNext} />
          </div>
        )}
      </div>
    </div>
  );
};
