import { MonitorCheck } from "lucide-react";
import { APP_NAME } from "../../../lib/appInfo";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../lib/canvasCoordinates";

const CORNERS = [
  "top-6 left-6 border-t-8 border-l-8",
  "top-6 right-6 border-t-8 border-r-8",
  "bottom-6 left-6 border-b-8 border-l-8",
  "bottom-6 right-6 border-b-8 border-r-8",
];

const SWATCHES = [
  "#ffffff",
  "#facc15",
  "#22d3ee",
  "#22c55e",
  "#d946ef",
  "#ef4444",
  "#2563eb",
  "#000000",
];

export const TestPattern = () => (
  <div className="absolute inset-0 z-50 bg-[#0b0f19] text-white">
    <div
      aria-hidden
      className="absolute inset-0 bg-[linear-gradient(rgb(255_255_255/0.07)_2px,transparent_2px),linear-gradient(90deg,rgb(255_255_255/0.07)_2px,transparent_2px)] bg-size-[120px_120px]"
    />
    {CORNERS.map((corner) => (
      <div
        key={corner}
        className={`absolute size-28 border-[#22d3ee] ${corner}`}
      />
    ))}
    <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-white/18" />
    <div className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-white/18" />
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 text-center">
      <MonitorCheck size={150} strokeWidth={1.4} className="text-[#22d3ee]" />
      <div className="text-[92px] leading-none font-bold">
        This screen is connected
      </div>
      <div className="max-w-[1300px] text-[42px] leading-snug text-white/75">
        If you can see all four blue corners, everything you put on the live
        screen in {APP_NAME} will fit this display.
      </div>
      <div className="flex overflow-hidden rounded-2xl border-4 border-white/30">
        {SWATCHES.map((swatch) => (
          <div
            key={swatch}
            style={{ background: swatch }}
            className="h-24 w-32"
          />
        ))}
      </div>
      <div className="text-[32px] text-white/55 tabular-nums">
        Picture size {CANVAS_WIDTH} by {CANVAS_HEIGHT}
      </div>
    </div>
  </div>
);
