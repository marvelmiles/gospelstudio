import { describe, expect, it } from "vitest";
import { slideTransition } from "./animation";

const lastFrame = (frames: Keyframe[]) => frames[frames.length - 1];

describe("slideTransition", () => {
  it("clears a text slide before the next one fades in", () => {
    const { enter, exit, waitForExit } = slideTransition("fade", 500, "ease");
    expect(waitForExit).toBe(true);
    expect(exit.durationMs).toBeLessThan(500);
    expect(enter.keyframes[0]).toMatchObject({ opacity: 0 });
  });

  it("overlaps the two slides for a cross fade", () => {
    const { exit, waitForExit } = slideTransition("crossfade", 500, "ease");
    expect(waitForExit).toBe(false);
    expect(exit.durationMs).toBe(500);
  });

  it("pushes the old slide out the opposite way the new one comes in", () => {
    const { enter, exit } = slideTransition("slide-left", 500, "ease");
    expect(enter.keyframes[0].transform).toBe("translateX(16%)");
    expect(lastFrame(exit.keyframes).transform).toBe("translateX(-16%)");
  });

  it("fades moving text out before the incoming text shows", () => {
    const { enter, exit } = slideTransition("slide-up", 500, "ease");
    const outgoingGone = exit.keyframes.find((frame) => frame.offset !== 1);
    const incomingStarts = enter.keyframes.find(
      (frame) => frame.offset !== 0 && frame.offset !== 1,
    );
    expect(outgoingGone).toMatchObject({ opacity: 0 });
    expect(incomingStarts).toMatchObject({ opacity: 0 });
  });

  it("never clears or staggers pictures, so the screen does not dip", () => {
    const fade = slideTransition("fade", 500, "ease", { opaque: true });
    const slide = slideTransition("slide-left", 500, "ease", { opaque: true });
    expect(fade.waitForExit).toBe(false);
    expect(slide.enter.keyframes).toHaveLength(2);
    expect(slide.exit.keyframes).toHaveLength(1);
  });

  it("settles every animation at rest", () => {
    const { enter } = slideTransition("zoom", 500, "ease");
    expect(lastFrame(enter.keyframes)).toMatchObject({
      opacity: 1,
      transform: "none",
    });
  });
});
