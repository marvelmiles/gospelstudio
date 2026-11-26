import {
  clearStore,
  deleteRecord,
  readAllRecords,
  readRecord,
  saveRecordStrict,
  type WriteOptions,
} from "../../../lib/storage";
import type { Production } from "../types/production";
import type { SceneLayout } from "../types/scene";

export const readProductions = (): Promise<Production[]> =>
  readAllRecords<Production>("productions");

export const readProduction = (id: string): Promise<Production | undefined> =>
  readRecord<Production>("productions", id);

export const writeProduction = (
  production: Production,
  options?: WriteOptions,
): Promise<void> => saveRecordStrict("productions", production, options);

export const removeProduction = (id: string): Promise<void> =>
  deleteRecord("productions", id);

export const readLayouts = (): Promise<SceneLayout[]> =>
  readAllRecords<SceneLayout>("sceneLayouts");

export const readLayout = (id: string): Promise<SceneLayout | undefined> =>
  readRecord<SceneLayout>("sceneLayouts", id);

export const writeLayout = (layout: SceneLayout): Promise<void> =>
  saveRecordStrict("sceneLayouts", layout);

export const removeLayout = (id: string): Promise<void> =>
  deleteRecord("sceneLayouts", id);

export const clearProductions = (): Promise<void> => clearStore("productions");

export const clearStudioStorage = async (
  options?: WriteOptions,
): Promise<void> => {
  await Promise.all([
    clearStore("productions", options),
    clearStore("sceneLayouts", options),
  ]);
};
