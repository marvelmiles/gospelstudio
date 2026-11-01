import { describe, expect, it } from "vitest";
import { CANVAS_HEIGHT } from "./canvasCoordinates";
import { DEFAULT_TEXT_APPEARANCE, createLayer } from "./layerDefaults";
import { TEXT_PRESETS, textPresetPatch } from "./textPresets";

describe("text presets", () => {
  it("starts new text as the normal preset", () => {
    const layer = createLayer("text");

    expect(layer.preset).toBe("body");
    expect(layer.text.fontSize).toBe(TEXT_PRESETS.body.text.fontSize);
    expect(layer.fill.kind).toBe("none");
  });

  it("puts a heading at the top in bigger, bolder letters", () => {
    const heading = textPresetPatch("heading", DEFAULT_TEXT_APPEARANCE);
    const body = textPresetPatch("body", DEFAULT_TEXT_APPEARANCE);

    expect(heading.position.y).toBeLessThan(CANVAS_HEIGHT / 4);
    expect(heading.text.fontSize).toBeGreaterThan(body.text.fontSize);
    expect(heading.text.fontWeight).toBeGreaterThan(body.text.fontWeight);
  });

  it("puts a subtitle along the bottom on a dark band", () => {
    const subtitle = textPresetPatch("subtitle", DEFAULT_TEXT_APPEARANCE);

    expect(subtitle.position.y).toBeGreaterThan(CANVAS_HEIGHT * 0.75);
    expect(subtitle.fill.kind).toBe("color");
  });

  it("keeps the chosen font and colour when the preset changes", () => {
    const text = {
      ...DEFAULT_TEXT_APPEARANCE,
      fontFamily: "Fraunces",
      color: "#fde68a",
    };
    const patch = textPresetPatch("heading", text);

    expect(patch.text.fontFamily).toBe("Fraunces");
    expect(patch.text.color).toBe("#fde68a");
  });
});
