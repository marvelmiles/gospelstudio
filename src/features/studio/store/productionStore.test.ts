import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLayer } from "../lib/layerDefaults";
import { createProduction, createScene } from "../lib/productionFactory";
import {
  INITIAL_PRODUCTION_STATE,
  cancelScheduledSave,
  editPreviewLayers,
  redo,
  undo,
  useProductionStore,
} from "./productionStore";

const previewLayerNames = (): string[] => {
  const production = useProductionStore.getState().production;
  const scene = production?.scenes.find(
    (entry) => entry.id === production.previewSceneId,
  );
  return scene?.layers.map((layer) => layer.name) ?? [];
};

const rename = (name: string, coalesceKey?: string) =>
  editPreviewLayers((layers) => layers.map((layer) => ({ ...layer, name })), {
    coalesceKey,
  });

describe("production history", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("window", globalThis);
    const production = createProduction("Test", [
      createScene("Scene 1", [createLayer("text", { name: "Start" })]),
    ]);
    useProductionStore.setState({
      ...INITIAL_PRODUCTION_STATE,
      status: "ready",
      production,
    });
  });

  afterEach(() => {
    cancelScheduledSave();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("undoes and redoes an edit", () => {
    rename("Changed");
    expect(previewLayerNames()).toEqual(["Changed"]);

    undo();
    expect(previewLayerNames()).toEqual(["Start"]);

    redo();
    expect(previewLayerNames()).toEqual(["Changed"]);
  });

  it("folds quick edits to the same field into one undo step", () => {
    rename("A", "name");
    rename("AB", "name");
    rename("ABC", "name");

    expect(useProductionStore.getState().past).toHaveLength(1);
    undo();
    expect(previewLayerNames()).toEqual(["Start"]);
  });

  it("forgets the redo steps once something new is changed", () => {
    rename("First");
    undo();
    rename("Second");

    expect(useProductionStore.getState().future).toHaveLength(0);
  });

  it("marks the production as needing a save after an edit", () => {
    rename("Changed");
    expect(useProductionStore.getState().saveState).toBe("unsaved");
  });
});
