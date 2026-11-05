import { describe, expect, it } from "vitest";
import { parseInlineFormatting } from "../../../lib/inlineFormat";
import {
  buildScriptureSlides,
  slideIndexForVerse,
  verseStartsBySlide,
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

  it("marks slides as scripture so their numbers are never read as a list", () => {
    const [slide] = buildScriptureSlides(options);
    expect(slide.type).toBe("scripture");
  });
});

describe("finding verses on slides", () => {
  const longVerse = { v: 16, t: "For God so loved the world. ".repeat(14) };
  const passage = {
    ...options,
    verses: [longVerse, { v: 17, t: "For God sent not his Son." }],
    showVerseNumbers: false,
    quick: true,
  };

  it("matches the slides that are built", () => {
    const slides = buildScriptureSlides({ ...passage, splitLongVerses: true });
    expect(verseStartsBySlide(passage)).toHaveLength(slides.length);
  });

  it("starts each verse on its first slide and leaves continuations empty", () => {
    const starts = verseStartsBySlide(passage);
    expect(starts.length).toBeGreaterThan(2);
    expect(starts[0]).toEqual([16]);
    expect(starts.slice(1, -1)).toEqual(
      Array.from({ length: starts.length - 2 }, () => []),
    );
    expect(starts[starts.length - 1]).toEqual([17]);
    expect(slideIndexForVerse(passage, 17)).toBe(starts.length - 1);
  });
});
