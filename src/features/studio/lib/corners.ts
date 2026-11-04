import type { CornerRadii, Layer } from "../types/layer";

export const CORNER_ORDER: (keyof CornerRadii)[] = [
  "topLeft",
  "topRight",
  "bottomLeft",
  "bottomRight",
];

export const evenCorners = (radius: number): CornerRadii => ({
  topLeft: radius,
  topRight: radius,
  bottomRight: radius,
  bottomLeft: radius,
});

export const cornerRadiusCss = ({
  radius,
  corners,
}: Pick<Layer, "radius" | "corners">): string =>
  corners
    ? `${corners.topLeft}px ${corners.topRight}px ${corners.bottomRight}px ${corners.bottomLeft}px`
    : `${radius}px`;
