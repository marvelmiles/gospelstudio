import type {
  AudioItem,
  Background,
  ImportMode,
  Manuscript,
  MediaItem,
  Prefs,
  ScripturePassage,
  Theme,
} from "../../types";
import { BACKGROUNDS, BUILT_IN_MEDIA } from "../../data/backgrounds";
import { THEMES } from "../../data/themes";
import { DEFAULT_AUDIO } from "../../data/sounds";
import { seedManuscripts } from "../../data/seed";
import { HYMNAL_VERSION } from "../../data/hymns";
import { planDefaultManuscripts } from "../../lib/manuscript/defaults";
import { dataFileSchema } from "../../lib/schema";
import { mergeImportedPrefs } from "../importedPrefs";
import {
  readAllRecords,
  clearStore,
  deleteRecord,
  saveRecord,
  saveRecords,
} from "../../lib/storage";
import type { StoreName, WriteOptions } from "../../lib/storage";
import { thumbId } from "../../lib/fileStore";
import { invalidateBlobUrls, resetBlobUrls } from "../../lib/blobUrls";
import { survivingAfterReset } from "../../lib/keepOnReset";
import {
  exportBackup,
  importBackupFiles,
  isZipFile,
  readBackupPayload,
} from "../../lib/backup";
import {
  BLOCK_MSG,
  WARN_MSG,
  customAudio,
  customBackgrounds,
  customMedia,
  ensureBuiltInThemes,
  mergeById,
} from "../helpers";
import {
  audioState,
  backgroundsState,
  mediaState,
  prefsFrom,
  readLibraryState,
  themesState,
  type LibraryRecordStore,
} from "../libraryState";
import {
  normalizeImportedBackground,
  normalizeImportedManuscript,
  normalizeImportedMedia,
  normalizeImportedScripture,
} from "../importNormalizers";
import { buildBackup } from "../../lib/backupPayload";
import { clearStudioStorage } from "../../features/studio/lib/productionStorage";
import { normalizeImportedProduction } from "../../features/studio/lib/productionNormalizer";
import {
  allProductions,
  importProductions,
  loadProductions,
  resetStudio,
} from "../../features/studio/store/productionActions";
import { flushSave } from "../../features/studio/store/productionStore";
import { backupSourceOf } from "../backupSource";
import { wholeLibrarySelection } from "../../lib/shareSelection";
import { DEFAULT_PREFS } from "./prefsSlice";
import type { SliceCreator } from "../storeTypes";
import { APP_NAME } from "../../lib/appInfo";
import { restartDeviceSync } from "../../features/sync/syncSettings";

const MIN_RESET_OVERLAY_MS = 900;
const SYSTEM_WRITE: WriteOptions = { tracked: false };

export interface DataSlice {
  loading: boolean;
  resetting: boolean;

  load: () => Promise<void>;
  reloadLibrary: (stores: readonly LibraryRecordStore[]) => Promise<void>;
  exportData: (
    onProgress?: (fraction: number) => void,
  ) => Promise<{ ok: boolean; cancelled?: boolean }>;
  importData: (
    file: File,
    mode: ImportMode,
    onProgress?: (fraction: number) => void,
  ) => Promise<{ ok: boolean; message: string }>;
  resetApp: () => Promise<void>;
}

const mergeIncoming = <T extends { id: string }>(
  current: T[],
  incoming: T[] | undefined,
  isOverride: boolean,
  importedWins: boolean,
): T[] => {
  if (isOverride) return incoming ?? [];
  if (!incoming) return current;
  return mergeById(current, incoming, importedWins);
};

export const createDataSlice: SliceCreator<DataSlice> = (set, get) => ({
  loading: true,
  resetting: false,

  load: async () => {
    const [
      storedManuscripts,
      scriptures,
      media,
      backgrounds,
      audio,
      storedThemes,
      prefsRows,
    ] = await Promise.all([
      readAllRecords<Manuscript>("manuscripts"),
      readAllRecords<ScripturePassage>("scriptures"),
      readAllRecords<MediaItem>("media"),
      readAllRecords<Background>("backgrounds"),
      readAllRecords<AudioItem>("audio"),
      readAllRecords<Theme>("themes"),
      readAllRecords<Prefs>("prefs"),
    ]);

    let prefs = prefsFrom(prefsRows[0]);

    let manuscripts = storedManuscripts;
    if (prefs.hymnalVersion !== HYMNAL_VERSION) {
      const plan = planDefaultManuscripts(
        storedManuscripts,
        await seedManuscripts(),
      );
      manuscripts = plan.manuscripts;
      await saveRecords("manuscripts", plan.toInstall, SYSTEM_WRITE);
      for (const id of plan.staleIds)
        await deleteRecord("manuscripts", id, SYSTEM_WRITE);
      prefs = { ...prefs, hymnalVersion: HYMNAL_VERSION };
      await saveRecord("prefs", prefs, SYSTEM_WRITE);
    }

    let themes = storedThemes;
    if (!themes.length) {
      themes = THEMES;
      for (const theme of themes)
        await saveRecord("themes", theme, SYSTEM_WRITE);
    }

    set({
      manuscripts,
      scriptures,
      ...mediaState(media),
      ...themesState(themes),
      ...backgroundsState(backgrounds),
      ...audioState(audio),
      prefs,
      showGuide: !prefs.onboarded,
      loading: false,
    });

    get().runCapabilityCheck();
    const storageInfo = await get().refreshStorage();
    if (storageInfo?.blocked) {
      get().pushAlert(BLOCK_MSG, "error", "storage-block");
    } else if (storageInfo && storageInfo.level !== "ok") {
      get().pushAlert(WARN_MSG, "warning", "storage-warn");
    }
  },

  reloadLibrary: async (stores) => {
    if (stores.length === 0) return;
    set(await readLibraryState(stores));
    await get().refreshStorage();
  },

  exportData: async (onProgress) => {
    onProgress?.(0.02);
    await loadProductions();
    await flushSave();
    const source = backupSourceOf(get(), allProductions());
    const { payload, fileIds } = buildBackup(
      source,
      wholeLibrarySelection(source),
    );
    return exportBackup(payload, fileIds, onProgress);
  },

  importData: async (file, mode, onProgress) => {
    const invalidBackup = {
      ok: false,
      message: `That file isn't a valid ${APP_NAME} backup.`,
    };
    try {
      if (!(await isZipFile(file))) return invalidBackup;
      const parsed = dataFileSchema.safeParse(await readBackupPayload(file));
      if (!parsed.success) return invalidBackup;

      const data = parsed.data;
      const state = get();
      const isOverride = mode === "override";
      const importedWins = mode !== "merge-existing";

      if (!isOverride && state.storage?.blocked) {
        get().pushAlert(BLOCK_MSG, "error", "storage-block");
        return {
          ok: false,
          message:
            "Storage is full. Delete some data, or use Replace to import.",
        };
      }

      const incomingMedia = data.media
        ? customMedia(data.media.map(normalizeImportedMedia))
        : undefined;
      const incomingBackgrounds = data.backgrounds
        ? customBackgrounds(data.backgrounds.map(normalizeImportedBackground))
        : undefined;
      const incomingAudio: AudioItem[] | undefined = data.audio
        ? customAudio(data.audio)
        : undefined;

      const manuscripts = mergeIncoming(
        state.manuscripts,
        data.manuscripts?.map(normalizeImportedManuscript),
        isOverride,
        importedWins,
      );
      const scriptures = mergeIncoming(
        state.scriptures.filter((scripture) => !scripture.quick),
        data.scriptures?.map(normalizeImportedScripture),
        isOverride,
        importedWins,
      );
      const media = mergeIncoming(
        state.media,
        incomingMedia,
        isOverride,
        importedWins,
      );
      const themes = ensureBuiltInThemes(
        mergeIncoming(state.themes, data.themes, isOverride, importedWins),
      );
      const customBg = mergeIncoming(
        customBackgrounds(state.backgrounds),
        incomingBackgrounds,
        isOverride,
        importedWins,
      );
      const customAud = mergeIncoming(
        customAudio(state.audio),
        incomingAudio,
        isOverride,
        importedWins,
      );
      const incomingProductions =
        data.productions?.map(normalizeImportedProduction) ?? [];

      const prefs =
        data.prefs && importedWins
          ? mergeImportedPrefs(
              { ...DEFAULT_PREFS, id: "app", onboarded: true },
              data.prefs,
            )
          : state.prefs;

      const acceptedFileIds = new Set<string>();
      for (const item of incomingMedia ?? []) {
        if (!media.includes(item)) continue;
        acceptedFileIds.add(item.id);
        acceptedFileIds.add(thumbId(item.id));
      }
      for (const background of incomingBackgrounds ?? []) {
        if (!customBg.includes(background) || !background.blobId) continue;
        acceptedFileIds.add(background.blobId);
        acceptedFileIds.add(thumbId(background.blobId));
      }
      for (const item of incomingAudio ?? []) {
        if (customAud.includes(item) && item.blobId) {
          acceptedFileIds.add(item.blobId);
        }
      }

      const keptQuickScriptures = isOverride
        ? []
        : state.scriptures.filter((scripture) => scripture.quick);

      if (isOverride) {
        await Promise.all(
          (
            [
              "manuscripts",
              "scriptures",
              "media",
              "themes",
              "backgrounds",
              "audio",
              "files",
            ] as StoreName[]
          ).map((store) => clearStore(store)),
        );
      }

      await importProductions({
        incoming: incomingProductions,
        replaceAll: isOverride,
        importedWins,
      });

      await importBackupFiles(
        file,
        (id) => acceptedFileIds.has(id),
        (read, total) => onProgress?.(0.1 + 0.7 * (total ? read / total : 1)),
      );

      if (isOverride) resetBlobUrls();
      else invalidateBlobUrls(acceptedFileIds);

      set({
        manuscripts,
        scriptures: [...keptQuickScriptures, ...scriptures],
        media,
        builtInMedia: isOverride ? BUILT_IN_MEDIA : state.builtInMedia,
        themes,
        backgrounds: [
          ...(isOverride
            ? BACKGROUNDS
            : state.backgrounds.filter((background) => background.builtIn)),
          ...customBg,
        ],
        audio: [...DEFAULT_AUDIO, ...customAud],
        prefs,
      });

      const writes: { store: StoreName; value: { id: string } }[] = [
        ...manuscripts.map((value) => ({
          store: "manuscripts" as const,
          value,
        })),
        ...scriptures.map((value) => ({ store: "scriptures" as const, value })),
        ...media.map((value) => ({ store: "media" as const, value })),
        ...themes.map((value) => ({ store: "themes" as const, value })),
        ...customBg.map((value) => ({ store: "backgrounds" as const, value })),
        ...customAud.map((value) => ({ store: "audio" as const, value })),
        { store: "prefs", value: prefs },
      ];

      let writtenCount = 0;
      for (const write of writes) {
        await saveRecord(write.store, write.value);
        writtenCount += 1;
        onProgress?.(0.8 + 0.2 * (writtenCount / writes.length));
      }

      await get().refreshStorage();
      get().clearAlert("storage-block");
      return {
        ok: true,
        message: `Data ${isOverride ? "replaced" : "merged"} successfully.`,
      };
    } catch {
      return { ok: false, message: "Could not read that backup file." };
    }
  },

  resetApp: async () => {
    set({
      resetting: true,
      overlay: null,
      pendingUpload: null,
      presentation: null,
    });
    const startedAt = Date.now();
    let keptTotal = 0;
    try {
      const survivors = survivingAfterReset({
        manuscripts: get().manuscripts,
        themes: get().themes,
        seedManuscripts: await seedManuscripts(),
        builtInThemes: THEMES,
        builtInBackgrounds: BACKGROUNDS,
        builtInAudio: DEFAULT_AUDIO,
        defaultThemeId: DEFAULT_PREFS.defaultManuscriptThemeId,
      });
      keptTotal =
        survivors.keptManuscripts.length + survivors.keptThemes.length;

      await Promise.all(
        (
          [
            "manuscripts",
            "scriptures",
            "media",
            "themes",
            "backgrounds",
            "audio",
            "prefs",
            "files",
          ] as StoreName[]
        ).map((store) => clearStore(store, SYSTEM_WRITE)),
      );
      await clearStudioStorage(SYSTEM_WRITE);
      resetStudio();
      await saveRecords("manuscripts", survivors.manuscripts, SYSTEM_WRITE);
      for (const theme of survivors.themes)
        await saveRecord("themes", theme, SYSTEM_WRITE);
      const freshPrefs: Prefs = {
        ...DEFAULT_PREFS,
        hymnalVersion: HYMNAL_VERSION,
      };
      await saveRecord("prefs", freshPrefs, SYSTEM_WRITE);
      await restartDeviceSync();
      set({
        manuscripts: survivors.manuscripts,
        scriptures: [],
        media: [],
        builtInMedia: BUILT_IN_MEDIA,
        themes: survivors.themes,
        backgrounds: BACKGROUNDS,
        audio: DEFAULT_AUDIO,
        prefs: freshPrefs,
      });
    } finally {
      const elapsedMs = Date.now() - startedAt;
      if (elapsedMs < MIN_RESET_OVERLAY_MS) {
        await new Promise((resolve) =>
          setTimeout(resolve, MIN_RESET_OVERLAY_MS - elapsedMs),
        );
      }
      get().clearAlert("storage-block");
      get().clearAlert("storage-warn");
      await get().refreshStorage();
      set({ resetting: false });
      get().pushToast(
        keptTotal
          ? `Reset complete. ${keptTotal} kept item${keptTotal === 1 ? "" : "s"} survived.`
          : `Reset complete. ${APP_NAME} is back to defaults.`,
      );
    }
  },
});
