import type { StreamHealth } from "./adaptiveBitrate";
import type { SessionSnapshot } from "./liveRelayContract";
import type { LiveQualityProfile } from "./liveQuality";

export interface EncoderStartCommand {
  type: "start";
  video: ReadableStream<VideoFrame>;
  audio: ReadableStream<AudioData>;
  ingestUrl: string;
  token: string;
  quality: LiveQualityProfile;
  videoCodec: string;
}

export type EncoderCommand = EncoderStartCommand | { type: "stop" };

export interface StreamStats {
  sentKbps: number;
  targetKbps: number;
  bufferedMs: number;
  droppedFrames: number;
  health: StreamHealth;
}

export type EncoderFailure =
  "encoder_failed" | "connection_lost" | "unauthorized" | "session_ended";

export type EncoderEvent =
  | { type: "connected" }
  | { type: "reconnecting"; attempt: number }
  | { type: "session"; session: SessionSnapshot }
  | { type: "stats"; stats: StreamStats }
  | { type: "failed"; reason: EncoderFailure; message: string };
