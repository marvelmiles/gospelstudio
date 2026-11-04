import { describe, expect, it } from "vitest";
import { withOpacity } from "./colors";
import {
  NO_BORDER,
  NO_SHADOW,
  hasBorder,
  paintCss,
  paintStyle,
  shadowFilter,
} from "./paint";

const TYPED_GRADIENT = "radial-gradient(circle, #ffd700, #b8860b)";

describe("colour strength", () => {
  it("turns hex colours into rgba", () => {
    expect(withOpacity("#ff0000", 50)).toBe("rgba(255, 0, 0, 0.5)");
  });

  it("fades any other CSS colour with color-mix", () => {
    expect(withOpacity("gold", 40)).toBe(
      "color-mix(in srgb, gold 40%, transparent)",
    );
    expect(withOpacity("hsl(40 90% 50%)", 100)).toBe("hsl(40 90% 50%)");
  });

  it("leaves gradients alone", () => {
    expect(withOpacity(TYPED_GRADIENT, 40)).toBe(TYPED_GRADIENT);
  });
});

describe("paint", () => {
  it("paints a plain colour when there is no gradient", () => {
    expect(paintCss("#ff0000", null)).toBe("rgba(255, 0, 0, 1)");
    expect(paintCss("#ff0000", null, 50)).toBe("rgba(255, 0, 0, 0.5)");
  });

  it("blends into the second colour at the chosen angle", () => {
    expect(paintCss("#000000", { to: "#ffffff", angle: 90 }, 40)).toBe(
      "linear-gradient(90deg, rgba(0, 0, 0, 0.4), rgba(255, 255, 255, 0.4))",
    );
  });

  it("uses a typed gradient as it is, ignoring the blend", () => {
    expect(paintCss(TYPED_GRADIENT, { to: "#ffffff", angle: 90 })).toBe(
      TYPED_GRADIENT,
    );
  });

  it("fades a typed gradient through opacity instead", () => {
    expect(paintStyle(TYPED_GRADIENT, null, 60)).toEqual({
      background: TYPED_GRADIENT,
      opacity: 0.6,
    });
    expect(paintStyle("#000000", null, 60).opacity).toBeUndefined();
  });

  it("draws a border only when it has thickness", () => {
    expect(hasBorder(NO_BORDER)).toBe(false);
    expect(hasBorder({ ...NO_BORDER, width: 4 })).toBe(true);
  });

  it("casts a shadow only when it is soft or dropped", () => {
    expect(shadowFilter(NO_SHADOW)).toBeUndefined();
    expect(shadowFilter({ ...NO_SHADOW, blur: 20, opacity: 50 })).toBe(
      "drop-shadow(0 0px 20px rgba(0, 0, 0, 0.5))",
    );
    expect(shadowFilter({ ...NO_SHADOW, distance: 8 })).toBe(
      "drop-shadow(0 8px 0px rgba(0, 0, 0, 0.6))",
    );
  });
});
