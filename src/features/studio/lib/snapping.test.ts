import { describe, expect, it } from "vitest";
import { edgesOfDirection, snapMove, snapResize } from "./snapping";

const box = { x: 0, y: 0, width: 400, height: 300 };

describe("snapMove", () => {
  it("pulls a box onto the centre of the screen when it is close", () => {
    const result = snapMove({ ...box, x: 755, y: 392 }, [], 8);

    expect(result.frame.x).toBe(760);
    expect(result.frame.y).toBe(390);
    expect(result.guides).toEqual([
      { orientation: "vertical", position: 960 },
      { orientation: "horizontal", position: 540 },
    ]);
  });

  it("lines a box up with the edge of another layer", () => {
    const other = { x: 1000, y: 100, width: 300, height: 200 };
    const result = snapMove({ ...box, x: 1305, y: 600 }, [other], 8);

    expect(result.frame.x).toBe(1300);
    expect(result.guides).toContainEqual({
      orientation: "vertical",
      position: 1300,
    });
  });

  it("leaves a box alone when nothing is within reach", () => {
    const frame = { ...box, x: 333, y: 222 };
    const result = snapMove(frame, [], 8);

    expect(result.frame).toEqual(frame);
    expect(result.guides).toEqual([]);
  });
});

describe("snapResize", () => {
  it("moves only the edge that is being dragged", () => {
    const result = snapResize(
      { x: 100, y: 100, width: 1814, height: 300 },
      edgesOfDirection("right"),
      [],
      8,
    );

    expect(result.frame).toEqual({ x: 100, y: 100, width: 1820, height: 300 });
  });

  it("keeps the opposite edge still when the left edge snaps", () => {
    const result = snapResize(
      { x: 6, y: 100, width: 500, height: 300 },
      edgesOfDirection("left"),
      [],
      8,
    );

    expect(result.frame.x).toBe(0);
    expect(result.frame.x + result.frame.width).toBe(506);
  });
});

describe("edgesOfDirection", () => {
  it("reads corner handles as two edges", () => {
    expect(edgesOfDirection("bottomLeft")).toEqual({
      left: true,
      right: false,
      top: false,
      bottom: true,
    });
  });
});
