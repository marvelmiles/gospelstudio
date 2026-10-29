import type { PipPlacement } from "../../../types";

export interface StreamPipWindow {
  id: string;
  label: string;
  stream: MediaStream | null;
  placement: PipPlacement;
  muted: boolean;
}

export const cameraPipWindow = (camera: {
  deviceId: string;
  deviceName: string;
  stream: MediaStream | null;
  placement: PipPlacement;
  muted: boolean;
}): StreamPipWindow => ({
  id: camera.deviceId,
  label: camera.deviceName,
  stream: camera.stream,
  placement: camera.placement,
  muted: camera.muted,
});
