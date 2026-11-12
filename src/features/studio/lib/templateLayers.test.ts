import { describe, expect, it } from "vitest";
import { fadingLine, stripe } from "./templateLayers";

describe("template paints", () => {
  it("centres a stripe of the given width in proportion to its box", () => {
    expect(stripe("#ffffff", 2)).toBe(
      "linear-gradient(90deg, transparent 47.5%, #ffffff 47.5% 52.5%, transparent 52.5%)",
    );
    expect(stripe("#ffffff", 20, 80)).toContain("#ffffff 37.5% 62.5%");
  });

  it("sizes a fading line in proportion to its box height", () => {
    expect(fadingLine("#000000", "#ffffff", 3)).toBe(
      "linear-gradient(90deg, #000000, #ffffff) center / 100% 7.5% no-repeat",
    );
    expect(fadingLine("#000000", "#ffffff", 3, 60)).toContain("100% 5%");
  });
});
