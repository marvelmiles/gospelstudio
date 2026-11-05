import { describe, expect, it } from "vitest";
import { SCRIPTURE_SLIDE_TYPE, slideBodySyntax } from "./textSyntax";

describe("slide body syntax", () => {
  it("keeps scripture text plain so verse numbers stay as written", () => {
    expect(slideBodySyntax({ type: SCRIPTURE_SLIDE_TYPE })).toBe("plain");
  });

  it("allows lists on every other slide", () => {
    expect(slideBodySyntax({ type: "verse" })).toBe("lists");
    expect(slideBodySyntax({ type: "sermon" })).toBe("lists");
  });
});
