import { describe, expect, it } from "vitest";
import { createLayer } from "./layerDefaults";
import {
  copyScene,
  createProduction,
  createScene,
  isSameSnapshot,
  isSceneLive,
  nextSceneName,
  referencedSourceIds,
  takeProgramSnapshot,
} from "./productionFactory";

describe("preview snapshots", () => {
  it("treats two snapshots of an unchanged scene as the same picture", () => {
    const scene = createScene("Worship", [createLayer("text")]);

    expect(
      isSameSnapshot(takeProgramSnapshot(scene), takeProgramSnapshot(scene)),
    ).toBe(true);
  });

  it("notices a moved layer, a new background or another scene", () => {
    const scene = createScene("Worship", [createLayer("text")]);
    const before = takeProgramSnapshot(scene);
    const moved = takeProgramSnapshot({
      ...scene,
      layers: scene.layers.map((layer) => ({
        ...layer,
        position: { x: layer.position.x + 10, y: layer.position.y },
      })),
    });
    const recoloured = takeProgramSnapshot({ ...scene, background: "#fff" });
    const otherScene = takeProgramSnapshot(createScene("Other", scene.layers));

    expect(isSameSnapshot(before, moved)).toBe(false);
    expect(isSameSnapshot(before, recoloured)).toBe(false);
    expect(isSameSnapshot(before, otherScene)).toBe(false);
  });
});

describe("program snapshots", () => {
  it("copies the scene so later edits do not reach the live screen", () => {
    const scene = createScene("Sermon", [createLayer("text")]);
    const snapshot = takeProgramSnapshot(scene);
    const firstLayer = scene.layers[0];
    if (firstLayer.type === "text") firstLayer.content = "Changed after";

    const liveLayer = snapshot.layers[0];
    expect(liveLayer.type === "text" && liveLayer.content).toBe(
      "Your text here",
    );
  });

  it("starts a video on the live screen only when it autoplays", () => {
    const scene = createScene("Clip", [
      createLayer("video", {
        autoplay: false,
        playback: { playing: true, restartToken: 0 },
      }),
    ]);
    const liveLayer = takeProgramSnapshot(scene).layers[0];

    expect(liveLayer.type === "video" && liveLayer.playback.playing).toBe(
      false,
    );
  });

  it("knows when the preview matches what is live", () => {
    const scene = createScene("Worship", [createLayer("manuscript")]);
    const snapshot = takeProgramSnapshot(scene);

    expect(isSceneLive(scene, snapshot)).toBe(true);
    expect(isSceneLive({ ...scene, background: "#ffffff" }, snapshot)).toBe(
      false,
    );
    expect(isSceneLive(scene, null)).toBe(false);
  });
});

describe("scenes", () => {
  it("copies a scene with new layer ids", () => {
    const scene = createScene("Original", [createLayer("camera")]);
    const copy = copyScene(scene, "Copy");

    expect(copy.id).not.toBe(scene.id);
    expect(copy.layers[0].id).not.toBe(scene.layers[0].id);
    expect(copy.layers[0].type).toBe("camera");
  });

  it("finds a free name for a new scene", () => {
    expect(
      nextSceneName([createScene("Scene 1"), createScene("Scene 2")]),
    ).toBe("Scene 3");
    expect(nextSceneName([createScene("Scene 2")])).toBe("Scene 3");
  });

  it("lists the cameras a scene needs", () => {
    const layers = [
      createLayer("camera", { sourceId: "a" }),
      createLayer("camera"),
      createLayer("text"),
    ];
    expect(referencedSourceIds(layers)).toEqual(["a"]);
  });

  it("starts a production with one scene in the preview", () => {
    const production = createProduction();

    expect(production.scenes).toHaveLength(1);
    expect(production.previewSceneId).toBe(production.scenes[0].id);
    expect(production.program).toBeNull();
  });
});
