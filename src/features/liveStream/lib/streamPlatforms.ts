import { z } from "zod";

const STREAM_PLATFORM_IDS = [
  "youtube",
  "facebook",
  "instagram",
  "tiktok",
  "x",
  "twitch",
  "linkedin",
  "kick",
  "custom",
] as const;

export const streamPlatformIdSchema = z.enum(STREAM_PLATFORM_IDS);

export type StreamPlatformId = z.infer<typeof streamPlatformIdSchema>;

export interface StreamPlatform {
  id: StreamPlatformId;
  name: string;
  defaultServerUrl: string;
  serverUrlExample: string;
  keyInstructions: string;
  setupUrl: string | null;
}

export const STREAM_PLATFORMS: Record<StreamPlatformId, StreamPlatform> = {
  youtube: {
    id: "youtube",
    name: "YouTube",
    defaultServerUrl: "rtmps://a.rtmps.youtube.com/live2",
    serverUrlExample: "rtmps://a.rtmps.youtube.com/live2",
    keyInstructions:
      "In YouTube Studio choose Create, then Go live, then Stream. Copy the stream key.",
    setupUrl: "https://studio.youtube.com",
  },
  facebook: {
    id: "facebook",
    name: "Facebook",
    defaultServerUrl: "rtmps://live-api-s.facebook.com:443/rtmp",
    serverUrlExample: "rtmps://live-api-s.facebook.com:443/rtmp",
    keyInstructions:
      "Open Live Producer, choose Streaming software, and copy the stream key. Facebook keys can be used once unless you turn on a persistent key.",
    setupUrl: "https://www.facebook.com/live/producer",
  },
  instagram: {
    id: "instagram",
    name: "Instagram",
    defaultServerUrl: "",
    serverUrlExample: "rtmps://edgetee-upload-xxx.xx.fbcdn.net:443/rtmp",
    keyInstructions:
      "On instagram.com choose Create, then Live video. Copy the stream URL and the stream key it shows.",
    setupUrl: "https://www.instagram.com",
  },
  tiktok: {
    id: "tiktok",
    name: "TikTok",
    defaultServerUrl: "",
    serverUrlExample: "rtmp://push-rtmp-xx.tiktokcdn.com/game",
    keyInstructions:
      "In TikTok LIVE Studio or LIVE Center, set up a stream with streaming software and copy the server URL and stream key.",
    setupUrl: null,
  },
  x: {
    id: "x",
    name: "X",
    defaultServerUrl: "",
    serverUrlExample: "rtmps://xx.pscp.tv:443/x",
    keyInstructions:
      "In X Media Studio open Producer, create a source, and copy its RTMP URL and stream key.",
    setupUrl: null,
  },
  twitch: {
    id: "twitch",
    name: "Twitch",
    defaultServerUrl: "rtmp://live.twitch.tv/app",
    serverUrlExample: "rtmp://live.twitch.tv/app",
    keyInstructions:
      "In the Twitch Creator Dashboard open Settings, then Stream, and copy the primary stream key.",
    setupUrl: "https://dashboard.twitch.tv/settings/stream",
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    defaultServerUrl: "",
    serverUrlExample: "rtmps://xxxx.channel.media.azure.net:2935/live/xxxx",
    keyInstructions:
      "Create a LinkedIn Live event with an external streaming tool and copy the stream URL and stream key.",
    setupUrl: null,
  },
  kick: {
    id: "kick",
    name: "Kick",
    defaultServerUrl: "",
    serverUrlExample: "rtmps://xxxx.global-contribute.live-video.net/app",
    keyInstructions:
      "In the Kick dashboard open Settings, then Stream URL & Key, and copy both.",
    setupUrl: null,
  },
  custom: {
    id: "custom",
    name: "Other RTMP service",
    defaultServerUrl: "",
    serverUrlExample: "rtmps://live.example.com/app",
    keyInstructions:
      "Use the server address and stream key your streaming service gives you.",
    setupUrl: null,
  },
};

export const STREAM_PLATFORM_LIST = STREAM_PLATFORM_IDS.map(
  (id) => STREAM_PLATFORMS[id],
);
