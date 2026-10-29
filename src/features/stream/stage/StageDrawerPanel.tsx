import { cn } from "../../../lib/utils";
import { CameraPanel } from "../CameraPanel";
import { StreamOverlayPanel } from "../StreamOverlayPanel";
import type { StreamOverlay } from "../lib/streamOverlay";

export type StageDrawer = "none" | "cameras" | "overlays";

interface StageDrawerPanelProps {
  drawer: Exclude<StageDrawer, "none">;
  isStacked: boolean;
  isLive: boolean;
  overlays: StreamOverlay[];
  selectedOverlayId: string | null;
  onSelectOverlay: (id: string | null) => void;
}

export const StageDrawerPanel = ({
  drawer,
  isStacked,
  isLive,
  overlays,
  selectedOverlayId,
  onSelectOverlay,
}: StageDrawerPanelProps) => (
  <aside
    aria-label={
      drawer === "cameras" ? "Connected cameras" : "Broadcast overlays"
    }
    className={cn(
      "shrink-0 overflow-y-auto border-border bg-secondary p-3.5",
      isStacked ? "max-h-[45dvh] w-auto border-t" : "w-82.5 border-l",
    )}
  >
    {drawer === "cameras" ? (
      <CameraPanel isLive={isLive} />
    ) : (
      <StreamOverlayPanel
        overlays={overlays}
        selectedId={selectedOverlayId}
        onSelect={onSelectOverlay}
      />
    )}
  </aside>
);
