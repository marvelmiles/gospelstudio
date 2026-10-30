import { describe, expect, it } from "vitest";
import { APP_CATEGORY, APP_NAME, APP_URL } from "../../app.config";
import { PAGE_META, pageUrl } from "./pageMeta";

const pages = Object.values(PAGE_META);

const MAX_TITLE_LENGTH = 50;

describe("page meta", () => {
  it("gives every page its own path", () => {
    const paths = pages.map((page) => page.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("names the app and what it is in every page title", () => {
    for (const page of pages) {
      expect(page.title).toContain(APP_NAME);
      expect(page.title).toContain(APP_CATEGORY);
    }
  });

  it("keeps every page title within the length limit", () => {
    for (const page of pages)
      expect(page.title.length, page.title).toBeLessThanOrEqual(
        MAX_TITLE_LENGTH,
      );
  });

  it("builds absolute links on the app's own address", () => {
    expect(pageUrl(PAGE_META.home)).toBe(APP_URL);
    expect(pageUrl(PAGE_META.manuscripts)).toBe(`${APP_URL}manuscripts`);
  });
});
