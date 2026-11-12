import { describe, expect, it } from "vitest";
import { buildScripturePassage, rebuildPassage } from "./scripturePassage";

const longVerse = (v: number) => ({
  v,
  t: "For God so loved the world. ".repeat(14).trim(),
});

const passage = buildScripturePassage(
  {
    version: "KJV",
    range: {
      bookId: 43,
      bookName: "John",
      chapter: 3,
      verseStart: 16,
      verseEnd: 17,
    },
    verses: [longVerse(16), longVerse(17)],
    versesPerSlide: 2,
  },
  "passage-1",
  false,
);

describe("rebuilding a passage", () => {
  it("keeps whole verses together unless asked to split them", () => {
    expect(rebuildPassage(passage).slides).toHaveLength(1);
  });

  it("splits long verses across slides when asked", () => {
    const rebuilt = rebuildPassage(passage, {}, { splitLongVerses: true });
    expect(rebuilt.slides.length).toBeGreaterThan(1);
  });

  it("keeps the passage look when the verses change", () => {
    const styled = {
      ...passage,
      style: { fontSize: 3, align: "left" as const },
    };
    const rebuilt = rebuildPassage(styled, {
      range: { ...passage.range, verseStart: 16, verseEnd: 16 },
      verses: [{ v: 16, t: "For God so loved the world." }],
    });

    expect(rebuilt.style).toMatchObject({ fontSize: 3, align: "left" });
    expect(rebuilt.title).toBe("John 3:16 (KJV)");
  });
});
