import type { CameraSource, CameraStatus } from "../types/mediaSource";
import {
  setSourceState,
  useCameraStore,
  type InputDevice,
} from "../store/cameraStore";

interface SourceRuntime {
  key: string;
  stream: MediaStream | null;
  status: CameraStatus;
}

export interface CameraFailure {
  status: CameraStatus;
  message: string;
}

const runtimes = new Map<string, SourceRuntime>();
const knownSources = new Map<string, CameraSource>();
let isWatchingDevices = false;

export const isCameraSupported = (): boolean =>
  typeof navigator !== "undefined" &&
  Boolean(navigator.mediaDevices?.getUserMedia) &&
  window.isSecureContext;

const UNSUPPORTED: CameraFailure = {
  status: "unsupported",
  message:
    "Cameras only open on a secure (https) address in a modern browser such as Chrome or Edge.",
};

const failureOf = (error: unknown): CameraFailure => {
  const name = error instanceof DOMException ? error.name : "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return {
        status: "denied",
        message:
          "Camera access is blocked. Click the camera icon in the address bar, choose Allow, then press Try again.",
      };
    case "NotFoundError":
    case "OverconstrainedError":
      return {
        status: "missing",
        message:
          "This camera is not connected. Plug it in and it reconnects by itself, or choose another camera.",
      };
    case "NotReadableError":
    case "AbortError":
      return {
        status: "busy",
        message:
          "Another app is using this camera. Close it (for example Zoom, Teams or OBS), then press Try again.",
      };
    default:
      return {
        status: "error",
        message: "The camera could not start. Press Try again.",
      };
  }
};

const runtimeKey = (source: CameraSource): string =>
  `${source.deviceId ?? "default"}|${source.audioDeviceId ?? "none"}`;

const stopStream = (stream: MediaStream | null): void => {
  for (const track of stream?.getTracks() ?? []) track.stop();
};

const isStreamLive = (stream: MediaStream | null): boolean =>
  Boolean(
    stream?.getVideoTracks().some((track) => track.readyState === "live"),
  );

const constraintsOf = (source: CameraSource): MediaStreamConstraints => ({
  video: {
    ...(source.deviceId ? { deviceId: { exact: source.deviceId } } : {}),
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 30 },
  },
  audio: source.audioDeviceId
    ? {
        deviceId: { exact: source.audioDeviceId },
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }
    : false,
});

const UNSUPPORTED_DEVICE_LABELS = [/iriun/i];

const isSupportedDevice = (device: MediaDeviceInfo): boolean =>
  !UNSUPPORTED_DEVICE_LABELS.some((pattern) => pattern.test(device.label));

const describeDevices = (
  devices: MediaDeviceInfo[],
  kind: MediaDeviceKind,
  fallbackName: string,
): InputDevice[] =>
  devices
    .filter(
      (device) =>
        device.kind === kind && device.deviceId && isSupportedDevice(device),
    )
    .map((device, index) => ({
      deviceId: device.deviceId,
      label: device.label || `${fallbackName} ${index + 1}`,
    }));

let refreshRequest = 0;

export const refreshDevices = async (): Promise<void> => {
  if (!isCameraSupported()) {
    useCameraStore.setState({ devicesLoaded: true });
    return;
  }
  refreshRequest += 1;
  const request = refreshRequest;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    if (request !== refreshRequest) return;
    useCameraStore.setState({
      cameras: describeDevices(devices, "videoinput", "Camera"),
      microphones: describeDevices(devices, "audioinput", "Microphone"),
      hasDeviceLabels: devices.some(
        (device) => device.kind === "videoinput" && Boolean(device.label),
      ),
      devicesLoaded: true,
    });
  } catch {
    if (request === refreshRequest)
      useCameraStore.setState({ devicesLoaded: true });
  }
};

const retryDisconnected = (): void => {
  for (const [sourceId, runtime] of runtimes) {
    if (runtime.status !== "missing") continue;
    const source = knownSources.get(sourceId);
    if (source) void openSource(source);
  }
};

const watchDevices = (): void => {
  if (isWatchingDevices || !isCameraSupported()) return;
  isWatchingDevices = true;
  navigator.mediaDevices.addEventListener("devicechange", () => {
    void refreshDevices().then(retryDisconnected);
  });
};

const publish = (
  sourceId: string,
  runtime: SourceRuntime,
  message: string | null,
) =>
  setSourceState(sourceId, {
    status: runtime.status,
    message,
    stream: runtime.stream,
    deviceName: null,
    audioShared: false,
  });

const watchTracks = (sourceId: string, runtime: SourceRuntime): void => {
  for (const track of runtime.stream?.getVideoTracks() ?? []) {
    track.addEventListener("ended", () => {
      if (runtimes.get(sourceId) !== runtime) return;
      runtime.status = "missing";
      runtime.stream = null;
      publish(
        sourceId,
        runtime,
        "The camera was disconnected. Plug it back in and it reconnects by itself.",
      );
    });
  }
};

const openSource = async (source: CameraSource): Promise<void> => {
  const previous = runtimes.get(source.id);
  stopStream(previous?.stream ?? null);
  const runtime: SourceRuntime = {
    key: runtimeKey(source),
    stream: null,
    status: "starting",
  };
  runtimes.set(source.id, runtime);
  knownSources.set(source.id, source);
  publish(source.id, runtime, null);

  if (!isCameraSupported()) {
    runtime.status = UNSUPPORTED.status;
    publish(source.id, runtime, UNSUPPORTED.message);
    return;
  }

  watchDevices();
  try {
    const stream = await navigator.mediaDevices.getUserMedia(
      constraintsOf(source),
    );
    if (runtimes.get(source.id) !== runtime) {
      stopStream(stream);
      return;
    }
    runtime.stream = stream;
    runtime.status = "live";
    watchTracks(source.id, runtime);
    publish(source.id, runtime, null);
    if (!useCameraStore.getState().hasDeviceLabels) void refreshDevices();
  } catch (error) {
    if (runtimes.get(source.id) !== runtime) return;
    const failure = failureOf(error);
    runtime.status = failure.status;
    publish(source.id, runtime, failure.message);
  }
};

const ensureSource = (source: CameraSource): void => {
  const runtime = runtimes.get(source.id);
  knownSources.set(source.id, source);
  if (runtime && runtime.key === runtimeKey(source)) {
    if (runtime.status !== "live" || isStreamLive(runtime.stream)) return;
  }
  void openSource(source);
};

export const retrySource = (source: CameraSource): void => {
  void openSource(source);
};

const releaseSource = (sourceId: string): void => {
  const runtime = runtimes.get(sourceId);
  if (!runtime) return;
  runtimes.delete(sourceId);
  knownSources.delete(sourceId);
  stopStream(runtime.stream);
  setSourceState(sourceId, null);
};

export const retainSources = (sources: CameraSource[]): void => {
  const wanted = new Set(sources.map((source) => source.id));
  for (const sourceId of [...runtimes.keys()])
    if (!wanted.has(sourceId)) releaseSource(sourceId);
  for (const source of sources) ensureSource(source);
};

export const openCameraPreview = async (
  deviceId: string,
): Promise<MediaStream | CameraFailure> => {
  if (!isCameraSupported()) return UNSUPPORTED;
  watchDevices();
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } },
      audio: false,
    });
  } catch (error) {
    return failureOf(error);
  }
};

export const stopPreviewStream = (stream: MediaStream | null): void =>
  stopStream(stream);

export const requestCameraAccess = async (): Promise<CameraFailure | null> => {
  if (!isCameraSupported()) return UNSUPPORTED;
  watchDevices();
  try {
    const probe = await navigator.mediaDevices.getUserMedia({ video: true });
    stopStream(probe);
    await refreshDevices();
    return null;
  } catch (error) {
    await refreshDevices();
    return failureOf(error);
  }
};
