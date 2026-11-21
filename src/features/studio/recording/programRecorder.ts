import { create } from "zustand";
import { downloadBlob } from "../../../lib/download";
import { useStore } from "../../../store/useStore";
import { toLandscapeTrack } from "../capture/landscapeTrack";
import {
  acquireProgramCapture,
  isProgramCaptureSupported,
  type ProgramCaptureLease,
} from "../capture/programCapture";

export type RecordingStatus =
  "idle" | "starting" | "recording" | "paused" | "saving";

export type RecordingStart = "started" | "cancelled" | "failed";

interface RecordingState {
  status: RecordingStatus;
  elapsedMs: number;
  runningSince: number | null;
}

interface RecordingSession {
  recorder: MediaRecorder;
  lease: ProgramCaptureLease;
  videoTrack: MediaStreamTrack;
  chunks: Blob[];
  fileName: string;
}

const CHUNK_INTERVAL_MS = 1000;
const VIDEO_BITS_PER_SECOND = 2_000_000;
const AUDIO_BITS_PER_SECOND = 128_000;

const RECORDING_FORMATS = [
  { mimeType: "video/mp4;codecs=avc1.640028,mp4a.40.2", extension: "mp4" },
  { mimeType: "video/mp4", extension: "mp4" },
  { mimeType: "video/webm;codecs=vp9,opus", extension: "webm" },
  { mimeType: "video/webm;codecs=vp8,opus", extension: "webm" },
  { mimeType: "video/webm", extension: "webm" },
];

const IDLE: RecordingState = {
  status: "idle",
  elapsedMs: 0,
  runningSince: null,
};

export const useRecordingStore = create<RecordingState>()(() => IDLE);

let session: RecordingSession | null = null;

export const isRecordingSupported = (): boolean =>
  typeof MediaRecorder !== "undefined" && isProgramCaptureSupported();

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

const warnBeforeLeaving = (event: BeforeUnloadEvent): void => {
  event.preventDefault();
};

const release = (finished: RecordingSession): void => {
  finished.videoTrack.stop();
  finished.lease.release();
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

export const startRecording = async (
  title: string,
): Promise<RecordingStart> => {
  const format = isRecordingSupported() ? recordingFormat() : undefined;
  if (!format || session) return "failed";
  useRecordingStore.setState({ ...IDLE, status: "starting" });

  const capture = await acquireProgramCapture();
  if (capture.status !== "started") {
    useRecordingStore.setState(IDLE);
    return capture.status;
  }
  const { lease } = capture;
  const videoTrack = toLandscapeTrack(lease.videoTrack);
  const recorder = new MediaRecorder(
    new MediaStream([videoTrack, lease.audioTrack]),
    {
      mimeType: format.mimeType,
      videoBitsPerSecond: VIDEO_BITS_PER_SECOND,
      audioBitsPerSecond: AUDIO_BITS_PER_SECOND,
    },
  );
  const active: RecordingSession = {
    recorder,
    lease,
    videoTrack,
    chunks: [],
    fileName: `${fileSlug(title)}-${fileStamp(new Date())}.${format.extension}`,
  };
  session = active;

  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) active.chunks.push(event.data);
  });
  recorder.addEventListener("stop", () => saveRecording(active));
  lease.onEnded(stopRecording);

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
