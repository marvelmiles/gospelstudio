import { useState, type ReactNode } from "react";
import {
  Check,
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
import { StageButton } from "../../components/ui/Button";
import { Popover } from "../../components/ui/Popover";
import { menuSurfaceClassName } from "../../components/ui/MoreMenu";
import { cn } from "../../lib/cn";

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
  const [menuOpen, setMenuOpen] = useState(false);

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

      <Popover
        open={menuOpen}
        onOpenChange={setMenuOpen}
        align="end"
        trigger={
          <StageButton icon={Scan} title="Screen fit (V)" active={menuOpen} />
        }
      >
        <div className={cn(menuSurfaceClassName, "min-w-49 bg-panel-solid/92")}>
          <div className="px-2.25 pt-1.5 pb-2 text-[10.5px] font-bold tracking-[0.6px] text-dim uppercase">
            Screen Fit
          </div>
          {VIEW_OPTIONS.map((option) => {
            const active = view === option.value;
            return (
              <button
                key={option.value}
                onClick={() => {
                  onSetView(option.value);
                  setMenuOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg border-none px-2.5 py-2.25 text-left",
                  active
                    ? "bg-accent/16 text-accent-soft"
                    : "bg-transparent text-fg hover:bg-white/5",
                )}
              >
                <option.icon size={16} />
                <span className="flex-1">
                  <span className="block text-[13.5px] font-semibold">
                    {option.label}
                  </span>
                  <span
                    className={cn(
                      "text-[11.5px]",
                      active ? "text-accent-soft" : "text-sub",
                    )}
                  >
                    {option.hint}
                  </span>
                </span>
                {active && <Check size={15} />}
              </button>
            );
          })}
        </div>
      </Popover>

      <span className="flex items-center gap-0.5">
        <StageButton icon={ZoomOut} title="Zoom out (-)" onClick={onZoomOut} />
        <button
          onClick={onResetZoom}
          title="Reset zoom (0)"
          className="inline-flex h-10 min-w-12 items-center justify-center gap-1.25 rounded-[10px] border border-stage-line bg-white/6 px-2 text-[12.5px] text-white tabular-nums"
        >
          <RotateCcw size={13} />
          {Math.round(zoom * 100)}%
        </button>
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
