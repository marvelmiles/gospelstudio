import type { PipCorner } from "../../types";
import type { StreamPipWindow } from "./lib/streamPipWindow";
import { pipFrameStyle } from "../../lib/pipPlacement";
import { StreamVideo } from "./StreamVideo";

export const pipFrameClassName =
  "@container overflow-hidden rounded-[2.5%] bg-black shadow-[0_8px_28px_rgb(0_0_0/0.55)] outline -outline-offset-1 outline-white/22";

export const pipLabelClassName =
  "pointer-events-none absolute bottom-[6%] left-[4%] max-w-[84%] truncate rounded-full bg-black/60 px-[4%] py-[1.5%] text-[clamp(8px,7cqw,13px)] font-bold text-white";

interface StreamPipLayerProps {
  windows: StreamPipWindow[];
  showLabels?: boolean;
  forceMuted?: boolean;
}

export const StreamPipLayer = ({
  windows,
  showLabels,
  forceMuted,
}: StreamPipLayerProps) => {
  if (windows.length === 0) return null;

  const stacked = new Map<PipCorner, number>();

  return (
    <>
      {windows.map((window) => {
        const index = stacked.get(window.placement.corner) ?? 0;
        stacked.set(window.placement.corner, index + 1);
        return (
          <div
            key={window.id}
            style={pipFrameStyle(window.placement, index)}
            className={pipFrameClassName}
          >
            <StreamVideo
              stream={window.stream}
              muted={forceMuted || window.muted}
            />
            {showLabels && (
              <span className={pipLabelClassName}>{window.label}</span>
            )}
          </div>
        );
      })}
    </>
  );
};
