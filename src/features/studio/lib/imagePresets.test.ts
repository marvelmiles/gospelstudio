import { describe, expect, it } from "vitest";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./canvasCoordinates";
import { IMAGE_SIZE_PRESETS, matchingSizePreset } from "./imagePresets";

describe("image size presets", () => {
  it("offers a logo size that sits small in the top right corner", () => {
    const { frame } = IMAGE_SIZE_PRESETS.logo;

    expect(frame.width).toBeLessThan(CANVAS_WIDTH / 5);
    expect(frame.x + frame.width).toBeGreaterThan(CANVAS_WIDTH * 0.9);
    expect(frame.y).toBeLessThan(CANVAS_HEIGHT / 10);
  });

  it("recognises a layer that still has a preset size", () => {
    expect(matchingSizePreset(IMAGE_SIZE_PRESETS.full.frame)).toBe("full");
    expect(matchingSizePreset(IMAGE_SIZE_PRESETS.logo.frame)).toBe("logo");
  });

  it("reports no preset once the layer is resized by hand", () => {
    const resized = { ...IMAGE_SIZE_PRESETS.medium.frame, width: 1001 };

    expect(matchingSizePreset(resized)).toBe("");
  });
});
