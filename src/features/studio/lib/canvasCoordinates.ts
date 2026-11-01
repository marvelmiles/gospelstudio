import type { Dimensions, LayerFrame, Position } from "../types/layer";

export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;

export const MIN_LAYER_SIZE = 40;
const MIN_VISIBLE_EDGE = 40;

export interface CanvasFit {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export const fitCanvas = (container: Dimensions): CanvasFit => {
  if (container.width <= 0 || container.height <= 0)
    return { scale: 0, offsetX: 0, offsetY: 0 };
  const scale = Math.min(
    container.width / CANVAS_WIDTH,
    container.height / CANVAS_HEIGHT,
  );
  return {
    scale,
    offsetX: (container.width - CANVAS_WIDTH * scale) / 2,
    offsetY: (container.height - CANVAS_HEIGHT * scale) / 2,
  };
};

export type StageFit = "contain" | "stretch";

export interface StageTransform {
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
}

export const stageTransform = (
  container: Dimensions,
  fit: StageFit,
): StageTransform => {
  if (fit === "stretch" && container.width > 0 && container.height > 0)
    return {
      scaleX: container.width / CANVAS_WIDTH,
      scaleY: container.height / CANVAS_HEIGHT,
      offsetX: 0,
      offsetY: 0,
    };
  const { scale, offsetX, offsetY } = fitCanvas(container);
  return { scaleX: scale, scaleY: scale, offsetX, offsetY };
};

export const percentFrame = (
  x: number,
  y: number,
  width: number,
  height: number,
): LayerFrame => ({
  x: Math.round((x / 100) * CANVAS_WIDTH),
  y: Math.round((y / 100) * CANVAS_HEIGHT),
  width: Math.round((width / 100) * CANVAS_WIDTH),
  height: Math.round((height / 100) * CANVAS_HEIGHT),
});

export const FULL_FRAME: LayerFrame = percentFrame(0, 0, 100, 100);

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const clampDimensions = (dimensions: Dimensions): Dimensions => ({
  width: Math.round(clamp(dimensions.width, MIN_LAYER_SIZE, CANVAS_WIDTH * 2)),
  height: Math.round(
    clamp(dimensions.height, MIN_LAYER_SIZE, CANVAS_HEIGHT * 2),
  ),
});

export const clampPosition = (
  position: Position,
  dimensions: Dimensions,
): Position => ({
  x: Math.round(
    clamp(
      position.x,
      MIN_VISIBLE_EDGE - dimensions.width,
      CANVAS_WIDTH - MIN_VISIBLE_EDGE,
    ),
  ),
  y: Math.round(
    clamp(
      position.y,
      MIN_VISIBLE_EDGE - dimensions.height,
      CANVAS_HEIGHT - MIN_VISIBLE_EDGE,
    ),
  ),
});

export const clampFrame = (frame: LayerFrame): LayerFrame => {
  const dimensions = clampDimensions(frame);
  return { ...clampPosition(frame, dimensions), ...dimensions };
};

export const frameOf = (layer: {
  position: Position;
  dimensions: Dimensions;
}): LayerFrame => ({ ...layer.position, ...layer.dimensions });

export const centeredFrame = (dimensions: Dimensions): LayerFrame => ({
  x: Math.round((CANVAS_WIDTH - dimensions.width) / 2),
  y: Math.round((CANVAS_HEIGHT - dimensions.height) / 2),
  ...dimensions,
});

export const offsetFrame = (frame: LayerFrame, by: number): LayerFrame =>
  clampFrame({ ...frame, x: frame.x + by, y: frame.y + by });
