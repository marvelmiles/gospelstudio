import { describe, expect, it } from "vitest";
import { createLayer } from "./layerDefaults";
import {
  canStepLayer,
  moveLayerTo,
  stepLayer,
  topFirst,
} from "./layerOrdering";

const stack = () => [
  createLayer("background"),
  createLayer("camera"),
  createLayer("bible"),
];

const idsOf = (layers: { id: string }[]) => layers.map((layer) => layer.id);

describe("layer ordering", () => {
  it("brings a layer forward by one place", () => {
    const layers = stack();
    const moved = stepLayer(layers, layers[0].id, "forward");

    expect(idsOf(moved)).toEqual([layers[1].id, layers[0].id, layers[2].id]);
  });

  it("sends a layer all the way to the back", () => {
    const layers = stack();
    const moved = stepLayer(layers, layers[2].id, "back");

    expect(idsOf(moved)).toEqual([layers[2].id, layers[0].id, layers[1].id]);
  });

  it("returns the same list when the move changes nothing", () => {
    const layers = stack();

    expect(stepLayer(layers, layers[2].id, "front")).toBe(layers);
    expect(moveLayerTo(layers, "missing", 0)).toBe(layers);
  });

  it("knows when a layer cannot move further", () => {
    const layers = stack();

    expect(canStepLayer(layers, layers[2].id, "forward")).toBe(false);
    expect(canStepLayer(layers, layers[0].id, "backward")).toBe(false);
    expect(canStepLayer(layers, layers[1].id, "front")).toBe(true);
  });

  it("lists the front layer first for the layers panel", () => {
    const layers = stack();

    expect(idsOf(topFirst(layers))).toEqual(idsOf([...layers].reverse()));
    expect(idsOf(layers)[0]).toBe(layers[0].id);
  });
});
