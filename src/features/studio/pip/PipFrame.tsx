import {
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useFloatingWindow } from "../../../hooks/useFloatingWindow";
import { cn } from "../../../lib/utils";
import { FloatingWindowHeader } from "@/components/shared/FloatingWindowHeader";
import { floatingPanelClassName } from "@/components/shared/floatingPanel";
import { FloatingWindowTab } from "@/components/shared/FloatingWindowTab";
import { LiveBadge } from "@/components/shared/LiveBadge";
import { PresenterNotes } from "@/components/shared/PresenterNotes";
import type { Layer } from "../types/layer";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../lib/canvasCoordinates";
import { LayerSurface } from "../elements/LayerContent";
import { ScaledStage } from "../render/ScaledStage";
import { closeItemPip } from "./pipStore";

const WIDTH = 320;
const MARGIN = 16;
const ESTIMATED_HEIGHT = 300;

interface PipFrameProps {
  layer: Layer;
  isLive: boolean;
  sceneName: string;
  stackIndex: number;
  notes?: string;
  shortcutsHint: string;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => boolean;
  onKeyUp?: (event: KeyboardEvent<HTMLDivElement>) => void;
  controls: ReactNode;
}

export const PipFrame = ({
  layer,
  isLive,
  sceneName,
  stackIndex,
  notes,
  shortcutsHint,
  onKeyDown,
  onKeyUp,
  controls,
}: PipFrameProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const { position, handleProps, windowProps, stash, zIndex } =
    useFloatingWindow({
      width: WIDTH,
      margin: MARGIN,
      estimatedHeight: ESTIMATED_HEIGHT,
      startAt: "bottom-right",
      offsetIndex: stackIndex,
      elementRef: rootRef,
    });

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") closeItemPip(layer.id);
    else if (!onKeyDown(event)) return;
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <>
      <FloatingWindowTab
        stash={stash}
        name="Studio"
        detail={layer.name}
        zIndex={zIndex}
      />
      <div
        ref={rootRef}
        tabIndex={0}
        role="region"
        aria-label={`Floating controls for ${layer.name}`}
        onPointerDownCapture={windowProps.onPointerDownCapture}
        onPointerDown={() => rootRef.current?.focus()}
        onFocus={() => setIsFocused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null))
            setIsFocused(false);
        }}
        onKeyDown={handleKeyDown}
        onKeyUp={onKeyUp}
        style={{
          ...windowProps.style,
          left: position.x,
          top: position.y,
          width: WIDTH,
        }}
        className={floatingPanelClassName(isFocused)}
      >
        <FloatingWindowHeader handleProps={handleProps} title={layer.name}>
          {isLive ? (
            <LiveBadge title="On the live screen" />
          ) : (
            <span className="max-w-28 truncate text-[10.5px] font-semibold text-subtle-foreground">
              {sceneName}
            </span>
          )}
        </FloatingWindowHeader>
        <ItemPreview layer={layer} />
        {notes && <PresenterNotes notes={notes} />}
        {controls}
        <div
          className={cn(
            "px-2.5 pb-2.25 text-[10px] leading-[1.45]",
            isFocused ? "text-primary-soft" : "text-subtle-foreground",
          )}
        >
          {isFocused
            ? shortcutsHint
            : "Click this window to use its keyboard shortcuts."}
        </div>
      </div>
    </>
  );
};

const ItemPreview = ({ layer }: { layer: Layer }) => {
  const fullFrame = useMemo<Layer>(
    () => ({
      ...layer,
      position: { x: 0, y: 0 },
      dimensions: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
      opacity: 100,
      rotation: 0,
      radius: 0,
      visible: true,
    }),
    [layer],
  );

  return (
    <ScaledStage background="#000000" className="aspect-video bg-black">
      <div className="absolute inset-0">
        <LayerSurface layer={fullFrame} />
      </div>
    </ScaledStage>
  );
};
