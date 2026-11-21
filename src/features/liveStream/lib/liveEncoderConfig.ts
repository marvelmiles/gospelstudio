import {
  LIVE_AUDIO_BITRATE_KBPS,
  type LiveQualityProfile,
} from "./liveQuality";

const AAC_CODEC = "mp4a.40.2";
export const AAC_SAMPLE_RATE = 48_000;
export const AAC_CHANNELS = 2;

export const H264_CODECS = ["avc1.640028", "avc1.4d0028", "avc1.42e028"];

export const videoEncoderConfigFor = (
  quality: LiveQualityProfile,
  codec: string,
  bitrateKbps: number = quality.maxVideoBitrateKbps,
): VideoEncoderConfig => ({
  codec,
  width: quality.width,
  height: quality.height,
  framerate: quality.frameRate,
  bitrate: bitrateKbps * 1000,
  bitrateMode: "variable",
  latencyMode: "realtime",
  avc: { format: "avc" },
});

export const audioEncoderConfigFor = (
  sampleRate: number,
  numberOfChannels: number,
): AudioEncoderConfig => ({
  codec: AAC_CODEC,
  sampleRate,
  numberOfChannels,
  bitrate: LIVE_AUDIO_BITRATE_KBPS * 1000,
});
