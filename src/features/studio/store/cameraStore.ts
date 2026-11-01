import { create } from "zustand";
import type { CameraStatus } from "../types/mediaSource";

export interface InputDevice {
  deviceId: string;
  label: string;
}

export interface SourceState {
  status: CameraStatus;
  message: string | null;
  stream: MediaStream | null;
  deviceName: string | null;
}

interface CameraStoreState {
  cameras: InputDevice[];
  microphones: InputDevice[];
  hasDeviceLabels: boolean;
  devicesLoaded: boolean;
  sources: Record<string, SourceState>;
}

export const useCameraStore = create<CameraStoreState>()(() => ({
  cameras: [],
  microphones: [],
  hasDeviceLabels: false,
  devicesLoaded: false,
  sources: {},
}));

const IDLE_SOURCE: SourceState = {
  status: "idle",
  message: null,
  stream: null,
  deviceName: null,
};

export const useSourceState = (sourceId: string | null): SourceState =>
  useCameraStore((state) =>
    sourceId ? (state.sources[sourceId] ?? IDLE_SOURCE) : IDLE_SOURCE,
  );

export const setSourceState = (
  sourceId: string,
  next: SourceState | null,
): void =>
  useCameraStore.setState((state) => {
    if (next === null) {
      if (!(sourceId in state.sources)) return state;
      const { [sourceId]: _removed, ...rest } = state.sources;
      return { sources: rest };
    }
    return { sources: { ...state.sources, [sourceId]: next } };
  });
