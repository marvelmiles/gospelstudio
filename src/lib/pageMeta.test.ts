import { describe, expect, it } from "vitest";
import { APP_CATEGORY, APP_NAME } from "../../app.config";
import { APP_ORIGIN_PLACEHOLDER } from "./appOrigin";
import { PAGE_META, pageUrl } from "./pageMeta";

const ORIGIN = "https://gospelstudio.app";

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

  it("builds absolute links on the address it is given", () => {
    expect(pageUrl(PAGE_META.home, ORIGIN)).toBe(`${ORIGIN}/`);
    expect(pageUrl(PAGE_META.manuscripts, ORIGIN)).toBe(
      `${ORIGIN}/manuscripts`,
    );
  });

  it("leaves the placeholder in built pages for the host to fill in", () => {
    expect(pageUrl(PAGE_META.bible, APP_ORIGIN_PLACEHOLDER)).toBe(
      `${APP_ORIGIN_PLACEHOLDER}/bible`,
    );
  });
});
