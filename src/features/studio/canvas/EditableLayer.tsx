import { memo, useRef, useState, type CSSProperties } from "react";
import { Rnd, type HandleStyles, type RndDragEvent } from "react-rnd";
import { cn } from "../../../lib/utils";
import type { Layer, LayerFrame } from "../types/layer";
import { MIN_LAYER_SIZE, frameOf } from "../lib/canvasCoordinates";
import {
  edgesOfDirection,
  snapMove,
  snapResize,
  type SnapResult,
} from "../lib/snapping";
import { LayerSurface } from "../elements/LayerContent";
import { clearGuides, selectLayer, showGuides } from "../store/editorStore";
import { setLayerFrame } from "../store/layerActions";
import { useStageScale } from "../render/renderSurface";

const HANDLE_SCREEN_PX = 16;
const DOT_SCREEN_PX = 11;
const SNAP_SCREEN_PX = 7;

interface DragGesture {
  frame: LayerFrame;
  pointerX: number;
  pointerY: number;
}

interface EditableLayerProps {
  layer: Layer;
  order: number;
  isSelected: boolean;
  snapEnabled: boolean;
  snapTargets: (layerId: string) => LayerFrame[];
}

const pointerOf = (event: RndDragEvent): { x: number; y: number } => {
  if ("touches" in event && event.touches.length > 0)
    return { x: event.touches[0].clientX, y: event.touches[0].clientY };
  if ("changedTouches" in event && event.changedTouches.length > 0)
    return {
      x: event.changedTouches[0].clientX,
      y: event.changedTouches[0].clientY,
    };
  return "clientX" in event
    ? { x: event.clientX, y: event.clientY }
    : { x: 0, y: 0 };
};

const isFreeMove = (event: RndDragEvent | MouseEvent | TouchEvent): boolean =>
  "altKey" in event && event.altKey;

const sameFrame = (a: LayerFrame, b: LayerFrame): boolean =>
  Math.round(a.x) === Math.round(b.x) &&
  Math.round(a.y) === Math.round(b.y) &&
  Math.round(a.width) === Math.round(b.width) &&
  Math.round(a.height) === Math.round(b.height);

const handleStyles = (size: number): HandleStyles => {
  const offset = -size / 2;
  const corner = (position: CSSProperties): CSSProperties => ({
    width: size,
    height: size,
    ...position,
  });
  return {
    topLeft: corner({ top: offset, left: offset }),
    topRight: corner({ top: offset, right: offset }),
    bottomLeft: corner({ bottom: offset, left: offset }),
    bottomRight: corner({ bottom: offset, right: offset }),
    top: { height: size, top: offset },
    bottom: { height: size, bottom: offset },
    left: { width: size, left: offset },
    right: { width: size, right: offset },
  };
};

const Dot = ({ size }: { size: number }) => (
  <span
    style={{ width: size, height: size, borderWidth: size / 5 }}
    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[22%] border-primary-foreground bg-primary shadow-sm"
  />
);

const handleComponents = (size: number) => {
  const dot = <Dot size={size} />;
  return {
    topLeft: dot,
    topRight: dot,
    bottomLeft: dot,
    bottomRight: dot,
    top: dot,
    bottom: dot,
    left: dot,
    right: dot,
  };
};

export const EditableLayer = memo(
  ({
    layer,
    order,
    isSelected,
    snapEnabled,
    snapTargets,
  }: EditableLayerProps) => {
    const scale = useStageScale() || 1;
    const [draft, setDraft] = useState<LayerFrame | null>(null);
    const drag = useRef<DragGesture | null>(null);
    const draggedTo = useRef<LayerFrame | null>(null);
    const resizeStart = useRef<LayerFrame | null>(null);
    const pendingResize = useRef<SnapResult | null>(null);
    const frame = draft ?? frameOf(layer);
    const threshold = SNAP_SCREEN_PX / scale;
    const keepsAspect = layer.type === "camera" && layer.keepAspect;

    const commit = (next: LayerFrame | null) => {
      setDraft(null);
      clearGuides();
      if (next && !sameFrame(next, frameOf(layer)))
        setLayerFrame(layer.id, next);
    };

    return (
      <Rnd
        scale={scale}
        position={{ x: frame.x, y: frame.y }}
        size={{ width: frame.width, height: frame.height }}
        minWidth={MIN_LAYER_SIZE}
        minHeight={MIN_LAYER_SIZE}
        disableDragging={layer.locked}
        enableResizing={isSelected && !layer.locked}
        lockAspectRatio={keepsAspect}
        resizeHandleStyles={handleStyles(HANDLE_SCREEN_PX / scale)}
        resizeHandleComponent={
          isSelected ? handleComponents(DOT_SCREEN_PX / scale) : undefined
        }
        style={{
          zIndex: order + 1,
          outlineWidth: (isSelected ? 2 : 1.5) / scale,
          outlineOffset: 0,
        }}
        className={cn(
          "group/layer touch-none",
          layer.locked && "pointer-events-none",
          isSelected
            ? "outline-primary outline-solid"
            : "outline-transparent outline-dashed hover:outline-primary-soft/70",
        )}
        onMouseDown={() => selectLayer(layer.id)}
        onDragStart={(event) => {
          selectLayer(layer.id);
          const pointer = pointerOf(event);
          drag.current = {
            frame: frameOf(layer),
            pointerX: pointer.x,
            pointerY: pointer.y,
          };
          draggedTo.current = null;
        }}
        onDrag={(event) => {
          const gesture = drag.current;
          if (!gesture) return;
          const pointer = pointerOf(event);
          const raw: LayerFrame = {
            ...gesture.frame,
            x: gesture.frame.x + (pointer.x - gesture.pointerX) / scale,
            y: gesture.frame.y + (pointer.y - gesture.pointerY) / scale,
          };
          const result =
            snapEnabled && !isFreeMove(event)
              ? snapMove(raw, snapTargets(layer.id), threshold)
              : { frame: raw, guides: [] };
          draggedTo.current = result.frame;
          setDraft(result.frame);
          showGuides(result.guides);
        }}
        onDragStop={() => {
          drag.current = null;
          commit(draggedTo.current);
          draggedTo.current = null;
        }}
        onResizeStart={() => {
          selectLayer(layer.id);
          resizeStart.current = frameOf(layer);
          pendingResize.current = null;
        }}
        onResize={(event, direction, _element, delta, position) => {
          const start = resizeStart.current;
          if (!start) return;
          const raw: LayerFrame = {
            x: position.x,
            y: position.y,
            width: start.width + delta.width,
            height: start.height + delta.height,
          };
          const result =
            snapEnabled && !keepsAspect && !isFreeMove(event)
              ? snapResize(
                  raw,
                  edgesOfDirection(direction),
                  snapTargets(layer.id),
                  threshold,
                )
              : { frame: raw, guides: [] };
          pendingResize.current = result;
          showGuides(result.guides);
        }}
        onResizeStop={() => {
          const result = pendingResize.current;
          resizeStart.current = null;
          pendingResize.current = null;
          commit(result?.frame ?? null);
        }}
      >
        <LayerSurface layer={layer} />
        {isSelected && <NameTag name={layer.name} scale={scale} />}
      </Rnd>
    );
  },
);

EditableLayer.displayName = "EditableLayer";

const NameTag = ({ name, scale }: { name: string; scale: number }) => (
  <span
    style={{ transform: `scale(${1 / scale})` }}
    className="pointer-events-none absolute bottom-full left-0 mb-1 origin-bottom-left rounded-md bg-primary px-2 py-0.5 text-[11.5px] font-semibold whitespace-nowrap text-primary-foreground shadow"
  >
    {name}
  </span>
);
