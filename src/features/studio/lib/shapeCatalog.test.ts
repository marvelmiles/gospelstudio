import { describe, expect, it } from "vitest";
import { SHAPES, SHAPE_ORDER, outlinePoints } from "./shapeCatalog";

const pointsOf = (points: string): number[][] =>
  points.split(" ").map((pair) => pair.split(",").map(Number));

describe("shape catalog", () => {
  it("lists every shape exactly once", () => {
    expect(new Set(SHAPE_ORDER).size).toBe(SHAPE_ORDER.length);
    expect([...SHAPE_ORDER].sort()).toEqual(Object.keys(SHAPES).sort());
  });

  it("keeps every outline inside its box, border included", () => {
    const box = { width: 600, height: 300 };
    const inset = 10;
    for (const shape of SHAPE_ORDER) {
      const { outline } = SHAPES[shape];
      if (!outline) continue;
      for (const [x, y] of pointsOf(outlinePoints(outline, box, inset))) {
        expect(x, shape).toBeGreaterThanOrEqual(inset - 0.01);
        expect(x, shape).toBeLessThanOrEqual(box.width - inset + 0.01);
        expect(y, shape).toBeGreaterThanOrEqual(inset - 0.01);
        expect(y, shape).toBeLessThanOrEqual(box.height - inset + 0.01);
      }
    }
  });

  it("stretches each outline to touch every edge of its box", () => {
    const box = { width: 400, height: 400 };
    for (const shape of SHAPE_ORDER) {
      const { outline } = SHAPES[shape];
      if (!outline) continue;
      const points = pointsOf(outlinePoints(outline, box, 0));
      const xs = points.map(([x]) => x);
      const ys = points.map(([, y]) => y);
      expect(Math.min(...xs), shape).toBeCloseTo(0);
      expect(Math.max(...xs), shape).toBeCloseTo(400);
      expect(Math.min(...ys), shape).toBeCloseTo(0);
      expect(Math.max(...ys), shape).toBeCloseTo(400);
    }
  });
});
