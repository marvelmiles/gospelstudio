import { describe, expect, it } from "vitest";
import {
  RECORDING_HEIGHT,
  RECORDING_WIDTH,
  letterboxInRecording,
} from "./landscapeTrack";

describe("letterboxInRecording", () => {
  it("fills the frame when the source is already 16:9", () => {
    expect(letterboxInRecording(3840, 2160)).toEqual({
      x: 0,
      y: 0,
      width: RECORDING_WIDTH,
      height: RECORDING_HEIGHT,
    });
  });

  it("centres a portrait window between side bars", () => {
    expect(letterboxInRecording(1080, 1920)).toEqual({
      x: 656,
      y: 0,
      width: 608,
      height: RECORDING_HEIGHT,
    });
  });

  it("centres a wide window between top and bottom bars", () => {
    expect(letterboxInRecording(2560, 1080)).toEqual({
      x: 0,
      y: 135,
      width: RECORDING_WIDTH,
      height: 810,
    });
  });

  it("scales a small window up to the recording height", () => {
    const box = letterboxInRecording(1280, 720);
    expect(box).toEqual({
      x: 0,
      y: 0,
      width: RECORDING_WIDTH,
      height: RECORDING_HEIGHT,
    });
  });
});
