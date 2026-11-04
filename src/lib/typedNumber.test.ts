import { describe, expect, it } from "vitest";
import { readTypedNumber, roundForStep, steppedNumber } from "./typedNumber";

describe("typed slider values", () => {
  it("reads a typed number, with or without its unit", () => {
    expect(readTypedNumber("36", 0, 100)).toBe(36);
    expect(readTypedNumber(" 24px ", 0, 100)).toBe(24);
    expect(readTypedNumber("1.35", 0, 3)).toBe(1.35);
  });

  it("keeps a typed number inside its limits", () => {
    expect(readTypedNumber("500", 0, 300)).toBe(300);
    expect(readTypedNumber("-4", 0, 300)).toBe(0);
  });

  it("ignores text that is not a number", () => {
    expect(readTypedNumber("", 0, 100)).toBeNull();
    expect(readTypedNumber("big", 0, 100)).toBeNull();
  });

  it("rounds away floating point noise", () => {
    expect(roundForStep(0.1 + 0.2, 0.1)).toBe(0.3);
    expect(roundForStep(1.2346, 0.001)).toBe(1.235);
  });

  it("steps with the arrow keys without leaving the limits", () => {
    expect(steppedNumber(10, 5, 0, 12)).toBe(12);
    expect(steppedNumber(2, -5, 0, 12)).toBe(0);
  });
});
