import { describe, expect, it } from "vitest";
import { parseInlineFormatting } from "../../../lib/inlineFormat";
import {
  buildScriptureSlides,
  type ScriptureSlideOptions,
} from "./scriptureSlides";

const options: ScriptureSlideOptions = {
  version: "KJV",
  range: {
    bookId: 43,
    bookName: "John",
    chapter: 11,
    verseStart: 35,
    verseEnd: 35,
  },
  verses: [{ v: 35, t: "Jesus wept." }],
  versesPerSlide: 1,
  showVerseNumbers: true,
  showReference: false,
};

describe("scripture verse numbers", () => {
  it("writes inline numbers by default", () => {
    const [slide] = buildScriptureSlides(options);
    expect(slide.lines[0]).toBe("35. Jesus wept.");
  });

  it("writes small raised numbers when asked", () => {
    const [slide] = buildScriptureSlides({
      ...options,
      raisedVerseNumbers: true,
    });
    const segments = parseInlineFormatting(slide.lines[0]);

    expect(segments[0]).toMatchObject({ text: "35", style: { raised: true } });
    expect(segments.map((segment) => segment.text).join("")).toBe(
      "35 Jesus wept.",
    );
  });

  it("leaves numbers out when they are hidden", () => {
    const [slide] = buildScriptureSlides({
      ...options,
      showVerseNumbers: false,
      raisedVerseNumbers: true,
    });
    expect(slide.lines[0]).toBe("Jesus wept.");
  });
});
