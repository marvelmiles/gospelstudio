import type { Dimensions, ShapeKind } from "../types/layer";

type Point = readonly [number, number];

export type ShapeOutline = readonly Point[];

interface ShapeDefinition {
  label: string;
  size: Dimensions;
  radius: number;
  outline: ShapeOutline | null;
}

const regularPolygon = (sides: number, rotationDegrees = -90): Point[] =>
  Array.from({ length: sides }, (_, index) => {
    const angle = ((rotationDegrees + (360 / sides) * index) * Math.PI) / 180;
    return [0.5 + 0.5 * Math.cos(angle), 0.5 + 0.5 * Math.sin(angle)];
  });

const STAR_INNER_RATIO = 0.4;

const star = (): Point[] =>
  Array.from({ length: 10 }, (_, index) => {
    const radius = index % 2 === 0 ? 0.5 : 0.5 * STAR_INNER_RATIO;
    const angle = ((-90 + 36 * index) * Math.PI) / 180;
    return [0.5 + radius * Math.cos(angle), 0.5 + radius * Math.sin(angle)];
  });

const fitToBox = (points: Point[]): Point[] => {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const width = Math.max(...xs) - minX;
  const height = Math.max(...ys) - minY;
  return points.map(([x, y]) => [(x - minX) / width, (y - minY) / height]);
};

const SQUARE: Dimensions = { width: 480, height: 480 };

export const SHAPES: Record<ShapeKind, ShapeDefinition> = {
  rectangle: {
    label: "Rectangle",
    size: { width: 800, height: 450 },
    radius: 24,
    outline: null,
  },
  ellipse: { label: "Circle", size: SQUARE, radius: 0, outline: null },
  triangle: {
    label: "Triangle",
    size: SQUARE,
    radius: 0,
    outline: [
      [0.5, 0],
      [1, 1],
      [0, 1],
    ],
  },
  diamond: {
    label: "Diamond",
    size: SQUARE,
    radius: 0,
    outline: [
      [0.5, 0],
      [1, 0.5],
      [0.5, 1],
      [0, 0.5],
    ],
  },
  pentagon: {
    label: "Pentagon",
    size: SQUARE,
    radius: 0,
    outline: fitToBox(regularPolygon(5)),
  },
  hexagon: {
    label: "Hexagon",
    size: SQUARE,
    radius: 0,
    outline: fitToBox(regularPolygon(6, 0)),
  },
  star: { label: "Star", size: SQUARE, radius: 0, outline: fitToBox(star()) },
  arrow: {
    label: "Arrow",
    size: { width: 720, height: 360 },
    radius: 0,
    outline: [
      [0, 0.3],
      [0.6, 0.3],
      [0.6, 0],
      [1, 0.5],
      [0.6, 1],
      [0.6, 0.7],
      [0, 0.7],
    ],
  },
  cross: {
    label: "Cross",
    size: { width: 360, height: 480 },
    radius: 0,
    outline: [
      [0.35, 0],
      [0.65, 0],
      [0.65, 0.25],
      [1, 0.25],
      [1, 0.5],
      [0.65, 0.5],
      [0.65, 1],
      [0.35, 1],
      [0.35, 0.5],
      [0, 0.5],
      [0, 0.25],
      [0.35, 0.25],
    ],
  },
  slant: {
    label: "Slanted tag",
    size: { width: 600, height: 160 },
    radius: 0,
    outline: [
      [0, 0],
      [0.86, 0],
      [1, 1],
      [0, 1],
    ],
  },
  slantLeft: {
    label: "Left slanted tag",
    size: { width: 600, height: 160 },
    radius: 0,
    outline: [
      [0.25, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ],
  },
  parallelogram: {
    label: "Slanted bar",
    size: { width: 600, height: 120 },
    radius: 0,
    outline: [
      [0.2, 0],
      [1, 0],
      [0.8, 1],
      [0, 1],
    ],
  },
};

export const SHAPE_ORDER: ShapeKind[] = [
  "rectangle",
  "ellipse",
  "triangle",
  "diamond",
  "pentagon",
  "hexagon",
  "star",
  "arrow",
  "cross",
  "slant",
  "slantLeft",
  "parallelogram",
];

export const outlinePoints = (
  outline: ShapeOutline,
  box: Dimensions,
  inset: number,
): string => {
  const width = Math.max(box.width - inset * 2, 0);
  const height = Math.max(box.height - inset * 2, 0);
  return outline
    .map(
      ([x, y]) =>
        `${(inset + x * width).toFixed(2)},${(inset + y * height).toFixed(2)}`,
    )
    .join(" ");
};
