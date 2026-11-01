import { describe, expect, it } from "vitest";
import type { MediaItem } from "../../../types";
import { DEFAULT_IMAGE_SETTINGS } from "../../../lib/media";
import { imageLookOf, videoLookOf } from "./mediaLooks";

const item = (overrides: Partial<MediaItem>): MediaItem => ({
  id: "item",
  kind: "image",
  name: "Item",
  size: 1,
  createdAt: "2026-10-31T00:00:00.000Z",
  updatedAt: "2026-10-31T00:00:00.000Z",
  ...overrides,
});

describe("media looks", () => {
  it("uses the settings from the library page by default", () => {
    const picture = item({
      image: { ...DEFAULT_IMAGE_SETTINGS, brightness: 140, fit: "cover" },
    });

    expect(imageLookOf(picture, {})).toMatchObject({
      brightness: 140,
      fit: "cover",
    });
  });

  it("lets the production change a setting without touching the rest", () => {
    const picture = item({
      image: { ...DEFAULT_IMAGE_SETTINGS, brightness: 140 },
    });
    const look = imageLookOf(picture, { grayscale: 100 });

    expect(look.grayscale).toBe(100);
    expect(look.brightness).toBe(140);
    expect(picture.image?.grayscale).toBe(0);
  });

  it("applies production changes over a video's own settings", () => {
    const clip = item({ kind: "video" });

    expect(videoLookOf(clip, { loop: true, volume: 40 })).toMatchObject({
      loop: true,
      volume: 40,
    });
  });
});
