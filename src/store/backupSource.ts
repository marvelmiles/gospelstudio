import type { BackupSource } from "../lib/backupPayload";
import type { Production } from "../features/studio/types/production";
import type { StoreState } from "./storeTypes";

export const backupSourceOf = (
  state: StoreState,
  productions: Production[],
): BackupSource => ({
  manuscripts: state.manuscripts,
  scriptures: state.scriptures,
  media: state.media,
  themes: state.themes,
  backgrounds: state.backgrounds,
  audio: state.audio,
  productions,
  prefs: state.prefs,
});
