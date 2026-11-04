import { describe, expect, it } from "vitest";
import { cornerRadiusCss, evenCorners } from "./corners";

describe("rounded corners", () => {
  it("rounds every corner the same by default", () => {
    expect(cornerRadiusCss({ radius: 24, corners: null })).toBe("24px");
  });

  it("rounds each corner on its own, clockwise from the top left", () => {
    expect(
      cornerRadiusCss({
        radius: 24,
        corners: { topLeft: 12, topRight: 22, bottomRight: 0, bottomLeft: 4 },
      }),
    ).toBe("12px 22px 0px 4px");
  });

  it("starts separate corners from the shared radius", () => {
    expect(cornerRadiusCss({ radius: 0, corners: evenCorners(16) })).toBe(
      "16px 16px 16px 16px",
    );
  });
});
