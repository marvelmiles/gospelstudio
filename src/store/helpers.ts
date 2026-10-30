import type { AudioItem, Background, MediaItem, Theme } from "../types";
import { THEMES } from "../data/themes";
import { BACKGROUNDS, BUILT_IN_MEDIA } from "../data/backgrounds";
import type { Getter } from "./storeTypes";

export const BLOCK_MSG =
  "Storage is full. Editing, creating, uploading and auto-save are paused until you free up space. Delete some manuscripts, media, audio or backgrounds.";
export const WARN_MSG =
  "Storage is getting full. Consider deleting unused manuscripts, media, audio or backgrounds so things keep running smoothly.";

export const customBackgrounds = (items: Background[]) =>
  items.filter((b) => !b.builtIn);

export const customMedia = (items: MediaItem[]) =>
  items.filter((item) => !item.builtIn);

export const builtInBackgroundEdit = ({
  name,
  image,
  updatedAt,
}: Partial<Background>): Partial<Background> => ({
  ...(name !== undefined && { name }),
  ...(image !== undefined && { image }),
  ...(updatedAt !== undefined && { updatedAt }),
});

export const builtInMediaEdit = ({
  name,
  image,
  video,
  updatedAt,
}: Partial<MediaItem>): Partial<MediaItem> => ({
  ...(name !== undefined && { name }),
  ...(image !== undefined && { image }),
  ...(video !== undefined && { video }),
  ...(updatedAt !== undefined && { updatedAt }),
});

const withBuiltInEdits = <T extends { id: string; builtIn?: boolean }>(
  shipped: T[],
  stored: T[],
  pickEdit: (edit: T) => Partial<T>,
): T[] => {
  const edits = new Map(
    stored.flatMap((item) => (item.builtIn ? [[item.id, item] as const] : [])),
  );
  return shipped.map((item) => {
    const edit = edits.get(item.id);
    return edit ? { ...item, ...pickEdit(edit) } : item;
  });
};

export const withBuiltInBackgroundEdits = (stored: Background[]) =>
  withBuiltInEdits(BACKGROUNDS, stored, builtInBackgroundEdit);

export const withBuiltInMediaEdits = (stored: MediaItem[]) =>
  withBuiltInEdits(BUILT_IN_MEDIA, stored, builtInMediaEdit);

export const replaceById = <T extends { id: string }>(
  items: T[],
  replacements: T[],
): T[] => {
  const byId = new Map(replacements.map((item) => [item.id, item]));
  return items.map((item) => byId.get(item.id) ?? item);
};

export const customAudio = (items: AudioItem[]) =>
  items.filter((a) => !a.builtIn);

export const blockWrite = (get: Getter): boolean => {
  if (get().storage?.blocked) {
    get().pushAlert(BLOCK_MSG, "error", "storage-block");
    return true;
  }
  return false;
};

export const afterWrite = (get: Getter): void => {
  void get()
    .refreshStorage()
    .then((info) => {
      if (!info) return;
      if (!info.blocked && info.level !== "ok")
        get().pushAlert(WARN_MSG, "warning", "storage-warn");
      else if (info.level === "ok") get().clearAlert("storage-warn");
    });
};

export const afterDelete = (get: Getter): void => {
  void get()
    .refreshStorage()
    .then((info) => {
      if (!info || info.blocked) return;
      get().clearAlert("storage-block");
      if (info.level === "ok") get().clearAlert("storage-warn");
    });
};

export const mergeById = <T extends { id: string }>(
  existing: T[],
  incoming: T[],
  importedWins: boolean,
): T[] => {
  const map = new Map<string, T>();
  for (const item of importedWins ? existing : incoming) map.set(item.id, item);
  for (const item of importedWins ? incoming : existing) map.set(item.id, item);
  return [...map.values()];
};

export const sortBuiltInFirst = (themes: Theme[]): Theme[] => {
  const order = THEMES.map((t) => t.id);
  return [...themes].sort((a, b) => {
    const ai = order.indexOf(a.id);
    const bi = order.indexOf(b.id);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return 0;
  });
};

const refreshedBuiltIn = (theme: Theme): Theme => {
  if (!theme.builtIn || theme.updatedAt) return theme;
  const shipped = THEMES.find((entry) => entry.id === theme.id);
  return shipped
    ? { ...shipped, keepOnReset: theme.keepOnReset, mark: theme.mark }
    : theme;
};

export const ensureBuiltInThemes = (themes: Theme[]): Theme[] => {
  const present = new Set(themes.map((t) => t.id));
  return sortBuiltInFirst([
    ...themes.map(refreshedBuiltIn),
    ...THEMES.filter((t) => !present.has(t.id)),
  ]);
};
