import { describe, expect, it } from "vitest";
import { AdaptiveBitrate } from "./adaptiveBitrate";

const RANGE = { minKbps: 700, maxKbps: 2500, audioKbps: 128 };

const bytesFor = (milliseconds: number, kbps: number) =>
  Math.round((milliseconds * kbps) / 8);

describe("adaptive bitrate", () => {
  it("starts at the quality's full bitrate on a healthy connection", () => {
    const controller = new AdaptiveBitrate(RANGE);
    const decision = controller.update(0);
    expect(decision).toEqual({
      targetKbps: 2500,
      dropVideo: false,
      bufferedMs: 0,
      health: "good",
    });
  });

  it("lowers the picture bitrate quickly when the upload backs up", () => {
    const controller = new AdaptiveBitrate(RANGE);
    const soft = controller.update(bytesFor(800, 2628));
    expect(soft.targetKbps).toBe(2250);
    const hard = controller.update(bytesFor(2000, 2378));
    expect(hard.targetKbps).toBe(1575);
    expect(hard.health).toBe("poor");
  });

  it("never goes below the quality's floor", () => {
    const controller = new AdaptiveBitrate(RANGE);
    for (let second = 0; second < 20; second += 1)
      controller.update(bytesFor(3000, 3000));
    expect(controller.targetKbps).toBe(700);
  });

  it("drops video frames only when the backlog is very large", () => {
    const controller = new AdaptiveBitrate(RANGE);
    expect(controller.update(bytesFor(3000, 2628)).dropVideo).toBe(false);
    expect(controller.update(bytesFor(6000, 2000)).dropVideo).toBe(true);
  });

  it("raises the bitrate again after the connection stays calm", () => {
    const controller = new AdaptiveBitrate(RANGE);
    for (let second = 0; second < 6; second += 1)
      controller.update(bytesFor(3000, 3000));
    expect(controller.targetKbps).toBe(700);
    for (let second = 0; second < 7; second += 1) controller.update(0);
    expect(controller.targetKbps).toBe(700);
    controller.update(0);
    expect(controller.targetKbps).toBe(770);
  });

  it("calls a reduced but flowing stream weak", () => {
    const controller = new AdaptiveBitrate(RANGE);
    controller.update(bytesFor(2000, 2628));
    controller.update(bytesFor(2000, 1878));
    expect(controller.update(0).health).toBe("weak");
  });
});
