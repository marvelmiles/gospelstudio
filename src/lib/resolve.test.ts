import { describe, expect, it } from "vitest";
import type { Slide, SlideDeckDoc } from "../types";
import { THEMES } from "../data/themes";
import { resolveStyle } from "./resolve";

const theme = THEMES[0];

const slide = (overrides: Slide["overrides"] = {}): Slide => ({
  id: "slide",
  type: "verse",
  label: "Verse",
  lines: ["Amazing grace"],
  overrides,
  notes: "",
});

const doc = (style: SlideDeckDoc["style"]): SlideDeckDoc => ({
  id: "doc",
  title: "Song",
  slides: [],
  defaultThemeId: theme.id,
  style,
  createdAt: "",
  updatedAt: "",
});

describe("slide text position", () => {
  it("stays unset so the words sit in the middle", () => {
    expect(resolveStyle(slide(), doc({}), theme).verticalAlign).toBeUndefined();
  });

  it("follows the document, and a slide can change it", () => {
    const lowered = doc({ verticalAlign: "bottom" });
    expect(resolveStyle(slide(), lowered, theme).verticalAlign).toBe("bottom");
    expect(
      resolveStyle(slide({ verticalAlign: "top" }), lowered, theme)
        .verticalAlign,
    ).toBe("top");
  });
});
