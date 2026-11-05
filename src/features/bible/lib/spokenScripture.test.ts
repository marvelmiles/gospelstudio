import { describe, expect, it } from "vitest";
import type { ScripturePassage } from "../../../types";
import { buildScripturePassage } from "./scripturePassage";
import { buildScriptureSlides } from "./scriptureSlides";
import { spokenPassageSlides, spokenVerse } from "./spokenScripture";

const range = {
  bookId: 43,
  bookName: "John",
  chapter: 11,
  verseStart: 35,
  verseEnd: 36,
};

const verses = [
  { v: 35, t: "Jesus wept." },
  { v: 36, t: "Then said the Jews, Behold how he loved him!" },
];

type Layout = Partial<
  Pick<
    ScripturePassage,
    | "showVerseNumbers"
    | "raisedVerseNumbers"
    | "versesPerSlide"
    | "showReference"
  >
>;

const passageWith = (layout: Layout = {}): ScripturePassage => {
  const passage = {
    ...buildScripturePassage({ version: "KJV", range, verses }, "id", false),
    ...layout,
  };
  return { ...passage, slides: buildScriptureSlides(passage) };
};

describe("reading a verse in the Bible reader", () => {
  it("says the verse number first", () => {
    expect(spokenVerse(verses[0], true)).toBe("Verse 35. Jesus wept.");
  });

  it("reads only the words when verse numbers are turned off", () => {
    expect(spokenVerse(verses[0], false)).toBe("Jesus wept.");
  });
});

describe("reading a presented passage", () => {
  it("turns written verse numbers into spoken ones and skips the reference", () => {
    expect(spokenPassageSlides(passageWith(), true)).toEqual([
      "Verse 35. Jesus wept.",
      "Verse 36. Then said the Jews, Behold how he loved him!",
    ]);
  });

  it("drops written verse numbers when they should not be said", () => {
    expect(spokenPassageSlides(passageWith(), false)).toEqual([
      "Jesus wept.",
      "Then said the Jews, Behold how he loved him!",
    ]);
  });

  it("reads raised verse numbers as spoken numbers", () => {
    const passage = passageWith({ raisedVerseNumbers: true });
    expect(spokenPassageSlides(passage, true)[0]).toBe("Verse 35. Jesus wept.");
  });

  it("says each verse number even when the slides hide them", () => {
    const passage = passageWith({ showVerseNumbers: false, versesPerSlide: 2 });
    expect(spokenPassageSlides(passage, true)).toEqual([
      "Verse 35. Jesus wept.\nVerse 36. Then said the Jews, Behold how he loved him!",
    ]);
  });

  it("reads hidden-number slides as written when numbers are off", () => {
    const passage = passageWith({ showVerseNumbers: false });
    expect(spokenPassageSlides(passage, false)).toEqual([
      "Jesus wept.",
      "Then said the Jews, Behold how he loved him!",
    ]);
  });
});
