import { describe, expect, it } from "vitest";
import { analyzeLines, prefixLength, remapColumn } from "./lists";

describe("list syntax", () => {
  it("reads a numbered line as a list item and renumbers it", () => {
    const [item] = analyzeLines(["16. For God so loved the world"]);
    expect(item).toMatchObject({
      kind: "decimal",
      index: 1,
      content: "For God so loved the world",
    });
    expect(prefixLength("16. For God")).toBe(4);
  });
});

describe("plain syntax", () => {
  it("keeps a leading number as part of the text", () => {
    const [item] = analyzeLines(["16. For God so loved the world"], "plain");
    expect(item).toEqual({
      level: 0,
      kind: null,
      index: 0,
      content: "16. For God so loved the world",
    });
  });

  it("never treats leading spaces or bullets as a prefix", () => {
    expect(prefixLength("  - point", "plain")).toBe(0);
    expect(analyzeLines(["  - point"], "plain")[0].content).toBe("  - point");
  });

  it("keeps the caret where it was typed", () => {
    expect(remapColumn("16. For", "16. For", 1, "plain")).toBe(1);
    expect(remapColumn("16. For", "16. For", 1)).toBe(4);
  });
});
