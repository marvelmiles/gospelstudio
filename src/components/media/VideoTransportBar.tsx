import { Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { mediaSurfaceProps } from "../../lib/mediaKeys";
import { formatTimecode, needsHoursField } from "../../lib/media";
import { cn } from "../../lib/cn";
import { StageButton } from "../ui/Button";
import { sliderFill } from "../ui/Field";

interface VideoTransportBarProps {
  playing: boolean;
  muted: boolean;
  volume: number;
  time: number;
  start: number;
  end: number;
  onTogglePlaying: () => void;
  onRestart: () => void;
  onToggleMuted: () => void;
  onVolume: (volume: number) => void;
  onSeek: (time: number) => void;
  visible?: boolean;
  onHoverChange?: (hovering: boolean) => void;
  compact?: boolean;
  mediaNoun?: string;
  className?: string;
}

export const VideoTransportBar = ({
  playing,
  muted,
  volume,
  time,
  start,
  end,
  onTogglePlaying,
  onRestart,
  onToggleMuted,
  onVolume,
  onSeek,
  visible = true,
  onHoverChange,
  compact,
  mediaNoun = "video",
  className,
}: VideoTransportBarProps) => {
  const seekMax = Math.max(end, start + 0.1);
  const position = Math.min(Math.max(time, start), seekMax);
  const span = seekMax - start;
  const seekPercent = ((position - start) / span) * 100;
  const level = muted ? 0 : volume;
  const withHours = needsHoursField(span);
  const readout = cn(
    "text-xs tabular-nums",
    withHours ? "min-w-14" : "min-w-10",
  );

  return (
    <div
      {...mediaSurfaceProps}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      className={cn(
        "flex items-center rounded-[14px] border border-stage-line bg-stage-overlay-strong backdrop-blur-[10px] transition-opacity duration-300",
        compact ? "gap-1.5 px-2.25 py-2" : "gap-2.5 px-3 py-2.25",
        visible
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0",
        className,
      )}
    >
      <StageButton
        icon={playing ? Pause : Play}
        title={
          playing ? `Pause ${mediaNoun} (Space)` : `Play ${mediaNoun} (Space)`
        }
        onClick={onTogglePlaying}
      />
      <StageButton
        icon={RotateCcw}
        title="Replay from the trim start"
        onClick={onRestart}
      />
      <span className={cn(readout, "text-right text-white")}>
        {formatTimecode(position - start, withHours)}
      </span>
      <input
        type="range"
        className="slider min-w-0 flex-1"
        aria-label="Playhead"
        min={start}
        max={seekMax}
        step={0.1}
        value={position}
        onChange={(event) => onSeek(Number(event.target.value))}
        style={{ background: sliderFill(seekPercent) }}
      />
      {!compact && (
        <span className={cn(readout, "text-sub")}>
          {formatTimecode(span, withHours)}
        </span>
      )}
      <StageButton
        icon={muted ? VolumeX : Volume2}
        title={muted ? "Unmute (M)" : "Mute (M)"}
        active={muted}
        onClick={onToggleMuted}
      />
      {!compact && (
        <input
          type="range"
          className="slider w-21 shrink-0"
          aria-label="Volume"
          min={0}
          max={100}
          value={level}
          onChange={(event) => onVolume(Number(event.target.value))}
          style={{ background: sliderFill(level) }}
        />
      )}
    </div>
  );
};
