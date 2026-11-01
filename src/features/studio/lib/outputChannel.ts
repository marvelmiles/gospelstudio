import type {
  Background,
  Manuscript,
  MediaItem,
  ScripturePassage,
  Theme,
} from "../../../types";
import { createLiveWindow } from "../../../lib/liveWindow";
import routes from "../../../routes";
import type { ProgramSnapshot } from "../types/production";
import { openTypedChannel, postTypedMessage } from "./studioChannel";

const OUTPUT_CHANNEL_NAME = "gospelstudio-studio-output";
const OUTPUT_WINDOW_NAME = "gospelstudio-studio-screen";

export const OUTPUT_HEARTBEAT_MS = 2000;
export const OUTPUT_SILENCE_LIMIT_MS = OUTPUT_HEARTBEAT_MS * 3;

export interface ProgramAssets {
  media: MediaItem[];
  backgrounds: Background[];
  manuscripts: Manuscript[];
  scriptures: ScripturePassage[];
  themes: Theme[];
}

export type OperatorMessage =
  | { type: "program"; program: ProgramSnapshot | null; assets: ProgramAssets }
  | { type: "test"; active: boolean };

type OutputMessage = { type: "hello" } | { type: "alive" } | { type: "bye" };

type StudioMessage = OperatorMessage | OutputMessage;

export const studioOutputWindow = createLiveWindow(
  routes.studioWindow(),
  OUTPUT_WINDOW_NAME,
);

export const openStudioChannel = (
  onMessage: (message: StudioMessage) => void,
): BroadcastChannel | null =>
  openTypedChannel<StudioMessage>(OUTPUT_CHANNEL_NAME, onMessage);

export const postStudioMessage = (
  channel: BroadcastChannel | null,
  message: StudioMessage,
): void => postTypedMessage(channel, message);
