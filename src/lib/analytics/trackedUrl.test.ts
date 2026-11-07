import { describe, expect, it } from "vitest";
import {
  UNKNOWN_PAGE_PATH,
  trackedPath,
  trackedReferrer,
  trackedUrl,
} from "./trackedUrl";

const ORIGIN = "https://gospelstudio.app";

describe("tracked URLs", () => {
  it("keeps the pages people visit as they are", () => {
    expect(trackedPath("/")).toBe("/");
    expect(trackedPath("/bible")).toBe("/bible");
    expect(trackedPath("/studio")).toBe("/studio");
    expect(trackedPath("/manuscripts/new")).toBe("/manuscripts/new");
  });

  it("replaces record ids with the route pattern", () => {
    expect(trackedPath("/manuscripts/V1StGXR8_Z5jdHi6B")).toBe(
      "/manuscripts/:manuscriptId",
    );
    expect(trackedPath("/studio/items/abc123")).toBe("/studio/items/:layerId");
    expect(trackedPath("/use/background/sunrise")).toBe("/use/:asset/:assetId");
  });

  it("hides paths that are not app pages, since they can hold typed text", () => {
    expect(trackedPath("/my-sermon-notes/about-grace")).toBe(UNKNOWN_PAGE_PATH);
  });

  it("drops query strings except campaign tags", () => {
    expect(
      trackedUrl(
        `${ORIGIN}/camera?studio=room-secret&token=abc&utm_source=whatsapp#x`,
      ),
    ).toBe(`${ORIGIN}/camera?utm_source=whatsapp`);
    expect(trackedUrl(`${ORIGIN}/bible?reset=1`)).toBe(`${ORIGIN}/bible`);
  });

  it("never reports the admin dashboard", () => {
    expect(trackedUrl(`${ORIGIN}/admin/analytics`)).toBeNull();
  });

  it("cleans same-site referrers and keeps other sites as sent by the browser", () => {
    expect(trackedReferrer(`${ORIGIN}/manuscripts/abc?token=1`, ORIGIN)).toBe(
      `${ORIGIN}/manuscripts/:manuscriptId`,
    );
    expect(trackedReferrer("https://www.google.com/", ORIGIN)).toBe(
      "https://www.google.com/",
    );
    expect(trackedReferrer(null, ORIGIN)).toBeNull();
    expect(trackedReferrer("not a url", ORIGIN)).toBeNull();
  });
});
