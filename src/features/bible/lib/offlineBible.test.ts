import { describe, expect, it } from "vitest";
import { searchBibleVerses } from "./offlineBible";

describe("bible word search", () => {
  it("counts every match by book so results can be grouped", async () => {
    const page = await searchBibleVerses("KJV", "living water", 1);
    const counted = Object.values(page.countsByBook).reduce(
      (sum, count) => sum + count,
      0,
    );

    expect(page.total).toBeGreaterThan(0);
    expect(counted).toBe(page.total);
    expect(page.countsByBook[43]).toBeGreaterThan(0);
    expect(
      page.results.every((result, index, all) =>
        index === 0 ? true : all[index - 1].bookId <= result.bookId,
      ),
    ).toBe(true);
  });

  it("finds nothing for an empty search", async () => {
    expect(await searchBibleVerses("KJV", "   ", 1)).toEqual({
      results: [],
      total: 0,
      countsByBook: {},
    });
  });
});
