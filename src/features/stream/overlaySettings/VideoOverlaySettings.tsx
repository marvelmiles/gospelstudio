import {
  Pause,
  Play,
  Repeat,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../../lib/cn";
import { formatDuration } from "../../../lib/media";
import { OverlaySelect, OverlaySlider } from "../OverlayControls";
import type { ContentOverlay } from "../lib/streamOverlay";
import {
  seekStreamOverlayVideo,
  setStreamOverlayVideo,
} from "../lib/streamOverlayStore";
import { useOverlayVideoProgress } from "../lib/overlayVideoProgress";
import { VIDEO_JUMP_SECONDS } from "./overlayOptions";
import { PLAYBACK_RATE_OPTIONS } from "../../../lib/mediaOptions";

export const VideoOverlaySettings = ({
  overlay,
}: {
  overlay: ContentOverlay;
}) => {
  const { time, duration } = useOverlayVideoProgress(overlay.id);
  const { video } = overlay;
  const scrubberEnd = duration > 0 ? duration : Math.max(time, 0.1);

  const jumpBy = (seconds: number) =>
    seekStreamOverlayVideo(
      overlay.id,
      Math.min(scrubberEnd, Math.max(0, time + seconds)),
    );

  return (
    <>
      <div className="flex items-center gap-1.5">
        <TransportButton
          icon={video.playing ? Pause : Play}
          label={video.playing ? "Pause the clip" : "Play the clip"}
          isAccent={!video.playing}
          onClick={() =>
            setStreamOverlayVideo(overlay.id, { playing: !video.playing })
          }
        />
        <TransportButton
          icon={SkipBack}
          label={`Jump back ${VIDEO_JUMP_SECONDS} seconds`}
          onClick={() => jumpBy(-VIDEO_JUMP_SECONDS)}
        />
        <TransportButton
          icon={SkipForward}
          label={`Jump forward ${VIDEO_JUMP_SECONDS} seconds`}
          onClick={() => jumpBy(VIDEO_JUMP_SECONDS)}
        />
        <TransportButton
          icon={RotateCcw}
          label="Start the clip again"
          onClick={() => seekStreamOverlayVideo(overlay.id, 0)}
        />
        <TransportButton
          icon={video.muted ? VolumeX : Volume2}
          label={video.muted ? "Unmute the clip" : "Mute the clip"}
          onClick={() =>
            setStreamOverlayVideo(overlay.id, { muted: !video.muted })
          }
        />
        <TransportButton
          icon={Repeat}
          label={video.loop ? "Stop looping the clip" : "Loop the clip"}
          isAccent={video.loop}
          onClick={() =>
            setStreamOverlayVideo(overlay.id, { loop: !video.loop })
          }
        />
      </div>

      <label className="block">
        <span className="mb-1 flex justify-between text-[11.5px] font-semibold text-dim tabular-nums">
          <span>{formatDuration(time)}</span>
          <span>{formatDuration(duration > 0 ? duration : 0)}</span>
        </span>
        <input
          type="range"
          min={0}
          max={scrubberEnd}
          step={0.1}
          value={Math.min(time, scrubberEnd)}
          aria-label="Clip position"
          onChange={(event) =>
            seekStreamOverlayVideo(overlay.id, Number(event.target.value))
          }
          className="w-full accent-accent"
        />
      </label>

      <OverlaySlider
        label="Volume"
        value={video.volume}
        min={0}
        max={100}
        suffix="%"
        onChange={(volume) => setStreamOverlayVideo(overlay.id, { volume })}
      />

      <OverlaySelect
        label="Speed"
        value={String(video.rate)}
        options={PLAYBACK_RATE_OPTIONS}
        onChange={(value) =>
          setStreamOverlayVideo(overlay.id, { rate: Number(value) })
        }
      />
    </>
  );
};

const TransportButton = ({
  icon: Icon,
  label,
  onClick,
  isAccent,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  isAccent?: boolean;
}) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    onClick={onClick}
    className={cn(
      "grid size-7.5 shrink-0 place-items-center rounded-lg border bg-raise",
      isAccent ? "border-accent text-accent-soft" : "border-line text-sub",
    )}
  >
    <Icon size={14} />
  </button>
);
