import { describe, expect, it } from "vitest";
import {
  deleteBackward,
  lineContentOffsets,
  replaceRange,
} from "./inlineDocument";

describe("editing plain text", () => {
  it("types before a verse number instead of after it", () => {
    expect(replaceRange("16. For God", 0, 0, "x", "plain").text).toBe(
      "x16. For God",
    );
    expect(replaceRange("16. For God", 0, 0, "x").text).toBe("16. xFor God");
  });

  it("splits a line without turning the verse into a numbered list", () => {
    const text = "16. For God so loved";
    const caret = "16. For God".length;

    expect(replaceRange(text, caret, caret, "\n", "plain")).toEqual({
      text: "16. For God\n so loved",
      selectionStart: caret + 1,
      selectionEnd: caret + 1,
    });
    expect(replaceRange(text, caret, caret, "\n").text).toBe(
      "1. For God\n2. so loved",
    );
  });

  it("joins lines when deleting at the start of a numbered verse", () => {
    expect(deleteBackward("a\n16. b", 2, 2, "plain")?.text).toBe("a16. b");
    expect(deleteBackward("a\n16. b", 6, 6)?.text).toBe("a\nb");
  });

  it("maps the caret from the start of each line", () => {
    expect(lineContentOffsets(["16. a", "b"], "plain")).toEqual([0, 6]);
    expect(lineContentOffsets(["16. a", "b"])).toEqual([4, 6]);
  });
});
