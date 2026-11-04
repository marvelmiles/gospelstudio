import { describe, expect, it } from "vitest";
import { BUILT_IN_MEDIA } from "../../../data/backgrounds";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./canvasCoordinates";
import { SCENE_TEMPLATES, findTemplate } from "./sceneTemplates";

const context = { cameraSourceId: "camera-1", backgroundId: "bg-1" };

describe("scene templates", () => {
  it("gives every template its own id", () => {
    const ids = SCENE_TEMPLATES.map((template) => template.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps every layer of every template on the screen", () => {
    for (const template of SCENE_TEMPLATES)
      for (const layer of template.build(context)) {
        const label = `${template.id}: ${layer.name}`;
        const { x, y } = layer.position;
        const { width, height } = layer.dimensions;
        expect(x, label).toBeGreaterThanOrEqual(0);
        expect(y, label).toBeGreaterThanOrEqual(0);
        expect(x + width, label).toBeLessThanOrEqual(CANVAS_WIDTH);
        expect(y + height, label).toBeLessThanOrEqual(CANVAS_HEIGHT);
      }
  });

  it("puts the chosen camera into every camera layer", () => {
    for (const template of SCENE_TEMPLATES)
      for (const layer of template.build(context))
        if (layer.type === "camera") expect(layer.sourceId).toBe("camera-1");
  });

  it("builds fresh layers each time so scenes never share a layer", () => {
    const template = findTemplate("camera-bible");
    const first = template?.build(context) ?? [];
    const second = template?.build(context) ?? [];

    expect(first.map((layer) => layer.id)).not.toEqual(
      second.map((layer) => layer.id),
    );
  });

  it("covers the scenes a service needs", () => {
    const needed = [
      "full-camera",
      "camera-bible",
      "camera-manuscript",
      "picture-in-picture",
      "split-screen",
      "full-announcement",
      "full-image",
      "full-video",
      "worship-manuscript",
      "blank",
      "scripture-subtitle",
      "new-converts",
      "full-service",
    ];
    for (const id of needed) expect(findTemplate(id), id).toBeDefined();
  });

  it("offers broadcast looks modelled on real service productions", () => {
    const broadcast = SCENE_TEMPLATES.filter(
      (template) => template.group === "broadcast",
    ).map((template) => template.id);

    expect(broadcast).toEqual(
      expect.arrayContaining([
        "broadcast-scripture",
        "broadcast-camera",
        "broadcast-lyrics",
        "broadcast-caption",
        "broadcast-response",
        "broadcast-notice",
        "broadcast-welcome",
        "broadcast-ministry",
        "broadcast-event",
      ]),
    );
  });

  it("only points template photos at images the app ships with", () => {
    const shipped = new Set(BUILT_IN_MEDIA.map((item) => item.id));
    for (const template of SCENE_TEMPLATES)
      for (const layer of template.build(context))
        if (layer.type === "image" && layer.mediaId)
          expect(shipped.has(layer.mediaId), template.id).toBe(true);
  });

  it("frames the preacher and the passage in matching gold borders", () => {
    const layers = findTemplate("broadcast-scripture")?.build(context) ?? [];
    const camera = layers.find((layer) => layer.type === "camera");
    const passage = layers.find((layer) => layer.type === "bible");

    expect(camera?.border.width).toBeGreaterThan(0);
    expect(camera?.border).toEqual(passage?.border);
    expect(camera?.position.y).toBe(passage?.position.y);
    expect(camera?.dimensions.height).toBe(passage?.dimensions.height);
  });

  it("puts the preacher and the passage side by side as two 16:9 boxes", () => {
    const layers = findTemplate("camera-bible")?.build(context) ?? [];
    const camera = layers.find((layer) => layer.type === "camera");
    const passage = layers.find((layer) => layer.type === "bible");

    expect(camera?.dimensions).toEqual(passage?.dimensions);
    expect(
      camera && camera.dimensions.width / camera.dimensions.height,
    ).toBeCloseTo(16 / 9, 1);
    expect(
      camera && passage && camera.position.x + camera.dimensions.width,
    ).toBeLessThanOrEqual(passage?.position.x ?? 0);
    expect(
      (passage?.position.x ?? 0) + (passage?.dimensions.width ?? 0),
    ).toBeLessThanOrEqual(CANVAS_WIDTH);
  });
});
