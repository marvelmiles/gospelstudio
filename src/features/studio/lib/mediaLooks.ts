import type { ImageSettings, MediaItem, VideoSettings } from "../../../types";
import { imageSettingsOf, videoSettingsOf } from "../../../lib/media";

export const imageLookOf = (
  item: MediaItem,
  overrides: Partial<ImageSettings>,
): ImageSettings => ({ ...imageSettingsOf(item), ...overrides });

export const videoLookOf = (
  item: MediaItem,
  overrides: Partial<VideoSettings>,
): VideoSettings => ({ ...videoSettingsOf(item), ...overrides });
