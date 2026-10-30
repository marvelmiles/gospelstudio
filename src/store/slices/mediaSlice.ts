import type { Background, MediaItem, MediaKind } from "../../types";
import { BUILT_IN_MEDIA } from "../../data/backgrounds";
import { now, uid } from "../../lib/id";
import {
  deleteFileBlob,
  deleteFileWithThumb,
  isQuotaError,
  putFileBlob,
  thumbId,
} from "../../lib/fileStore";
import { invalidateBlobUrl } from "../../lib/blobUrls";
import { deleteRecord, saveRecord, saveRecordStrict } from "../../lib/storage";
import {
  DEFAULT_IMAGE_SETTINGS,
  DEFAULT_VIDEO_SETTINGS,
  isAcceptedMediaFile,
  probeImageFile,
  probeVideoFile,
  type MediaProbe,
} from "../../lib/media";
import {
  afterDelete,
  afterWrite,
  blockWrite,
  builtInMediaEdit,
  replaceById,
} from "../helpers";
import type { SliceCreator } from "../storeTypes";

interface MediaUpdateOptions {
  touch?: boolean;
}

export interface MediaSlice {
  media: MediaItem[];
  builtInMedia: MediaItem[];

  uploadMedia: (kind: MediaKind, file: File, name?: string) => Promise<string>;
  updateMedia: (
    id: string,
    changes: Partial<MediaItem>,
    options?: MediaUpdateOptions,
  ) => boolean;
  removeMedia: (id: string) => Promise<void>;
  toggleImageBackground: (id: string) => boolean;
}

const QUOTA_TOAST =
  "Not enough storage space for that file. Free up space and try again.";

const isLinkedBackground = (background: Background, mediaId: string) => {
  if (background.type === "video") return background.mediaId === mediaId;
  if (background.type !== "image") return false;
  return background.builtIn
    ? background.mediaId === mediaId
    : background.blobId === mediaId;
};

const backgroundsFollowing = (
  backgrounds: Background[],
  previous: MediaItem,
  next: MediaItem,
): Background[] => {
  const renamed = next.name !== previous.name;
  const restyled =
    Boolean(next.builtIn) &&
    next.kind === "image" &&
    next.image !== previous.image;
  if (!renamed && !restyled) return [];
  return backgrounds
    .filter((background) => isLinkedBackground(background, next.id))
    .map((background) => ({
      ...background,
      ...(renamed && { name: next.name }),
      ...(restyled && background.builtIn && { image: next.image }),
      updatedAt: next.updatedAt,
    }));
};

export const createMediaSlice: SliceCreator<MediaSlice> = (set, get) => ({
  media: [],
  builtInMedia: BUILT_IN_MEDIA,

  uploadMedia: async (kind, file, name) => {
    if (!isAcceptedMediaFile(kind, file)) {
      get().pushToast(
        `"${file.name}" isn't a supported ${kind} file.`,
        "error",
      );
      return "";
    }
    const id = uid();
    try {
      let probe: MediaProbe = {};
      let thumbnail: Blob | null = null;
      if (kind === "video") {
        probe = await probeVideoFile(file);
      } else {
        const imageProbe = await probeImageFile(file);
        probe = imageProbe;
        thumbnail = imageProbe.thumbnail;
      }

      await putFileBlob(id, file);
      if (thumbnail) await putFileBlob(thumbId(id), thumbnail);

      const item: MediaItem = {
        id,
        kind,
        name: name?.trim() || file.name.replace(/\.[^.]+$/, ""),
        mimeType: file.type || undefined,
        size: file.size,
        duration: probe.duration,
        width: probe.width,
        height: probe.height,
        hasThumb: Boolean(thumbnail) || undefined,
        image: kind === "image" ? { ...DEFAULT_IMAGE_SETTINGS } : undefined,
        video: kind === "video" ? { ...DEFAULT_VIDEO_SETTINGS } : undefined,
        createdAt: now(),
        updatedAt: now(),
      };
      await saveRecordStrict("media", item);
      set((state) => ({ media: [item, ...state.media] }));
      return id;
    } catch (err) {
      await deleteFileWithThumb(id).catch(() => {});
      get().pushToast(
        isQuotaError(err)
          ? QUOTA_TOAST
          : `Couldn't save "${file.name}". ${String((err as Error)?.message || "")}`,
        "error",
      );
      afterWrite(get);
      return "";
    }
  },

  updateMedia: (id, changes, { touch = true }: MediaUpdateOptions = {}) => {
    if (blockWrite(get)) return false;
    const state = get();
    const builtIn = state.builtInMedia.find((m) => m.id === id);
    const current = builtIn ?? state.media.find((m) => m.id === id);
    if (!current) return false;
    const next: MediaItem = {
      ...current,
      ...(builtIn ? builtInMediaEdit(changes) : changes),
      id,
      updatedAt: touch ? now() : current.updatedAt,
    };
    const syncedBackgrounds = backgroundsFollowing(
      state.backgrounds,
      current,
      next,
    );
    set((s) => ({
      media: builtIn ? s.media : s.media.map((m) => (m.id === id ? next : m)),
      builtInMedia: builtIn
        ? s.builtInMedia.map((m) => (m.id === id ? next : m))
        : s.builtInMedia,
      backgrounds: syncedBackgrounds.length
        ? replaceById(s.backgrounds, syncedBackgrounds)
        : s.backgrounds,
    }));
    void saveRecord("media", next);
    for (const background of syncedBackgrounds)
      void saveRecord("backgrounds", background);
    afterWrite(get);
    return true;
  },

  removeMedia: async (id) => {
    if (get().builtInMedia.some((m) => m.id === id)) return;
    const videoBackgroundIds = get()
      .backgrounds.filter((b) => b.type === "video" && b.mediaId === id)
      .map((b) => b.id);
    const backgroundsUseFile = get().backgrounds.some(
      (b) => b.blobId === id && !videoBackgroundIds.includes(b.id),
    );
    const videoAudioIds = get()
      .audio.filter((a) => a.mediaId === id)
      .map((a) => a.id);
    set((state) => ({
      media: state.media.filter((m) => m.id !== id),
      backgrounds: state.backgrounds.filter(
        (b) => !videoBackgroundIds.includes(b.id),
      ),
      audio: state.audio.filter((a) => !videoAudioIds.includes(a.id)),
    }));
    await deleteRecord("media", id);
    await Promise.all([
      ...videoBackgroundIds.map((backgroundId) =>
        deleteRecord("backgrounds", backgroundId),
      ),
      ...videoAudioIds.map((audioId) => deleteRecord("audio", audioId)),
    ]);
    if (backgroundsUseFile) {
      await deleteFileBlob(thumbId(id));
    } else {
      invalidateBlobUrl(id);
      await deleteFileWithThumb(id);
    }
    afterDelete(get);
  },

  toggleImageBackground: (id) => {
    if (blockWrite(get)) return false;
    const item = get().media.find((m) => m.id === id && m.kind === "image");
    if (!item) return false;
    const existing = get().backgrounds.filter((b) => b.blobId === item.id);
    if (existing.length > 0) {
      for (const background of existing)
        void get().removeBackground(background.id);
      return false;
    }
    return Boolean(get().attachImageBackground(id));
  },
});
