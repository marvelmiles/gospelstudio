import { describe, expect, test } from "vitest";
import {
  chunkLinesToFit,
  DEFAULT_SLIDE_TEXT_METRICS,
  slideRowCapacity,
  slideRowsForText,
} from "./slideLayout";
import { wrappedRowCount } from "./textMeasure";

const characterWidth = (text: string) => text.length;

describe("wrappedRowCount", () => {
  test("keeps a line that fits on one row", () => {
    expect(wrappedRowCount("Amazing grace", 20, characterWidth)).toBe(1);
  });

  test("wraps between words rather than mid word", () => {
    expect(wrappedRowCount("aaaa bbbb cccc", 9, characterWidth)).toBe(2);
  });

  test("counts an empty line as one row", () => {
    expect(wrappedRowCount("   ", 10, characterWidth)).toBe(1);
  });

  test("spreads a word wider than the row over several rows", () => {
    expect(wrappedRowCount("a".repeat(25), 10, characterWidth)).toBe(3);
  });
});

describe("slide capacity", () => {
  test("the default text size holds six rows with room top and bottom", () => {
    expect(slideRowCapacity(DEFAULT_SLIDE_TEXT_METRICS)).toBe(6);
  });

  test("a short lyric line takes a single row", () => {
    expect(
      slideRowsForText("Amazing grace how sweet", DEFAULT_SLIDE_TEXT_METRICS),
    ).toBe(1);
  });

  test("ordinary lyric lines fill more than two per slide", () => {
    const stanza = [
      "Amazing grace how sweet the sound",
      "That saved a wretch like me",
      "I once was lost but now am found",
      "Was blind but now I see",
    ];
    const [firstSlide] = chunkLinesToFit(stanza, DEFAULT_SLIDE_TEXT_METRICS);
    expect(firstSlide.length).toBeGreaterThan(2);
  });
});
