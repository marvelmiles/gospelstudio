import { describe, expect, it } from "vitest";
import { BUILT_IN_MEDIA } from "../../../data/backgrounds";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  MIN_LAYER_SIZE,
} from "./canvasCoordinates";
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

  it("never makes a layer smaller than the editor allows", () => {
    for (const template of SCENE_TEMPLATES)
      for (const layer of template.build(context)) {
        const label = `${template.id}: ${layer.name}`;
        expect(layer.dimensions.width, label).toBeGreaterThanOrEqual(
          MIN_LAYER_SIZE,
        );
        expect(layer.dimensions.height, label).toBeGreaterThanOrEqual(
          MIN_LAYER_SIZE,
        );
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
        "broadcast-sermon",
        "broadcast-overview",
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

  describe("preacher and passage", () => {
    const layers = findTemplate("broadcast-sermon")?.build(context) ?? [];
    const camera = layers.find((layer) => layer.type === "camera");
    const passage = layers.find((layer) => layer.type === "bible");
    const name = layers.find((layer) => layer.name === "Preacher name");

    it("puts the camera behind everything and fills the screen with it", () => {
      expect(layers[0]).toBe(camera);
      expect(camera?.position).toEqual({ x: 0, y: 0 });
      expect(camera?.dimensions).toEqual({
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
      });
    });

    it("comes with a passage set along the bottom in its own look", () => {
      expect(passage?.type).toBe("bible");
      if (passage?.type !== "bible") return;
      expect(passage.fill.kind).toBe("none");
      expect(passage.passage?.slides.length).toBeGreaterThan(0);
      expect(passage.passage?.style?.verticalAlign).toBe("bottom");
      expect(passage.position.y + passage.dimensions.height).toBe(
        CANVAS_HEIGHT,
      );
      expect(passage.dimensions.width / passage.dimensions.height).toBeCloseTo(
        16 / 9,
        2,
      );
    });

    it("keeps the reference line smaller than the verse", () => {
      if (passage?.type !== "bible" || !passage.passage) return;
      const [slide] = passage.passage.slides;
      const referenceSize = slide.lineOverrides?.[slide.lines.length - 1];
      expect(referenceSize?.fontSize).toBeLessThan(
        passage.passage.style?.fontSize ?? 0,
      );
    });

    it("keeps the preacher's name clear of the passage", () => {
      expect(name).toBeDefined();
      expect(
        (name?.position.x ?? 0) + (name?.dimensions.width ?? 0),
      ).toBeLessThanOrEqual(passage?.position.x ?? 0);
    });
  });

  describe("service at a glance", () => {
    const layers = findTemplate("broadcast-overview")?.build(context) ?? [];
    const cameras = layers.filter((layer) => layer.type === "camera");
    const passage = layers.find((layer) => layer.type === "bible");
    const words = layers.flatMap((layer) =>
      layer.type === "text" ? [layer.content] : [],
    );

    it("fills the screen with the main camera and frames a second one", () => {
      expect(layers[0]).toBe(cameras[0]);
      expect(cameras[0]?.dimensions).toEqual({
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
      });
      expect(cameras).toHaveLength(2);
      expect(cameras[1]?.border.width).toBeGreaterThan(0);
    });

    it("shows the whole passage on one slide with its own reference", () => {
      expect(passage?.type).toBe("bible");
      if (passage?.type !== "bible" || !passage.passage) return;
      const { slides } = passage.passage;
      const { lines } = slides[0];
      expect(slides).toHaveLength(1);
      expect(lines[lines.length - 1]).toContain("John 3:16");
    });

    it("draws its icons from the icon catalog", () => {
      const icons = layers.flatMap((layer) =>
        layer.type === "icon" ? [layer.icon] : [],
      );
      expect(icons).toEqual(
        expect.arrayContaining(["book", "camera", "megaphone", "bell"]),
      );
    });

    it("runs the motto tag into the bottom right corner", () => {
      const motto = layers.find((layer) => layer.name === "Motto tag");
      expect(motto?.type === "shape" && motto.shape).toBe("slantLeft");
      expect((motto?.position.x ?? 0) + (motto?.dimensions.width ?? 0)).toBe(
        CANVAS_WIDTH,
      );
      expect((motto?.position.y ?? 0) + (motto?.dimensions.height ?? 0)).toBe(
        CANVAS_HEIGHT,
      );
    });

    it("starts with placeholder words rather than another church's", () => {
      expect(words.length).toBeGreaterThan(0);
      for (const content of words) expect(content).not.toMatch(/gracelife/i);
    });
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
