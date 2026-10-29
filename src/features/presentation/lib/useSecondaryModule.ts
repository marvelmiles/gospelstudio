import { useEffect, useMemo, type RefObject } from "react";
import type { MediaSurfaceHandle } from "../../../hooks/useMediaElementPlayback";
import { useStore } from "../../../store/useStore";
import { useMediaPlayback } from "../../../hooks/useMediaPlayback";
import { videoSettingsOf } from "../../../lib/media";
import type { SecondaryPresentState } from "../../../lib/presentChannel";

export const useSecondaryModule = (
  surfaceRef: RefObject<MediaSurfaceHandle | null>,
) => {
  const secondary = useStore((s) => s.secondaryPresentation);
  const libraryItem = useStore((s) =>
    secondary && secondary.kind !== "stream"
      ? s.media.find(
          (entry) => entry.id === secondary.id && entry.kind === secondary.kind,
        )
      : undefined,
  );

  const item =
    libraryItem && libraryItem.updatedAt !== secondary?.item?.updatedAt
      ? libraryItem
      : secondary?.item;

  const clip = secondary?.kind === "video" ? item : undefined;
  const clipId = clip?.id;
  const settings = useMemo(
    () => (clip ? videoSettingsOf(clip) : undefined),
    [clip],
  );
  const video = useMediaPlayback(surfaceRef, settings);
  const { reset } = video;

  useEffect(() => {
    if (clipId) reset();
  }, [clipId, reset]);

  const state: SecondaryPresentState | undefined = useMemo(
    () =>
      secondary
        ? {
            kind: secondary.kind,
            id: secondary.id,
            item,
            placement: secondary.placement,
            muted: secondary.muted,
            media: secondary.kind === "video" ? video.playback : undefined,
          }
        : undefined,
    [secondary, item, video.playback],
  );

  return {
    state,
    video,
    isClip: secondary?.kind === "video",
    clipRate: settings?.playbackRate ?? 1,
  };
};
