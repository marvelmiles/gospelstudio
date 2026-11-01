import routes from "../../../routes";
import type { ProgramSnapshot } from "../types/production";
import type { ProgramAssets } from "./outputChannel";
import { openTypedChannel, postTypedMessage } from "./studioChannel";

const PREVIEW_CHANNEL_NAME = "gospelstudio-studio-preview";
const PREVIEW_TAB_NAME = "gospelstudio-studio-preview";

export interface PreviewFrame {
  program: ProgramSnapshot;
  assets: ProgramAssets;
}

export type PreviewMessage =
  { type: "frame"; frame: PreviewFrame; show: boolean } | { type: "hello" };

export const openPreviewChannel = (
  onMessage: (message: PreviewMessage) => void,
): BroadcastChannel | null =>
  openTypedChannel<PreviewMessage>(PREVIEW_CHANNEL_NAME, onMessage);

export const postPreviewMessage = (
  channel: BroadcastChannel | null,
  message: PreviewMessage,
): void => postTypedMessage(channel, message);

let previewTab: Window | null = null;

export const openPreviewTab = (): boolean => {
  if (previewTab && !previewTab.closed) {
    previewTab.focus();
    return true;
  }
  previewTab = window.open(routes.studioPreview(), PREVIEW_TAB_NAME);
  return previewTab !== null;
};
