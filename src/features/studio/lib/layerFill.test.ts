import { describe, expect, it } from "vitest";
import type { Background } from "../../../types";
import { createLayer } from "./layerDefaults";
import { backdropKeyOf, colorFill, fillOf, isFilledLayer } from "./layerFill";

const sourceView = (id: string) => {
  const background: Background = {
    id,
    name: id,
    category: "test",
    type: "solid",
    color: "#000000",
  };
  return { background, image: null, video: null };
};

describe("layer backgrounds", () => {
  it("knows which layers have a background behind their words", () => {
    expect(isFilledLayer(createLayer("manuscript"))).toBe(true);
    expect(isFilledLayer(createLayer("bible"))).toBe(true);
    expect(isFilledLayer(createLayer("announcement"))).toBe(true);
    expect(isFilledLayer(createLayer("shape"))).toBe(false);
    expect(isFilledLayer(createLayer("camera"))).toBe(false);
  });

  it("starts manuscripts and passages with their own background", () => {
    expect(createLayer("manuscript").fill.kind).toBe("source");
    expect(createLayer("bible").fill.kind).toBe("source");
  });

  it("crossfades only when the background itself changes", () => {
    const fill = fillOf("source");

    expect(backdropKeyOf(fill, sourceView("a"))).toBe(
      backdropKeyOf(fill, sourceView("a")),
    );
    expect(backdropKeyOf(fill, sourceView("a"))).not.toBe(
      backdropKeyOf(fill, sourceView("b")),
    );
    expect(backdropKeyOf(colorFill("#111111", 50), null)).toBe(
      backdropKeyOf(colorFill("#222222", 80), null),
    );
  });
});
