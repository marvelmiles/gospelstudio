import { create } from "zustand";
import {
  createProgramSoundMixer,
  type NoiseSuppressionState,
  type ProgramSoundMixer,
} from "./programSound";
import { useProgramSoundSettings } from "./programSoundSettings";
import { FULL_HD_FRAME } from "./landscapeTrack";

const CAPTURE_FRAME_RATE = 30;
const SOUND_INPUT_SAMPLE_RATE = 48_000;

interface ScreenCaptureOptions extends DisplayMediaStreamOptions {
  selfBrowserSurface?: "include" | "exclude";
  systemAudio?: "include" | "exclude";
  surfaceSwitching?: "include" | "exclude";
}

const CAPTURE_OPTIONS: ScreenCaptureOptions = {
  video: {
    displaySurface: "window",
    frameRate: { ideal: CAPTURE_FRAME_RATE, max: CAPTURE_FRAME_RATE },
    width: { ideal: FULL_HD_FRAME.width, max: FULL_HD_FRAME.width },
    height: { ideal: FULL_HD_FRAME.height, max: FULL_HD_FRAME.height },
  },
  audio: true,
  selfBrowserSurface: "exclude",
  systemAudio: "exclude",
  surfaceSwitching: "include",
};

const soundInputConstraints = (deviceId: string): MediaTrackConstraints => ({
  deviceId: { exact: deviceId },
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
  channelCount: { ideal: 2 },
  sampleRate: { ideal: SOUND_INPUT_SAMPLE_RATE },
});

export type SoundInputStatus = "off" | "connecting" | "on" | "unavailable";

interface ProgramCaptureState {
  isActive: boolean;
  soundInput: SoundInputStatus;
  noiseSuppression: NoiseSuppressionState;
}

const INACTIVE: ProgramCaptureState = {
  isActive: false,
  soundInput: "off",
  noiseSuppression: "off",
};

export const useProgramCaptureStore = create<ProgramCaptureState>()(
  () => INACTIVE,
);

export interface ProgramCaptureLease {
  readonly videoTrack: MediaStreamTrack;
  readonly audioTrack: MediaStreamTrack;
  onEnded(listener: () => void): void;
  release(): void;
}

export type ProgramCaptureResult =
  | { status: "started"; lease: ProgramCaptureLease }
  | { status: "cancelled" | "failed" };

interface LeaseRecord {
  tracks: MediaStreamTrack[];
  endedListeners: Set<() => void>;
  released: boolean;
}

interface CaptureSession {
  capture: MediaStream;
  mixer: ProgramSoundMixer;
  leases: Set<LeaseRecord>;
  soundInput: MediaStream | null;
  soundInputRequest: number;
  unsubscribeSettings: () => void;
}

type OpenResult = CaptureSession | "cancelled" | "failed";

let session: CaptureSession | null = null;
let opening: Promise<OpenResult> | null = null;
let cameraAudio: readonly MediaStream[] = [];

export const isProgramCaptureSupported = (): boolean =>
  typeof navigator.mediaDevices?.getDisplayMedia === "function" &&
  typeof AudioContext !== "undefined";

export const setProgramCameraAudio = (
  streams: readonly MediaStream[],
): void => {
  cameraAudio = streams;
  session?.mixer.setCameraAudio(streams);
};

const stopStream = (stream: MediaStream | null): void => {
  for (const track of stream?.getTracks() ?? []) track.stop();
};

const setSoundInputStatus = (soundInput: SoundInputStatus): void =>
  useProgramCaptureStore.setState({ soundInput });

const connectSoundInput = async (active: CaptureSession): Promise<void> => {
  const request = ++active.soundInputRequest;
  stopStream(active.soundInput);
  active.soundInput = null;
  active.mixer.setSoundInput(null);

  const { inputDeviceId } = useProgramSoundSettings.getState();
  if (!inputDeviceId) {
    setSoundInputStatus("off");
    return;
  }
  setSoundInputStatus("connecting");
  const isCurrent = () =>
    session === active && request === active.soundInputRequest;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: soundInputConstraints(inputDeviceId),
      video: false,
    });
    if (!isCurrent()) {
      stopStream(stream);
      return;
    }
    active.soundInput = stream;
    active.mixer.setSoundInput(stream);
    setSoundInputStatus("on");
    stream.getAudioTracks()[0]?.addEventListener("ended", () => {
      if (active.soundInput === stream) setSoundInputStatus("unavailable");
    });
  } catch {
    if (isCurrent()) setSoundInputStatus("unavailable");
  }
};

const applyNoiseSuppression = async (active: CaptureSession): Promise<void> => {
  const enabled = useProgramSoundSettings.getState().noiseSuppression;
  useProgramCaptureStore.setState({
    noiseSuppression: enabled ? "starting" : "off",
  });
  const state = await active.mixer.setNoiseSuppression(enabled);
  if (session === active)
    useProgramCaptureStore.setState({ noiseSuppression: state });
};

export const readProgramSoundLevel = (): number | null =>
  session?.mixer.level() ?? null;

const closeSession = (active: CaptureSession): void => {
  if (session === active) session = null;
  active.soundInputRequest += 1;
  active.unsubscribeSettings();
  stopStream(active.capture);
  stopStream(active.soundInput);
  active.mixer.dispose();
  useProgramCaptureStore.setState(INACTIVE);
};

const releaseLease = (active: CaptureSession, record: LeaseRecord): void => {
  if (record.released) return;
  record.released = true;
  for (const track of record.tracks) track.stop();
  active.leases.delete(record);
  if (active.leases.size === 0) closeSession(active);
};

const endSession = (active: CaptureSession): void => {
  const listeners = [...active.leases].flatMap((record) => [
    ...record.endedListeners,
  ]);
  for (const listener of listeners) listener();
  for (const record of [...active.leases]) releaseLease(active, record);
};

const isPermissionDenied = (error: unknown): boolean =>
  error instanceof DOMException && error.name === "NotAllowedError";

const openSession = async (): Promise<OpenResult> => {
  const mixer = createProgramSoundMixer(
    useProgramSoundSettings.getState().polish,
  );
  let capture: MediaStream;
  try {
    capture = await navigator.mediaDevices.getDisplayMedia(CAPTURE_OPTIONS);
  } catch (error) {
    mixer.dispose();
    return isPermissionDenied(error) ? "cancelled" : "failed";
  }
  const [videoTrack] = capture.getVideoTracks();
  if (!videoTrack) {
    stopStream(capture);
    mixer.dispose();
    return "failed";
  }

  void mixer.context.resume().catch(() => {});
  mixer.addScreenAudio(capture);
  mixer.setCameraAudio(cameraAudio);

  const opened: CaptureSession = {
    capture,
    mixer,
    leases: new Set(),
    soundInput: null,
    soundInputRequest: 0,
    unsubscribeSettings: () => {},
  };
  session = opened;
  opened.unsubscribeSettings = useProgramSoundSettings.subscribe(
    (settings, previous) => {
      if (settings.polish !== previous.polish)
        opened.mixer.setPolish(settings.polish);
      if (settings.inputDeviceId !== previous.inputDeviceId)
        void connectSoundInput(opened);
      if (settings.noiseSuppression !== previous.noiseSuppression)
        void applyNoiseSuppression(opened);
    },
  );
  videoTrack.addEventListener("ended", () => endSession(opened));
  useProgramCaptureStore.setState({ isActive: true });
  void connectSoundInput(opened);
  void applyNoiseSuppression(opened);
  return opened;
};

const createLease = (active: CaptureSession): ProgramCaptureLease => {
  const [captureVideo] = active.capture.getVideoTracks();
  const [mixedAudio] = active.mixer.output.stream.getAudioTracks();
  const videoTrack = captureVideo.clone();
  const audioTrack = mixedAudio.clone();
  const record: LeaseRecord = {
    tracks: [videoTrack, audioTrack],
    endedListeners: new Set(),
    released: false,
  };
  active.leases.add(record);
  return {
    videoTrack,
    audioTrack,
    onEnded: (listener) => record.endedListeners.add(listener),
    release: () => releaseLease(active, record),
  };
};

export const acquireProgramCapture =
  async (): Promise<ProgramCaptureResult> => {
    if (!isProgramCaptureSupported()) return { status: "failed" };
    if (!session) {
      opening ??= openSession().finally(() => {
        opening = null;
      });
      const result = await opening;
      if (result === "cancelled" || result === "failed")
        return { status: result };
    }
    return session
      ? { status: "started", lease: createLease(session) }
      : { status: "failed" };
  };
