import {
  audioDataOf,
  hasTrackProcessor,
  videoFramesOf,
} from "../../../lib/insertableStreams";
import {
  AAC_CHANNELS,
  AAC_SAMPLE_RATE,
  audioEncoderConfigFor,
  H264_CODECS,
  videoEncoderConfigFor,
} from "./liveEncoderConfig";
import type {
  EncoderCommand,
  EncoderEvent,
  EncoderStartCommand,
} from "./liveEncoderProtocol";
import type { LiveQualityProfile } from "./liveQuality";

const STOP_GRACE_MS = 2000;

export interface LiveEncoderHandle {
  stop(): void;
}

interface StartLiveEncoderOptions {
  picture: MediaStreamTrack;
  sound: MediaStreamTrack;
  ingestUrl: string;
  token: string;
  quality: LiveQualityProfile;
  videoCodec: string;
  onEvent: (event: EncoderEvent) => void;
}

export const hasLiveEncodingApis = (): boolean =>
  typeof VideoEncoder === "function" &&
  typeof AudioEncoder === "function" &&
  typeof VideoFrame === "function" &&
  typeof OffscreenCanvas === "function" &&
  typeof Worker === "function" &&
  typeof WebSocket === "function" &&
  hasTrackProcessor();

const isSupported = async (check: () => Promise<{ supported?: boolean }>) => {
  try {
    return (await check()).supported === true;
  } catch {
    return false;
  }
};

export const chooseVideoCodec = async (
  quality: LiveQualityProfile,
): Promise<string | null> => {
  for (const codec of H264_CODECS)
    if (
      await isSupported(() =>
        VideoEncoder.isConfigSupported(videoEncoderConfigFor(quality, codec)),
      )
    )
      return codec;
  return null;
};

export const canEncodeAac = (): Promise<boolean> =>
  isSupported(() =>
    AudioEncoder.isConfigSupported(
      audioEncoderConfigFor(AAC_SAMPLE_RATE, AAC_CHANNELS),
    ),
  );

export const startLiveEncoder = ({
  picture,
  sound,
  ingestUrl,
  token,
  quality,
  videoCodec,
  onEvent,
}: StartLiveEncoderOptions): LiveEncoderHandle => {
  const video = videoFramesOf(picture);
  const audio = audioDataOf(sound);
  if (!video || !audio) throw new Error("Insertable streams are not available");

  const worker = new Worker(
    new URL("./liveEncoder.worker.ts", import.meta.url),
    {
      type: "module",
      name: "live-encoder",
    },
  );
  worker.onmessage = ({ data }: MessageEvent<EncoderEvent>) => onEvent(data);
  worker.onerror = () =>
    onEvent({
      type: "failed",
      reason: "encoder_failed",
      message: "The stream encoder stopped unexpectedly.",
    });

  const command: EncoderStartCommand = {
    type: "start",
    video,
    audio,
    ingestUrl,
    token,
    quality,
    videoCodec,
  };
  worker.postMessage(command, [video, audio]);

  return {
    stop: () => {
      worker.postMessage({ type: "stop" } satisfies EncoderCommand);
      setTimeout(() => worker.terminate(), STOP_GRACE_MS);
    },
  };
};
