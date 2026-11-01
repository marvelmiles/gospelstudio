import {
  clearStore,
  deleteRecord,
  readAllRecords,
  saveRecordStrict,
} from "../../../lib/storage";
import type { Production } from "../types/production";
import type { SceneLayout } from "../types/scene";

export const readProductions = (): Promise<Production[]> =>
  readAllRecords<Production>("productions");

export const writeProduction = (production: Production): Promise<void> =>
  saveRecordStrict("productions", production);

export const removeProduction = (id: string): Promise<void> =>
  deleteRecord("productions", id);

export const readLayouts = (): Promise<SceneLayout[]> =>
  readAllRecords<SceneLayout>("sceneLayouts");

export const writeLayout = (layout: SceneLayout): Promise<void> =>
  saveRecordStrict("sceneLayouts", layout);

export const removeLayout = (id: string): Promise<void> =>
  deleteRecord("sceneLayouts", id);

export const clearProductions = (): Promise<void> => clearStore("productions");

export const clearStudioStorage = async (): Promise<void> => {
  await Promise.all([clearStore("productions"), clearStore("sceneLayouts")]);
};
