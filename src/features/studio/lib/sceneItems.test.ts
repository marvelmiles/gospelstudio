import { describe, expect, it } from "vitest";
import { createLayer } from "./layerDefaults";
import {
  createProduction,
  createScene,
  takeProgramSnapshot,
} from "./productionFactory";
import { findItemLayer, findSceneItem } from "./sceneItems";

const words = createLayer("manuscript", { manuscriptId: "hymn" });
const camera = createLayer("camera");
const opening = createScene("Opening", [words]);
const sermon = createScene("Sermon", [camera]);
const production = {
  ...createProduction("Sunday", [opening, sermon]),
  previewSceneId: sermon.id,
  program: takeProgramSnapshot(opening),
};

describe("scene items", () => {
  it("finds an item in any scene and knows where it is shown", () => {
    expect(findSceneItem(production, words.id)).toMatchObject({
      sceneId: opening.id,
      sceneName: "Opening",
      isLive: true,
      isInPreview: false,
    });
    expect(findSceneItem(production, camera.id)).toMatchObject({
      isLive: false,
      isInPreview: true,
    });
  });

  it("prefers the live copy of an item that is on screen", () => {
    expect(findItemLayer(production, words.id)).toBe(
      production.program.layers[0],
    );
  });

  it("finds nothing for an item that was removed", () => {
    expect(findSceneItem(production, "gone")).toBeNull();
    expect(findItemLayer(null, words.id)).toBeNull();
  });
});
