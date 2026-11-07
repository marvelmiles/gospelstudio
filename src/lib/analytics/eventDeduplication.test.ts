import { describe, expect, it } from "vitest";
import { createOccurrenceCheck } from "./eventDeduplication";

const WINDOW_MS = 1000;

const clock = () => {
  let time = 0;
  return {
    now: () => time,
    advance: (ms: number) => {
      time += ms;
    },
  };
};

describe("occurrence check", () => {
  it("lets the first occurrence of a key through and holds repeats inside the window", () => {
    const time = clock();
    const isFresh = createOccurrenceCheck(WINDOW_MS, time.now);
    expect(isFresh("manuscript:a")).toBe(true);
    time.advance(WINDOW_MS - 1);
    expect(isFresh("manuscript:a")).toBe(false);
  });

  it("counts the key again once the window has passed", () => {
    const time = clock();
    const isFresh = createOccurrenceCheck(WINDOW_MS, time.now);
    isFresh("manuscript:a");
    time.advance(WINDOW_MS);
    expect(isFresh("manuscript:a")).toBe(true);
  });

  it("tracks every key on its own", () => {
    const isFresh = createOccurrenceCheck(WINDOW_MS, clock().now);
    expect(isFresh("manuscript:a")).toBe(true);
    expect(isFresh("manuscript:b")).toBe(true);
  });
});
