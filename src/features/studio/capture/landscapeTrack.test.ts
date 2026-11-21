import { describe, expect, it } from "vitest";
import { FULL_HD_FRAME, letterboxInFrame } from "./landscapeTrack";

describe("letterboxInFrame", () => {
  it("fills the frame when the source is already 16:9", () => {
    expect(letterboxInFrame(3840, 2160)).toEqual({
      x: 0,
      y: 0,
      width: FULL_HD_FRAME.width,
      height: FULL_HD_FRAME.height,
    });
  });

  it("centres a portrait window between side bars", () => {
    expect(letterboxInFrame(1080, 1920)).toEqual({
      x: 656,
      y: 0,
      width: 608,
      height: FULL_HD_FRAME.height,
    });
  });

  it("centres a wide window between top and bottom bars", () => {
    expect(letterboxInFrame(2560, 1080)).toEqual({
      x: 0,
      y: 135,
      width: FULL_HD_FRAME.width,
      height: 810,
    });
  });

  it("scales a small window up to the frame height", () => {
    expect(letterboxInFrame(1280, 720)).toEqual({
      x: 0,
      y: 0,
      width: FULL_HD_FRAME.width,
      height: FULL_HD_FRAME.height,
    });
  });

  it("scales down into a smaller live stream frame", () => {
    expect(letterboxInFrame(1920, 1080, { width: 854, height: 480 })).toEqual({
      x: 1,
      y: 0,
      width: 853,
      height: 480,
    });
  });
});
