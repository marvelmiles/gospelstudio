import { useCallback, useMemo } from "react";
import type { ImageSettings, MediaItem, VideoSettings } from "../../types";
import { useStore } from "../../store/useStore";
import { shallowEqual } from "../../lib/equality";
import type { PresentedMedia } from "../../store/slices/presentSlice";
import { useDraftHistory } from "../../hooks/useDraftHistory";
import type { PresentOptions } from "../../hooks/usePresentActions";
import {
  defaultImageSettingsOf,
  defaultVideoSettingsOf,
  imageSettingsOf,
  videoSettingsOf,
} from "../../lib/media";
import { settingsGrouping } from "../../lib/settingsHistory";
import { imageDeckIndex } from "../presentation/useDeck";

interface MediaDraft {
  name: string;
  image: ImageSettings;
  video: VideoSettings;
}

const draftOf = (item: MediaItem): MediaDraft => ({
  name: item.name,
  image: imageSettingsOf(item),
  video: videoSettingsOf(item),
});

export interface MediaEditor {
  draft: MediaDraft;
  preview: MediaItem;
  dirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  setName: (name: string) => void;
  patchImage: (changes: Partial<ImageSettings>) => void;
  patchVideo: (changes: Partial<VideoSettings>) => void;
  resetSettings: () => void;
  canResetSettings: boolean;
  save: () => boolean;
  present: (options: PresentOptions) => void;
  isPresenting: boolean;
  updatePresentation: () => boolean;
  presentedVideo: PresentedMedia | null;
  adoptPresentation: () => boolean;
}

export const useMediaEditor = (item: MediaItem): MediaEditor => {
  const media = useStore((s) => s.media);
  const updateMedia = useStore((s) => s.updateMedia);
  const startPresent = useStore((s) => s.startPresent);
  const updateMediaPresentation = useStore((s) => s.updateMediaPresentation);
  const presentation = useStore((s) => s.presentation);
  const presentedDeck = useStore((s) => s.presentedDeck);
  const presentedMedia = useStore((s) => s.presentedMedia);
  const secondaryPresentation = useStore((s) => s.secondaryPresentation);

  const history = useDraftHistory<MediaDraft>(draftOf(item));
  const { draft, apply, patch } = history;

  const preview = useMemo<MediaItem>(
    () => ({
      ...item,
      name: draft.name.trim() || item.name,
      ...(item.kind === "image"
        ? { image: draft.image }
        : { video: draft.video }),
    }),
    [item, draft],
  );

  const setName = useCallback(
    (name: string) => patch({ name }, { coalesceKey: "name" }),
    [patch],
  );

  const patchImage = useCallback(
    (changes: Partial<ImageSettings>) =>
      patch(
        { image: { ...draft.image, ...changes } },
        settingsGrouping(changes, "image"),
      ),
    [patch, draft.image],
  );

  const patchVideo = useCallback(
    (changes: Partial<VideoSettings>) =>
      patch(
        { video: { ...draft.video, ...changes } },
        settingsGrouping(changes, "video"),
      ),
    [patch, draft.video],
  );

  const defaultImage = defaultImageSettingsOf(item);
  const defaultVideo = defaultVideoSettingsOf(item);

  const resetSettings = useCallback(
    () =>
      apply({
        ...draft,
        image: { ...defaultImage },
        video: { ...defaultVideo },
      }),
    [apply, draft, defaultImage, defaultVideo],
  );

  const canResetSettings =
    item.kind === "image"
      ? !shallowEqual(draft.image, defaultImage)
      : !shallowEqual(draft.video, defaultVideo);

  const onMainStage =
    presentation?.kind === item.kind && presentation.id === item.id;
  const onSecondary =
    secondaryPresentation?.kind === item.kind &&
    secondaryPresentation.id === item.id;
  const isPresenting = onMainStage || onSecondary;
  const presentedItem = onMainStage
    ? presentedDeck?.item
    : onSecondary
      ? secondaryPresentation?.item
      : undefined;

  const adoptPresentation = useCallback((): boolean => {
    if (!presentedItem) return false;
    const presentedSettings = videoSettingsOf(presentedItem);
    const live =
      presentedItem.kind === "video" && presentedMedia
        ? {
            ...presentedSettings,
            muted: presentedSettings.muted || presentedMedia.playback.muted,
            volume: presentedMedia.playback.volume,
          }
        : presentedSettings;
    apply({
      name: presentedItem.name,
      image: imageSettingsOf(presentedItem),
      video: live,
    });
    return true;
  }, [apply, presentedItem, presentedMedia]);

  const { markSaved } = history;
  const save = useCallback((): boolean => {
    const trimStart = Math.max(0, draft.video.trimStart);
    const trimEnd =
      draft.video.trimEnd !== null && draft.video.trimEnd > trimStart
        ? draft.video.trimEnd
        : null;
    const written = updateMedia(item.id, {
      name: draft.name.trim(),
      ...(item.kind === "image"
        ? { image: draft.image }
        : { video: { ...draft.video, trimStart, trimEnd } }),
    });
    if (written) markSaved();
    return written;
  }, [draft, item, updateMedia, markSaved]);

  const present = useCallback(
    ({ live }: PresentOptions) => {
      const startIndex =
        item.kind === "image" ? imageDeckIndex(media, item.id) : 0;
      startPresent(item.kind, item.id, startIndex, { live, item: preview });
    },
    [item, media, preview, startPresent],
  );

  return {
    draft,
    preview,
    dirty: history.dirty,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    undo: history.undo,
    redo: history.redo,
    setName,
    patchImage,
    patchVideo,
    resetSettings,
    canResetSettings,
    save,
    present,
    isPresenting,
    updatePresentation: () => updateMediaPresentation(preview),
    presentedVideo:
      onMainStage && item.kind === "video" ? presentedMedia : null,
    adoptPresentation,
  };
};
