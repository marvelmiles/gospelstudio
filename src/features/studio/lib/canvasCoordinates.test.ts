import { describe, expect, it } from "vitest";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  MIN_LAYER_SIZE,
  clampFrame,
  fitCanvas,
  percentFrame,
  stageTransform,
} from "./canvasCoordinates";

describe("stageTransform", () => {
  it("stretches the stage to fill a screen of any shape", () => {
    const transform = stageTransform({ width: 1280, height: 800 }, "stretch");

    expect(transform.scaleX).toBeCloseTo(1280 / CANVAS_WIDTH);
    expect(transform.scaleY).toBeCloseTo(800 / CANVAS_HEIGHT);
    expect(transform.offsetX).toBe(0);
    expect(transform.offsetY).toBe(0);
  });

  it("scales evenly and centres the stage when it keeps its shape", () => {
    const transform = stageTransform({ width: 2000, height: 900 }, "contain");

    expect(transform.scaleX).toBe(transform.scaleY);
    expect(transform.offsetX).toBeGreaterThan(0);
  });

  it("draws nothing before the screen has a size", () => {
    expect(stageTransform({ width: 0, height: 0 }, "stretch").scaleX).toBe(0);
  });
});

describe("fitCanvas", () => {
  it("keeps the 16:9 shape inside a wide container", () => {
    const fit = fitCanvas({ width: 2000, height: 900 });

    expect(fit.scale).toBeCloseTo(900 / CANVAS_HEIGHT);
    expect(fit.offsetY).toBe(0);
    expect(fit.offsetX).toBeCloseTo((2000 - CANVAS_WIDTH * fit.scale) / 2);
  });

  it("keeps the 16:9 shape inside a tall container", () => {
    const fit = fitCanvas({ width: 960, height: 1000 });

    expect(fit.scale).toBe(0.5);
    expect(fit.offsetX).toBe(0);
    expect(fit.offsetY).toBe((1000 - 540) / 2);
  });

  it("reports nothing to draw before the container has a size", () => {
    expect(fitCanvas({ width: 0, height: 0 }).scale).toBe(0);
  });
});

describe("clampFrame", () => {
  it("never lets a layer shrink below the smallest size", () => {
    const frame = clampFrame({ x: 10, y: 10, width: 2, height: 3 });

    expect(frame.width).toBe(MIN_LAYER_SIZE);
    expect(frame.height).toBe(MIN_LAYER_SIZE);
  });

  it("keeps part of a layer on screen so it can be grabbed again", () => {
    const frame = clampFrame({ x: 5000, y: -5000, width: 300, height: 200 });

    expect(frame.x).toBeLessThan(CANVAS_WIDTH);
    expect(frame.y + frame.height).toBeGreaterThan(0);
  });
});

describe("percentFrame", () => {
  it("turns percentages into screen units", () => {
    expect(percentFrame(50, 50, 25, 10)).toEqual({
      x: 960,
      y: 540,
      width: 480,
      height: 108,
    });
  });
});
