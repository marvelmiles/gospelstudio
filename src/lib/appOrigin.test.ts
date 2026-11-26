import { afterEach, describe, expect, it } from "vitest";
import { APP_ORIGIN_PLACEHOLDER, appUrl, withAppOrigin } from "./appOrigin";

const ORIGIN = "https://gospelstudio.app";

const textResponse = (
  body: string,
  contentType: string,
  init: ResponseInit = {},
): Response =>
  new Response(body, {
    ...init,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(body.length),
      "Cache-Control": "no-store",
    },
  });

describe("app address", () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "window");
  });

  it("builds links on the address the app is opened on", () => {
    Object.assign(globalThis, {
      window: { location: { origin: "https://dev--gospelstudio.netlify.app" } },
    });
    expect(appUrl("/camera")).toBe(
      "https://dev--gospelstudio.netlify.app/camera",
    );
  });

  it("joins an address and a path with exactly one slash", () => {
    expect(appUrl("/", ORIGIN)).toBe(`${ORIGIN}/`);
    expect(appUrl("bible", `${ORIGIN}/`)).toBe(`${ORIGIN}/bible`);
    expect(appUrl("/manuscripts", APP_ORIGIN_PLACEHOLDER)).toBe(
      `${APP_ORIGIN_PLACEHOLDER}/manuscripts`,
    );
  });
});

describe("filling the address into static files", () => {
  it("puts the address the request came to into every placeholder", async () => {
    const page = `<link rel="canonical" href="${APP_ORIGIN_PLACEHOLDER}/bible" /><meta property="og:image" content="${APP_ORIGIN_PLACEHOLDER}/link-preview.jpg" />`;
    const filled = await withAppOrigin(
      textResponse(page, "text/html; charset=UTF-8"),
      ORIGIN,
    );
    expect(await filled.text()).toBe(
      `<link rel="canonical" href="${ORIGIN}/bible" /><meta property="og:image" content="${ORIGIN}/link-preview.jpg" />`,
    );
    expect(filled.headers.get("content-length")).toBeNull();
    expect(filled.headers.get("cache-control")).toBe("no-store");
  });

  it("fills the sitemap and robots.txt too", async () => {
    const sitemap = await withAppOrigin(
      textResponse(`<loc>${APP_ORIGIN_PLACEHOLDER}/</loc>`, "application/xml"),
      ORIGIN,
    );
    const robots = await withAppOrigin(
      textResponse(
        `Sitemap: ${APP_ORIGIN_PLACEHOLDER}/sitemap.xml`,
        "text/plain; charset=UTF-8",
      ),
      ORIGIN,
    );
    expect(await sitemap.text()).toBe(`<loc>${ORIGIN}/</loc>`);
    expect(await robots.text()).toBe(`Sitemap: ${ORIGIN}/sitemap.xml`);
  });

  it("keeps the status of the original response", async () => {
    const missing = await withAppOrigin(
      textResponse("Not found", "text/plain", { status: 404 }),
      ORIGIN,
    );
    expect(missing.status).toBe(404);
  });

  it("passes other files and empty answers through untouched", async () => {
    const script = textResponse(
      `const a = "${APP_ORIGIN_PLACEHOLDER}";`,
      "text/javascript",
    );
    const notModified = new Response(null, {
      status: 304,
      headers: { "Content-Type": "text/html" },
    });
    expect(await withAppOrigin(script, ORIGIN)).toBe(script);
    expect(await withAppOrigin(notModified, ORIGIN)).toBe(notModified);
  });
});
