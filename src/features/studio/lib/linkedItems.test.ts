import { describe, expect, it } from "vitest";
import type { Layer } from "../types/layer";
import { createLayer } from "./layerDefaults";
import {
  cloneItem,
  linkGroupOf,
  linkedLayers,
  patchItem,
  removeItem,
  sharedPatch,
  silenceEchoClones,
  unlinkItem,
} from "./linkedItems";

const cloned = (layers: Layer[], layerId: string, linkId = "link-1") => {
  const result = cloneItem(layers, layerId, linkId);
  if (!result) throw new Error("Nothing was cloned");
  return result;
};

const byId = (layers: Layer[], id: string): Layer => {
  const layer = layers.find((entry) => entry.id === id);
  if (!layer) throw new Error(`No layer ${id}`);
  return layer;
};

describe("linked items", () => {
  const bible = createLayer("bible", { name: "John 3:16", slideIndex: 0 });
  const text = createLayer("text", { content: "Welcome" });

  it("puts a clone right after the original, linked and slightly offset", () => {
    const { layers, clone } = cloned([bible, text], bible.id);

    expect(layers.map((layer) => layer.id)).toEqual([
      bible.id,
      clone.id,
      text.id,
    ]);
    expect(byId(layers, bible.id).linkId).toBe("link-1");
    expect(clone.linkId).toBe("link-1");
    expect(clone.name).toBe(bible.name);
    expect(clone.position.x).toBeGreaterThan(bible.position.x);
    expect(clone.locked).toBe(false);
  });

  it("adds a clone of a clone to the same group", () => {
    const first = cloned([bible], bible.id);
    const second = cloned(first.layers, first.clone.id, "unused");

    expect(second.clone.linkId).toBe("link-1");
    expect(
      linkedLayers(second.layers, byId(second.layers, bible.id)),
    ).toHaveLength(2);
  });

  it("shares what an item shows with its clones", () => {
    const { layers, clone } = cloned([bible, text], bible.id);
    const next = patchItem(layers, clone.id, {
      slideIndex: 3,
      name: "Psalm 23",
    });

    expect(byId(next, bible.id)).toMatchObject({
      slideIndex: 3,
      name: "Psalm 23",
    });
    expect(byId(next, clone.id)).toMatchObject({
      slideIndex: 3,
      name: "Psalm 23",
    });
    expect(byId(next, text.id)).toBe(text);
  });

  it("keeps each clone's place, size, hiding and locking its own", () => {
    const { layers, clone } = cloned([bible], bible.id);
    const next = patchItem(layers, clone.id, {
      position: { x: 500, y: 200 },
      dimensions: { width: 400, height: 225 },
      visible: false,
      locked: true,
    });

    expect(byId(next, bible.id)).toMatchObject({
      position: bible.position,
      dimensions: bible.dimensions,
      visible: true,
      locked: false,
    });
  });

  it("keeps camera fit and image cropping per clone", () => {
    expect(sharedPatch("camera", { fit: "contain", sourceId: "cam" })).toEqual({
      sourceId: "cam",
    });
    expect(sharedPatch("image", { focusX: 20, zoom: 140 })).toBeNull();
    expect(sharedPatch("text", { content: "Hi" })).toEqual({ content: "Hi" });
  });

  it("leaves other groups alone", () => {
    const first = cloned([bible, text], bible.id, "bible-link");
    const second = cloned(first.layers, text.id, "text-link");
    const next = patchItem(second.layers, bible.id, { slideIndex: 2 });

    expect(byId(next, text.id)).toBe(byId(second.layers, text.id));
    expect(byId(next, second.clone.id)).toBe(second.clone);
  });

  it("removes an item together with its clones", () => {
    const { layers } = cloned([bible, text], bible.id);

    expect(removeItem(layers, bible.id).map((layer) => layer.id)).toEqual([
      text.id,
    ]);
    expect(removeItem(layers, "missing")).toBe(layers);
  });

  it("frees both items when the last pair is unlinked", () => {
    const { layers, clone } = cloned([bible], bible.id);
    const next = unlinkItem(layers, clone.id);

    expect(next.every((layer) => layer.linkId === null)).toBe(true);
  });

  it("keeps the rest of a bigger group linked when one leaves", () => {
    const first = cloned([bible], bible.id);
    const second = cloned(first.layers, bible.id);
    const next = unlinkItem(second.layers, second.clone.id);

    expect(byId(next, second.clone.id).linkId).toBeNull();
    expect(byId(next, bible.id).linkId).toBe("link-1");
    expect(byId(next, first.clone.id).linkId).toBe("link-1");
  });

  it("groups clones together and every other item on its own", () => {
    const { layers, clone } = cloned([bible, text], bible.id);

    expect(linkGroupOf(byId(layers, bible.id))).toBe(linkGroupOf(clone));
    expect(linkGroupOf(text)).toBe(text.id);
  });

  it("lets only the first linked video play its sound", () => {
    const video = createLayer("video", { mediaId: "clip" });
    const { layers, clone } = cloned([video], video.id);
    const heard = silenceEchoClones(layers);

    expect(byId(heard, video.id)).toBe(byId(layers, video.id));
    expect(byId(heard, clone.id)).toMatchObject({ overrides: { muted: true } });
    expect(silenceEchoClones([video, text])).toEqual([video, text]);
  });
});
