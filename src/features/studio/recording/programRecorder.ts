import { create } from "zustand";
import { downloadBlob } from "../../../lib/download";
import { useStore } from "../../../store/useStore";
import {
  RECORDING_HEIGHT,
  RECORDING_WIDTH,
  toLandscapeTrack,
} from "./landscapeTrack";

export type RecordingStatus =
  "idle" | "starting" | "recording" | "paused" | "saving";

export type RecordingStart = "started" | "cancelled" | "failed";

interface RecordingState {
  status: RecordingStatus;
  elapsedMs: number;
  runningSince: number | null;
}

interface ScreenCaptureOptions extends DisplayMediaStreamOptions {
  selfBrowserSurface?: "include" | "exclude";
  systemAudio?: "include" | "exclude";
  surfaceSwitching?: "include" | "exclude";
}

interface RecordingSession {
  recorder: MediaRecorder;
  capture: MediaStream;
  context: AudioContext;
  destination: MediaStreamAudioDestinationNode;
  cameraSources: Map<MediaStream, MediaStreamAudioSourceNode>;
  chunks: Blob[];
  fileName: string;
}

const CHUNK_INTERVAL_MS = 1000;
const FRAME_RATE = 30;
const VIDEO_BITS_PER_SECOND = 2_000_000;
const AUDIO_BITS_PER_SECOND = 128_000;

const RECORDING_FORMATS = [
  { mimeType: "video/mp4;codecs=avc1.640028,mp4a.40.2", extension: "mp4" },
  { mimeType: "video/mp4", extension: "mp4" },
  { mimeType: "video/webm;codecs=vp9,opus", extension: "webm" },
  { mimeType: "video/webm;codecs=vp8,opus", extension: "webm" },
  { mimeType: "video/webm", extension: "webm" },
];

const CAPTURE_OPTIONS: ScreenCaptureOptions = {
  video: {
    displaySurface: "window",
    frameRate: { ideal: FRAME_RATE, max: FRAME_RATE },
    width: { ideal: RECORDING_WIDTH, max: RECORDING_WIDTH },
    height: { ideal: RECORDING_HEIGHT, max: RECORDING_HEIGHT },
  },
  audio: true,
  selfBrowserSurface: "exclude",
  systemAudio: "exclude",
  surfaceSwitching: "include",
};

const IDLE: RecordingState = {
  status: "idle",
  elapsedMs: 0,
  runningSince: null,
};

export const useRecordingStore = create<RecordingState>()(() => IDLE);

let session: RecordingSession | null = null;
let cameraAudio: readonly MediaStream[] = [];

export const isRecordingSupported = (): boolean =>
  typeof MediaRecorder !== "undefined" &&
  typeof navigator.mediaDevices?.getDisplayMedia === "function";

const recordingFormat = () =>
  RECORDING_FORMATS.find((format) =>
    MediaRecorder.isTypeSupported(format.mimeType),
  );

const fileStamp = (date: Date): string => {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
};

const fileSlug = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "recording";

const syncCameraAudio = (active: RecordingSession): void => {
  const wanted = new Set(
    cameraAudio.filter((stream) => stream.getAudioTracks().length > 0),
  );
  for (const [stream, node] of active.cameraSources) {
    if (wanted.has(stream)) continue;
    node.disconnect();
    active.cameraSources.delete(stream);
  }
  for (const stream of wanted) {
    if (active.cameraSources.has(stream)) continue;
    const node = active.context.createMediaStreamSource(stream);
    node.connect(active.destination);
    active.cameraSources.set(stream, node);
  }
};

export const setRecordingCameraAudio = (
  streams: readonly MediaStream[],
): void => {
  cameraAudio = streams;
  if (session) syncCameraAudio(session);
};

const warnBeforeLeaving = (event: BeforeUnloadEvent): void => {
  event.preventDefault();
};

const release = (finished: RecordingSession): void => {
  for (const track of finished.capture.getTracks()) track.stop();
  for (const track of finished.recorder.stream.getVideoTracks()) track.stop();
  for (const node of finished.cameraSources.values()) node.disconnect();
  void finished.context.close().catch(() => {});
  window.removeEventListener("beforeunload", warnBeforeLeaving);
};

const saveRecording = (finished: RecordingSession): void => {
  const blob = new Blob(finished.chunks, { type: finished.recorder.mimeType });
  if (blob.size > 0) {
    downloadBlob(blob, finished.fileName);
    useStore.getState().pushToast("The recording is in your downloads.");
  }
  release(finished);
  if (session === finished) session = null;
  useRecordingStore.setState(IDLE);
};

const mixedRecordingStream = (
  capture: MediaStream,
  context: AudioContext,
  destination: MediaStreamAudioDestinationNode,
): MediaStream => {
  const screenAudio = capture.getAudioTracks();
  if (screenAudio.length > 0)
    context
      .createMediaStreamSource(new MediaStream(screenAudio))
      .connect(destination);
  return new MediaStream([
    ...capture.getVideoTracks().map(toLandscapeTrack),
    ...destination.stream.getAudioTracks(),
  ]);
};

export const startRecording = async (
  title: string,
): Promise<RecordingStart> => {
  const format = isRecordingSupported() ? recordingFormat() : undefined;
  if (!format || session) return "failed";
  useRecordingStore.setState({ ...IDLE, status: "starting" });
  const context = new AudioContext();
  const destination = context.createMediaStreamDestination();

  let capture: MediaStream;
  try {
    capture = await navigator.mediaDevices.getDisplayMedia(CAPTURE_OPTIONS);
  } catch (error) {
    void context.close().catch(() => {});
    useRecordingStore.setState(IDLE);
    return error instanceof DOMException && error.name === "NotAllowedError"
      ? "cancelled"
      : "failed";
  }
  void context.resume().catch(() => {});
  const recorder = new MediaRecorder(
    mixedRecordingStream(capture, context, destination),
    {
      mimeType: format.mimeType,
      videoBitsPerSecond: VIDEO_BITS_PER_SECOND,
      audioBitsPerSecond: AUDIO_BITS_PER_SECOND,
    },
  );
  const active: RecordingSession = {
    recorder,
    capture,
    context,
    destination,
    cameraSources: new Map(),
    chunks: [],
    fileName: `${fileSlug(title)}-${fileStamp(new Date())}.${format.extension}`,
  };
  session = active;
  syncCameraAudio(active);

  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) active.chunks.push(event.data);
  });
  recorder.addEventListener("stop", () => saveRecording(active));
  for (const track of capture.getVideoTracks())
    track.addEventListener("ended", stopRecording);

  window.addEventListener("beforeunload", warnBeforeLeaving);
  recorder.start(CHUNK_INTERVAL_MS);
  useRecordingStore.setState({
    status: "recording",
    elapsedMs: 0,
    runningSince: Date.now(),
  });
  return "started";
};

export const pauseRecording = (): void => {
  if (!session || session.recorder.state !== "recording") return;
  session.recorder.pause();
  useRecordingStore.setState((state) => ({
    status: "paused",
    elapsedMs:
      state.elapsedMs +
      (state.runningSince ? Date.now() - state.runningSince : 0),
    runningSince: null,
  }));
};

export const resumeRecording = (): void => {
  if (!session || session.recorder.state !== "paused") return;
  session.recorder.resume();
  useRecordingStore.setState({ status: "recording", runningSince: Date.now() });
};

export const stopRecording = (): void => {
  if (!session || session.recorder.state === "inactive") return;
  useRecordingStore.setState({ status: "saving", runningSince: null });
  session.recorder.stop();
};
