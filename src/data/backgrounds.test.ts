import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { BACKGROUNDS, BUILT_IN_MEDIA } from "./backgrounds";

const publicFile = (src: string): string =>
  fileURLToPath(new URL(`../../public${src}`, import.meta.url));

const builtInPictures = [
  ...BUILT_IN_MEDIA.filter((item) => item.kind === "image"),
  ...BACKGROUNDS.filter((background) => background.type === "image"),
];

describe("built-in pictures", () => {
  it("each have a small thumbnail for previews", () => {
    for (const picture of builtInPictures) {
      expect(picture.thumbSrc, picture.name).toBeDefined();
      expect(existsSync(publicFile(picture.thumbSrc ?? "")), picture.name).toBe(
        true,
      );
    }
  });
});
