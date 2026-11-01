import type { Layer } from "./layer";

export type SceneTransitionKind = "cut" | "fade" | "crossfade" | "slide";

export interface SceneTransition {
  kind: SceneTransitionKind;
  durationMs: number;
}

export interface Scene {
  id: string;
  name: string;
  layers: Layer[];
  transition: SceneTransition;
  background: string;
  createdAt: string;
  updatedAt: string;
}

export interface SceneLayout {
  id: string;
  name: string;
  layers: Layer[];
  background: string;
  createdAt: string;
  updatedAt: string;
}
