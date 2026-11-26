import type { z } from "zod";
import type { SyncRecordStore } from "@/contracts/syncContract";
import type { Prefs } from "../../types";
import { now } from "../../lib/id";
import { SYNCED_RECORD_SCHEMAS } from "../../lib/schema";
import { mergeImportedPrefs } from "../../store/importedPrefs";
import {
  normalizeImportedBackground,
  normalizeImportedManuscript,
  normalizeImportedMedia,
  normalizeImportedScripture,
} from "../../store/importNormalizers";
import { DEFAULT_SCENE_BACKGROUND } from "../studio/lib/productionFactory";
import {
  normalizeImportedProduction,
  normalizeLayers,
} from "../studio/lib/productionNormalizer";
import type { SceneLayout } from "../studio/types/scene";

export interface StoredRecord {
  id: string;
}

const parseWith = <S extends z.ZodTypeAny, R extends StoredRecord>(
  schema: S,
  data: unknown,
  normalize: (value: z.output<S>) => R,
): R | null => {
  const parsed = schema.safeParse(data);
  return parsed.success ? normalize(parsed.data) : null;
};

const normalizeRemoteLayout = (
  layout: z.output<typeof SYNCED_RECORD_SCHEMAS.sceneLayouts>,
): SceneLayout => {
  const timestamp = now();
  return {
    ...layout,
    background: layout.background ?? DEFAULT_SCENE_BACKGROUND,
    layers: normalizeLayers(layout.layers),
    createdAt: layout.createdAt ?? timestamp,
    updatedAt: layout.updatedAt ?? timestamp,
  };
};

const keepAsIs = <R extends StoredRecord>(record: R): R => record;

export const parseRemoteRecord = (
  store: Exclude<SyncRecordStore, "prefs">,
  data: unknown,
): StoredRecord | null => {
  switch (store) {
    case "manuscripts":
      return parseWith(
        SYNCED_RECORD_SCHEMAS.manuscripts,
        data,
        normalizeImportedManuscript,
      );
    case "scriptures":
      return parseWith(
        SYNCED_RECORD_SCHEMAS.scriptures,
        data,
        normalizeImportedScripture,
      );
    case "media":
      return parseWith(
        SYNCED_RECORD_SCHEMAS.media,
        data,
        normalizeImportedMedia,
      );
    case "backgrounds":
      return parseWith(
        SYNCED_RECORD_SCHEMAS.backgrounds,
        data,
        normalizeImportedBackground,
      );
    case "themes":
      return parseWith(SYNCED_RECORD_SCHEMAS.themes, data, keepAsIs);
    case "audio":
      return parseWith(SYNCED_RECORD_SCHEMAS.audio, data, keepAsIs);
    case "productions":
      return parseWith(
        SYNCED_RECORD_SCHEMAS.productions,
        data,
        normalizeImportedProduction,
      );
    case "sceneLayouts":
      return parseWith(
        SYNCED_RECORD_SCHEMAS.sceneLayouts,
        data,
        normalizeRemoteLayout,
      );
  }
};

export const mergeRemotePrefs = (local: Prefs, data: unknown): Prefs | null => {
  const parsed = SYNCED_RECORD_SCHEMAS.prefs.safeParse(data);
  return parsed.success ? mergeImportedPrefs(local, parsed.data) : null;
};
