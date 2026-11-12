export interface CameraSource {
  id: string;
  name: string;
  type: "camera";
  deviceId: string | null;
  audioDeviceId: string | null;
  deviceLabel: string;
}

export interface RemoteCameraSource {
  id: string;
  name: string;
  type: "remote";
  deviceLabel: string;
  muted: boolean;
}

export type MediaSource = CameraSource | RemoteCameraSource;

export const isLocalCamera = (source: MediaSource): source is CameraSource =>
  source.type === "camera";

export type CameraStatus =
  | "idle"
  | "starting"
  | "live"
  | "denied"
  | "missing"
  | "busy"
  | "unsupported"
  | "error";
