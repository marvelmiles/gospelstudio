import { describe, expect, it } from "vitest";
import { neighborSlideIndex, nextSlideIndex } from "./slideOrder";

describe("nextSlideIndex", () => {
  it("steps forward through the deck", () => {
    expect(nextSlideIndex(0, 3, false)).toBe(1);
    expect(nextSlideIndex(1, 3, true)).toBe(2);
  });

  it("stops on the last slide unless looping", () => {
    expect(nextSlideIndex(2, 3, false)).toBeNull();
    expect(nextSlideIndex(2, 3, true)).toBe(0);
  });

  it("never loops a single slide onto itself", () => {
    expect(nextSlideIndex(0, 1, true)).toBeNull();
  });
});

describe("neighborSlideIndex", () => {
  it("returns neighbors inside the deck", () => {
    expect(neighborSlideIndex(1, -1, 4, false)).toBe(0);
    expect(neighborSlideIndex(1, 2, 4, false)).toBe(3);
  });

  it("drops neighbors past either end unless looping", () => {
    expect(neighborSlideIndex(0, -1, 4, false)).toBeNull();
    expect(neighborSlideIndex(3, 2, 4, false)).toBeNull();
    expect(neighborSlideIndex(0, -1, 4, true)).toBe(3);
    expect(neighborSlideIndex(3, 2, 4, true)).toBe(1);
  });
});
