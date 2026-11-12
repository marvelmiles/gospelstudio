import type { CameraLayer } from "../types/layer";
import type { MediaSource } from "../types/mediaSource";
import type { ProgramSnapshot } from "../types/production";

export interface SoundSharingDevice {
  sourceId: string;
  name: string;
  muted: boolean;
}

interface SharedAudioState {
  audioShared: boolean;
}

export const mutedSourceIds = (
  sources: readonly MediaSource[],
): ReadonlySet<string> =>
  new Set(
    sources.flatMap((source) =>
      source.type === "remote" && source.muted ? [source.id] : [],
    ),
  );

export const audibleSourceIds = (
  program: ProgramSnapshot | null,
  muted: ReadonlySet<string>,
): string[] => [
  ...new Set(
    (program?.layers ?? []).flatMap((layer) =>
      layer.type === "camera" && isAudible(layer) && !muted.has(layer.sourceId)
        ? [layer.sourceId]
        : [],
    ),
  ),
];

const isAudible = (
  layer: CameraLayer,
): layer is CameraLayer & { sourceId: string } =>
  layer.visible && !layer.muted && Boolean(layer.sourceId);

export const soundSharingDevices = (
  sources: readonly MediaSource[],
  states: Readonly<Record<string, SharedAudioState>>,
): SoundSharingDevice[] =>
  sources.flatMap((source) =>
    source.type === "remote" && states[source.id]?.audioShared
      ? [{ sourceId: source.id, name: source.name, muted: source.muted }]
      : [],
  );
