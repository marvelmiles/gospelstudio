import { describe, expect, it } from "vitest";
import { matchBooks, referenceGroups, singleBookOf } from "./searchGroups";

const names = (books: { name: string }[]) => books.map((book) => book.name);

const chapterNames = (
  chapters: { book: { name: string }; chapter: number }[],
) => chapters.map(({ book, chapter }) => `${book.name} ${chapter}`);

describe("bible search groups", () => {
  it("shows nothing for an empty search", () => {
    expect(referenceGroups("   ")).toEqual({
      passage: null,
      verses: [],
      chapters: [],
      books: [],
    });
  });

  it("lists matching books with the best match first", () => {
    expect(names(matchBooks("john"))).toEqual([
      "John",
      "1 John",
      "2 John",
      "3 John",
    ]);
    expect(names(matchBooks("1 jn"))[0]).toBe("1 John");
    expect(matchBooks("living water")).toEqual([]);
    expect(matchBooks("3")).toEqual([]);
  });

  it("offers every chapter of a book named on its own", () => {
    const groups = referenceGroups("john");

    expect(groups.passage).toBeNull();
    expect(names(groups.books)[0]).toBe("John");
    expect(groups.chapters).toHaveLength(21);
    expect(singleBookOf(groups.chapters)?.name).toBe("John");
  });

  it("turns a chapter into a passage with each of its verses", () => {
    const groups = referenceGroups("ps 23");

    expect(groups.passage?.book.name).toBe("Psalms");
    expect(groups.passage?.chapter).toBe(23);
    expect(groups.verses).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("lists the same chapter in other matching books, not the one typed", () => {
    expect(chapterNames(referenceGroups("john 3").chapters)).toEqual([
      "1 John 3",
    ]);
  });

  it("keeps the whole chapter on offer when verses were typed", () => {
    const groups = referenceGroups("john 3:16");

    expect(groups.passage?.verseStart).toBe(16);
    expect(groups.verses).toEqual([]);
    expect(chapterNames(groups.chapters)).toEqual(["John 3", "1 John 3"]);
  });

  it("offers other books a short name could mean", () => {
    const groups = referenceGroups("jn 3:16");

    expect(groups.passage?.book.name).toBe("John");
    expect(chapterNames(groups.chapters)).toEqual(["John 3", "Jonah 3"]);
  });

  it("splits a verse range into its verses", () => {
    expect(referenceGroups("John 3:16-18").verses).toEqual([16, 17, 18]);
  });

  it("leaves plain words to the word search", () => {
    const groups = referenceGroups("living water");

    expect(groups.passage).toBeNull();
    expect(groups.books).toEqual([]);
    expect(groups.chapters).toEqual([]);
  });

  it("only treats chapters from one book as that book's chapters", () => {
    const [john, firstJohn] = matchBooks("john");

    expect(
      singleBookOf([
        { book: john, chapter: 3 },
        { book: firstJohn, chapter: 3 },
      ]),
    ).toBeNull();
    expect(singleBookOf([])).toBeNull();
  });
});
