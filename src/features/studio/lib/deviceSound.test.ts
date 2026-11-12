import { describe, expect, it } from "vitest";
import type { Layer } from "../types/layer";
import type { MediaSource } from "../types/mediaSource";
import type { ProgramSnapshot } from "../types/production";
import { createLayer } from "./layerDefaults";
import {
  audibleSourceIds,
  mutedSourceIds,
  soundSharingDevices,
} from "./deviceSound";

const phone = (id: string, muted = false): MediaSource => ({
  id,
  name: `Phone ${id}`,
  type: "remote",
  deviceLabel: `Phone ${id}`,
  muted,
});

const webcam: MediaSource = {
  id: "webcam",
  name: "Webcam",
  type: "camera",
  deviceId: "device-1",
  audioDeviceId: "mic-1",
  deviceLabel: "Webcam",
};

const programOf = (layers: Layer[]): ProgramSnapshot => ({
  sceneId: "scene",
  sceneName: "Scene",
  layers,
  background: "#000000",
  transition: { kind: "cut", durationMs: 0 },
  takenAt: "2026-11-12T00:00:00.000Z",
});

describe("device sound", () => {
  it("knows which phones are muted", () => {
    expect([...mutedSourceIds([phone("a", true), phone("b"), webcam])]).toEqual(
      ["a"],
    );
  });

  it("plays each live camera once and leaves muted phones silent", () => {
    const program = programOf([
      createLayer("camera", { sourceId: "a" }),
      createLayer("camera", { sourceId: "a" }),
      createLayer("camera", { sourceId: "b" }),
      createLayer("camera", { sourceId: "webcam" }),
    ]);

    expect(audibleSourceIds(program, new Set(["b"]))).toEqual(["a", "webcam"]);
  });

  it("skips hidden, muted and empty camera items", () => {
    const program = programOf([
      createLayer("camera", { sourceId: "a", visible: false }),
      createLayer("camera", { sourceId: "b", muted: true }),
      createLayer("camera", { sourceId: null }),
    ]);

    expect(audibleSourceIds(program, new Set())).toEqual([]);
    expect(audibleSourceIds(null, new Set())).toEqual([]);
  });

  it("lists only phones that are sharing their microphone", () => {
    const devices = soundSharingDevices(
      [phone("a", true), phone("b"), webcam],
      {
        a: { audioShared: true },
        b: { audioShared: false },
        webcam: { audioShared: true },
      },
    );

    expect(devices).toEqual([{ sourceId: "a", name: "Phone a", muted: true }]);
  });
});
