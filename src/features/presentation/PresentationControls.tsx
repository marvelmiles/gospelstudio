import type { ReactNode } from "react";
import {
  Expand,
  Maximize,
  Maximize2,
  Minimize2,
  Monitor,
  MonitorUp,
  Pause,
  PictureInPicture2,
  Play,
  RectangleHorizontal,
  RotateCcw,
  Scan,
  Square,
  Volume2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PresentationView } from "../../types";
import { viewCommandTitle } from "../../lib/viewCommands";
import { StageButton } from "@/components/shared/StageButton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "../../lib/utils";

const VIEW_OPTIONS: {
  value: PresentationView;
  label: string;
  hint: string;
  icon: LucideIcon;
}[] = [
  {
    value: "normal",
    label: "Normal",
    hint: "Fit, letterboxed",
    icon: RectangleHorizontal,
  },
  { value: "cover", label: "Cover", hint: "Fill, may crop", icon: Maximize },
  { value: "fill", label: "Fill", hint: "Stretch to screen", icon: Expand },
];

interface PresentationControlsProps {
  paused: boolean;
  view: PresentationView;
  zoom: number;
  showInfo: boolean;
  isFullscreen: boolean;
  visible: boolean;
  isExternal: boolean;
  isLive: boolean;
  canRead?: boolean;
  reading?: boolean;
  onToggleRead?: () => void;
  onHoverChange: (hovering: boolean) => void;
  onGoLive: () => void;
  onShrinkToPip: () => void;
  secondaryMenu?: ReactNode;
  onTogglePause: () => void;
  onSetView: (view: PresentationView) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onToggleInfo: () => void;
  onToggleFullscreen: () => void;
  onExit: () => void;
}

export const PresentationControls = ({
  paused,
  view,
  zoom,
  showInfo,
  isFullscreen,
  visible,
  isExternal,
  isLive,
  canRead,
  reading,
  onToggleRead,
  onHoverChange,
  onGoLive,
  onShrinkToPip,
  secondaryMenu,
  onTogglePause,
  onSetView,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleInfo,
  onToggleFullscreen,
  onExit,
}: PresentationControlsProps) => {
  return (
    <div
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      className={cn(
        "fixed top-4 right-4 z-20 flex max-w-[calc(100vw-32px)] flex-wrap items-center justify-end gap-1.75 rounded-[14px] border border-stage-line bg-stage-overlay p-1.75 backdrop-blur-[10px] transition-opacity duration-300",
        visible
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0",
      )}
    >
      <StageButton
        icon={MonitorUp}
        title={
          isLive
            ? "Live: projecting to external display"
            : isExternal
              ? "Go Live on external display"
              : "Go Live / project"
        }
        active={isLive}
        onClick={onGoLive}
      />
      <StageButton
        icon={PictureInPicture2}
        title={viewCommandTitle(
          isLive
            ? "Shrink to floating presenter and keep using the app (stays live)"
            : "Shrink to floating presenter and keep using the app",
          "popOut",
        )}
        onClick={onShrinkToPip}
      />
      {secondaryMenu}
      <StageButton
        icon={paused ? Play : Pause}
        title={paused ? "Resume (Space)" : "Pause (Space)"}
        active={paused}
        onClick={onTogglePause}
      />
      {canRead && (
        <StageButton
          icon={reading ? Square : Volume2}
          title={reading ? "Stop reading (R)" : "Read passage aloud (R)"}
          active={reading}
          onClick={onToggleRead}
        />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <StageButton icon={Scan} title="Screen fit (V)" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-49 bg-card/92">
          <DropdownMenuLabel className="text-[10.5px] font-bold tracking-[0.6px] text-subtle-foreground uppercase">
            Screen Fit
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={view}
            onValueChange={(next) => onSetView(next as PresentationView)}
          >
            {VIEW_OPTIONS.map((option) => (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                className="group data-[state=checked]:bg-primary/16 data-[state=checked]:text-primary-soft"
              >
                <option.icon className="group-data-[state=checked]:text-primary-soft!" />
                <span className="flex-1">
                  <span className="block font-semibold">{option.label}</span>
                  <span className="text-[11.5px] text-muted-foreground group-data-[state=checked]:text-primary-soft">
                    {option.hint}
                  </span>
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <span className="flex items-center gap-0.5">
        <StageButton icon={ZoomOut} title="Zoom out (-)" onClick={onZoomOut} />
        <Button
          variant="ghost"
          onClick={onResetZoom}
          title="Reset zoom (0)"
          className="h-10 min-w-12 gap-1.25 rounded-[10px] border-stage-line bg-white/6 px-2 text-[12.5px] font-normal text-white tabular-nums enabled:hover:bg-white/14 enabled:hover:text-white"
        >
          <RotateCcw className="size-3.25" />
          {Math.round(zoom * 100)}%
        </Button>
        <StageButton icon={ZoomIn} title="Zoom in (+)" onClick={onZoomIn} />
      </span>

      <StageButton
        icon={Monitor}
        title="Presenter bar (I)"
        active={showInfo}
        onClick={onToggleInfo}
      />
      <StageButton
        icon={isFullscreen ? Minimize2 : Maximize2}
        title={viewCommandTitle(
          isFullscreen ? "Exit fullscreen" : "Fullscreen",
          "fullscreen",
        )}
        onClick={onToggleFullscreen}
      />
      <StageButton icon={X} title="Exit (Esc)" onClick={onExit} />
    </div>
  );
};
