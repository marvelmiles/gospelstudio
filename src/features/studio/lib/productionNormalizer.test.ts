import { describe, expect, it } from "vitest";
import type { Layer } from "../types/layer";
import { createLayer } from "./layerDefaults";
import { createProduction, createScene } from "./productionFactory";
import {
  normalizeImportedProduction,
  normalizeLayers,
  normalizeProduction,
} from "./productionNormalizer";

const storedAs = (value: object): Layer => value as Layer;

describe("stored productions", () => {
  it("fills in fields that older saves do not have", () => {
    const { fill: _fill, preset: _preset, ...olderText } = createLayer("text");
    const [layer] = normalizeLayers([storedAs(olderText)]);

    expect(layer.type === "text" && layer.fill.kind).toBe("none");
    expect(layer.type === "text" && layer.preset).toBe("body");
    expect(layer.id).toBe(olderText.id);
  });

  it("completes settings inside an item that older saves do not have", () => {
    const { border: _border, ...olderText } = createLayer("text");
    const { gradient: _gradient, ...olderFill } = olderText.fill;
    const [layer] = normalizeLayers([
      storedAs({ ...olderText, fill: { ...olderFill, kind: "color" } }),
    ]);

    expect(layer.border.width).toBe(0);
    expect(layer.type === "text" && layer.fill.kind).toBe("color");
    expect(layer.type === "text" && layer.fill.gradient).toBeNull();
  });

  it("keeps what was saved over the defaults", () => {
    const saved = createLayer("text", { content: "Welcome home" });
    const [layer] = normalizeLayers([saved]);

    expect(layer).toEqual(saved);
  });

  it("drops layer types the studio no longer has", () => {
    const layers = normalizeLayers([
      storedAs({ ...createLayer("text"), type: "lyrics" }),
      createLayer("qr"),
    ]);

    expect(layers.map((layer) => layer.type)).toEqual(["qr"]);
  });

  it("cleans every scene of a production", () => {
    const production = createProduction("Sunday", [
      createScene("Old", [
        storedAs({ ...createLayer("text"), type: "subtitle" }),
      ]),
    ]);

    expect(normalizeProduction(production).scenes[0].layers).toEqual([]);
  });
});

describe("imported productions", () => {
  const imported = {
    id: "shared",
    name: "Easter",
    scenes: [
      {
        id: "scene-a",
        name: "Welcome",
        layers: [
          { id: "words", type: "text", content: "He is risen" },
          { id: "old", type: "lyrics" },
        ],
      },
    ],
    sources: [],
    previewSceneId: "missing-scene",
    settings: { snapToGuides: false },
  };

  it("completes scenes and layers with today's defaults", () => {
    const production = normalizeImportedProduction(imported);
    const [layer] = production.scenes[0].layers;

    expect(production.scenes[0].layers).toHaveLength(1);
    expect(layer.type === "text" && layer.content).toBe("He is risen");
    expect(production.scenes[0].transition.kind).toBeDefined();
    expect(production.settings).toMatchObject({
      snapToGuides: false,
      autoUpdateScene: true,
    });
  });

  it("arrives off air, previewing a scene it really has", () => {
    const production = normalizeImportedProduction(imported);

    expect(production.program).toBeNull();
    expect(production.previewSceneId).toBe("scene-a");
  });
});
