import { describe, expect, it } from "vitest";
import { clampIndex } from "./slidePosition";

describe("slide position", () => {
  it("keeps a slide number inside the deck", () => {
    expect(clampIndex(9, 3)).toBe(2);
    expect(clampIndex(-1, 3)).toBe(0);
    expect(clampIndex(0, 0)).toBe(0);
  });
});
