import type { LayerFrame } from "../types/layer";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./canvasCoordinates";

type GuideOrientation = "vertical" | "horizontal";

export interface Guide {
  orientation: GuideOrientation;
  position: number;
}

export interface SnapResult {
  frame: LayerFrame;
  guides: Guide[];
}

export interface ResizeEdges {
  left: boolean;
  right: boolean;
  top: boolean;
  bottom: boolean;
}

interface SnapMatch {
  delta: number;
  target: number;
}

const verticalTargets = (others: LayerFrame[]): number[] => [
  0,
  CANVAS_WIDTH / 2,
  CANVAS_WIDTH,
  ...others.flatMap((frame) => [
    frame.x,
    frame.x + frame.width / 2,
    frame.x + frame.width,
  ]),
];

const horizontalTargets = (others: LayerFrame[]): number[] => [
  0,
  CANVAS_HEIGHT / 2,
  CANVAS_HEIGHT,
  ...others.flatMap((frame) => [
    frame.y,
    frame.y + frame.height / 2,
    frame.y + frame.height,
  ]),
];

const closestMatch = (
  lines: number[],
  targets: number[],
  threshold: number,
): SnapMatch | null => {
  let best: SnapMatch | null = null;
  for (const line of lines) {
    for (const target of targets) {
      const delta = target - line;
      if (Math.abs(delta) > threshold) continue;
      if (!best || Math.abs(delta) < Math.abs(best.delta))
        best = { delta, target };
    }
  }
  return best;
};

const guide = (orientation: GuideOrientation, position: number): Guide => ({
  orientation,
  position,
});

export const snapMove = (
  frame: LayerFrame,
  others: LayerFrame[],
  threshold: number,
): SnapResult => {
  const vertical = closestMatch(
    [frame.x, frame.x + frame.width / 2, frame.x + frame.width],
    verticalTargets(others),
    threshold,
  );
  const horizontal = closestMatch(
    [frame.y, frame.y + frame.height / 2, frame.y + frame.height],
    horizontalTargets(others),
    threshold,
  );
  return {
    frame: {
      ...frame,
      x: frame.x + (vertical?.delta ?? 0),
      y: frame.y + (horizontal?.delta ?? 0),
    },
    guides: [
      ...(vertical ? [guide("vertical", vertical.target)] : []),
      ...(horizontal ? [guide("horizontal", horizontal.target)] : []),
    ],
  };
};

export const snapResize = (
  frame: LayerFrame,
  edges: ResizeEdges,
  others: LayerFrame[],
  threshold: number,
): SnapResult => {
  const next = { ...frame };
  const guides: Guide[] = [];
  const xTargets = verticalTargets(others);
  const yTargets = horizontalTargets(others);

  if (edges.left) {
    const match = closestMatch([frame.x], xTargets, threshold);
    if (match) {
      next.x += match.delta;
      next.width -= match.delta;
      guides.push(guide("vertical", match.target));
    }
  } else if (edges.right) {
    const match = closestMatch([frame.x + frame.width], xTargets, threshold);
    if (match) {
      next.width += match.delta;
      guides.push(guide("vertical", match.target));
    }
  }

  if (edges.top) {
    const match = closestMatch([frame.y], yTargets, threshold);
    if (match) {
      next.y += match.delta;
      next.height -= match.delta;
      guides.push(guide("horizontal", match.target));
    }
  } else if (edges.bottom) {
    const match = closestMatch([frame.y + frame.height], yTargets, threshold);
    if (match) {
      next.height += match.delta;
      guides.push(guide("horizontal", match.target));
    }
  }

  return { frame: next, guides };
};

export const edgesOfDirection = (direction: string): ResizeEdges => {
  const lower = direction.toLowerCase();
  return {
    left: lower.includes("left"),
    right: lower.includes("right"),
    top: lower.includes("top"),
    bottom: lower.includes("bottom"),
  };
};
