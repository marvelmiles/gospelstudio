import { describe, expect, it } from "vitest";
import type { Background, MediaItem } from "../types";
import {
  BACKGROUNDS,
  BLACK_SAND_BACKGROUND_ID,
  BUILT_IN_MEDIA,
} from "../data/backgrounds";
import {
  builtInBackgroundEdit,
  withBuiltInBackgroundEdits,
  withBuiltInMediaEdits,
} from "./helpers";

const blackSand = BACKGROUNDS.find(
  (background) => background.id === BLACK_SAND_BACKGROUND_ID,
) as Background;

describe("withBuiltInBackgroundEdits", () => {
  it("returns the shipped backgrounds when nothing was edited", () => {
    expect(withBuiltInBackgroundEdits([])).toEqual(BACKGROUNDS);
  });

  it("applies a saved name and picture adjustments to a built-in", () => {
    const image = { ...blackSand.image, brightness: 80 } as Background["image"];
    const merged = withBuiltInBackgroundEdits([
      { ...blackSand, name: "Night Sand", image },
    ]);
    const edited = merged.find((bg) => bg.id === BLACK_SAND_BACKGROUND_ID);
    expect(edited).toMatchObject({ name: "Night Sand", image, builtIn: true });
    expect(edited?.src).toBe(blackSand.src);
  });

  it("ignores stored changes to fields a built-in cannot change", () => {
    const merged = withBuiltInBackgroundEdits([
      { ...blackSand, src: "/elsewhere.jpg", type: "solid" },
    ]);
    expect(merged.find((bg) => bg.id === BLACK_SAND_BACKGROUND_ID)).toEqual(
      blackSand,
    );
  });

  it("leaves out custom backgrounds", () => {
    const custom: Background = {
      id: "mine",
      name: "Mine",
      category: "Custom",
      type: "solid",
      color: "#000",
      builtIn: false,
    };
    expect(withBuiltInBackgroundEdits([custom])).toEqual(BACKGROUNDS);
  });
});

describe("builtInBackgroundEdit", () => {
  it("keeps only the name and image settings", () => {
    expect(
      builtInBackgroundEdit({ name: "Renamed", src: "/x.jpg", type: "solid" }),
    ).toEqual({ name: "Renamed" });
  });
});

describe("withBuiltInMediaEdits", () => {
  const [shipped] = BUILT_IN_MEDIA;

  it("returns the shipped media when nothing was edited", () => {
    expect(withBuiltInMediaEdits([])).toEqual(BUILT_IN_MEDIA);
  });

  it("applies saved name and settings but keeps the shipped file", () => {
    const image = { ...shipped.image, brightness: 70 } as MediaItem["image"];
    const merged = withBuiltInMediaEdits([
      { ...shipped, name: "Renamed", image, src: "/elsewhere.jpg" },
    ]);
    expect(merged[0]).toMatchObject({ name: "Renamed", image });
    expect(merged[0].src).toBe(shipped.src);
  });

  it("ignores the user's own media", () => {
    expect(
      withBuiltInMediaEdits([{ ...shipped, id: "mine", builtIn: false }]),
    ).toEqual(BUILT_IN_MEDIA);
  });
});
