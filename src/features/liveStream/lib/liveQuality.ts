import { z } from "zod";

const LIVE_QUALITY_IDS = ["fullHd", "hd", "dataSaver"] as const;

export const liveQualityIdSchema = z.enum(LIVE_QUALITY_IDS);

export type LiveQualityId = z.infer<typeof liveQualityIdSchema>;

export interface LiveQualityProfile {
  id: LiveQualityId;
  label: string;
  description: string;
  width: number;
  height: number;
  frameRate: number;
  maxVideoBitrateKbps: number;
  minVideoBitrateKbps: number;
  recommendedUploadMbps: number;
}

const LIVE_FRAME_RATE = 30;

export const LIVE_AUDIO_BITRATE_KBPS = 128;
export const LIVE_KEYFRAME_INTERVAL_MS = 2000;

const LIVE_QUALITY_PROFILES: Record<LiveQualityId, LiveQualityProfile> =
  {
    fullHd: {
      id: "fullHd",
      label: "Full HD 1080p",
      description: "Sharpest picture. Needs a strong connection.",
      width: 1920,
      height: 1080,
      frameRate: LIVE_FRAME_RATE,
      maxVideoBitrateKbps: 4500,
      minVideoBitrateKbps: 1500,
      recommendedUploadMbps: 6,
    },
    hd: {
      id: "hd",
      label: "HD 720p",
      description: "Clear picture that suits most church connections.",
      width: 1280,
      height: 720,
      frameRate: LIVE_FRAME_RATE,
      maxVideoBitrateKbps: 2500,
      minVideoBitrateKbps: 700,
      recommendedUploadMbps: 4,
    },
    dataSaver: {
      id: "dataSaver",
      label: "Data saver 480p",
      description: "For weak or costly mobile data. Sound stays full quality.",
      width: 854,
      height: 480,
      frameRate: LIVE_FRAME_RATE,
      maxVideoBitrateKbps: 1000,
      minVideoBitrateKbps: 250,
      recommendedUploadMbps: 2,
    },
  };

export const DEFAULT_LIVE_QUALITY: LiveQualityId = "hd";

export const LIVE_QUALITY_LIST = LIVE_QUALITY_IDS.map(
  (id) => LIVE_QUALITY_PROFILES[id],
);

export const liveQualityProfile = (id: LiveQualityId): LiveQualityProfile =>
  LIVE_QUALITY_PROFILES[id];
