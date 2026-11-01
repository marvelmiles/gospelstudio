import type { Layer } from "./layer";
import type { MediaSource } from "./mediaSource";
import type { Scene, SceneTransition } from "./scene";

export interface ProductionSettings {
  snapToGuides: boolean;
  defaultTransition: SceneTransition;
  autoUpdateScene: boolean;
}

export interface ProgramSnapshot {
  sceneId: string;
  sceneName: string;
  layers: Layer[];
  background: string;
  transition: SceneTransition;
  takenAt: string;
}

export interface Production {
  id: string;
  name: string;
  scenes: Scene[];
  sources: MediaSource[];
  previewSceneId: string;
  program: ProgramSnapshot | null;
  settings: ProductionSettings;
  createdAt: string;
  updatedAt: string;
}

export interface ProductionSummary {
  id: string;
  name: string;
  sceneCount: number;
  updatedAt: string;
}
