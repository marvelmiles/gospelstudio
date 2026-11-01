import routes from "../../routes";

export interface SceneEditing<T> {
  itemId: string;
  autoUpdate: boolean;
  onAutoUpdateChange: (autoUpdate: boolean) => void;
  commit: (doc: T) => boolean;
}

export const SCENE_BACK_TITLE = "Back to the Studio";

export const sceneBackPath = (): string => routes.studio();

export const SCENE_UNSAVED_MESSAGE =
  "These changes are not in the scene yet. If you leave now they are lost.";
