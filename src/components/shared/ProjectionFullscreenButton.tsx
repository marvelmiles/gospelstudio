import { Maximize2, Minimize2 } from "lucide-react";
import { viewCommandTitle } from "../../lib/viewCommands";
import { cn } from "../../lib/utils";

interface ProjectionFullscreenButtonProps {
  isFullscreen: boolean;
  visible: boolean;
  onToggle: () => void;
}

export const ProjectionFullscreenButton = ({
  isFullscreen,
  visible,
  onToggle,
}: ProjectionFullscreenButtonProps) => (
  <button
    onClick={onToggle}
    title={viewCommandTitle(
      isFullscreen ? "Exit fullscreen" : "Fullscreen",
      "fullscreen",
    )}
    className={cn(
      "fixed top-3.5 right-3.5 z-10 grid size-9.5 place-items-center rounded-[10px] border border-stage-line bg-stage-overlay text-white backdrop-blur-[10px] transition-opacity duration-300",
      visible
        ? "pointer-events-auto opacity-100"
        : "pointer-events-none opacity-0",
    )}
  >
    {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
  </button>
);
