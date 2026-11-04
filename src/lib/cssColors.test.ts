import { describe, expect, it } from "vitest";
import { isGradientValue, pickerHex } from "./cssColors";

describe("css colours", () => {
  it("recognises every kind of CSS gradient", () => {
    expect(isGradientValue("linear-gradient(90deg, red, blue)")).toBe(true);
    expect(isGradientValue("radial-gradient(circle, gold, orange)")).toBe(true);
    expect(isGradientValue("repeating-conic-gradient(red 0 10%)")).toBe(true);
    expect(isGradientValue("#ff0000")).toBe(false);
    expect(isGradientValue("rgb(0 0 0)")).toBe(false);
  });

  it("gives the colour picker a six digit hex", () => {
    expect(pickerHex("#F5C518")).toBe("#f5c518");
    expect(pickerHex("#abc")).toBe("#aabbcc");
  });

  it("starts the picker from black for a gradient", () => {
    expect(pickerHex("linear-gradient(red, blue)")).toBe("#000000");
  });
});
