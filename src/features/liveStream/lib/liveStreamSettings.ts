import { z } from "zod";
import { create } from "zustand";
import { uid } from "../../../lib/id";
import {
  readDeviceSetting,
  writeDeviceSetting,
} from "../../../lib/deviceSettings";
import { MAX_STREAM_DESTINATIONS } from "@/contracts/liveRelay";
import {
  DEFAULT_LIVE_QUALITY,
  liveQualityIdSchema,
  type LiveQualityId,
} from "./liveQuality";
import { STREAM_PLATFORMS, streamPlatformIdSchema } from "./streamPlatforms";
import {
  buildStreamUrl,
  streamKeySchema,
  streamServerUrlSchema,
} from "@/contracts/streamUrl";

const SETTING_NAME = "live-stream";
const MAX_LABEL_LENGTH = 60;

export const streamDestinationFormSchema = z.object({
  platform: streamPlatformIdSchema,
  label: z.string().trim().max(MAX_LABEL_LENGTH),
  serverUrl: streamServerUrlSchema,
  streamKey: streamKeySchema,
});

export type StreamDestinationForm = z.input<typeof streamDestinationFormSchema>;

const streamDestinationSchema = streamDestinationFormSchema.extend({
  id: z.string().min(1).max(64),
  enabled: z.boolean(),
});

export type StreamDestination = z.infer<typeof streamDestinationSchema>;

const validDestinations = (items: unknown[]): StreamDestination[] =>
  items
    .flatMap((item) => {
      const parsed = streamDestinationSchema.safeParse(item);
      return parsed.success ? [parsed.data] : [];
    })
    .slice(0, MAX_STREAM_DESTINATIONS);

const liveStreamSettingsSchema = z.object({
  destinations: z.array(z.unknown()).catch([]).transform(validDestinations),
  quality: liveQualityIdSchema.catch(DEFAULT_LIVE_QUALITY),
});

type LiveStreamSettings = z.output<typeof liveStreamSettingsSchema>;

const DEFAULT_SETTINGS: LiveStreamSettings = {
  destinations: [],
  quality: DEFAULT_LIVE_QUALITY,
};

export const useLiveStreamSettings = create<LiveStreamSettings>()(() =>
  readDeviceSetting(SETTING_NAME, liveStreamSettingsSchema, DEFAULT_SETTINGS),
);

const updateSettings = (
  update: (settings: LiveStreamSettings) => Partial<LiveStreamSettings>,
): void => {
  useLiveStreamSettings.setState(update);
  writeDeviceSetting(SETTING_NAME, useLiveStreamSettings.getState());
};

export const destinationName = (destination: StreamDestination): string =>
  destination.label || STREAM_PLATFORMS[destination.platform].name;

export const streamUrlOf = (destination: StreamDestination): string =>
  buildStreamUrl(destination.serverUrl, destination.streamKey);

export const enabledDestinations = (
  destinations: readonly StreamDestination[],
): StreamDestination[] =>
  destinations.filter((destination) => destination.enabled);

export const saveDestination = (
  form: z.output<typeof streamDestinationFormSchema>,
  id?: string,
): void =>
  updateSettings(({ destinations }) => ({
    destinations: id
      ? destinations.map((destination) =>
          destination.id === id ? { ...destination, ...form } : destination,
        )
      : [...destinations, { ...form, id: uid(), enabled: true }].slice(
          0,
          MAX_STREAM_DESTINATIONS,
        ),
  }));

export const removeDestination = (id: string): void =>
  updateSettings(({ destinations }) => ({
    destinations: destinations.filter((destination) => destination.id !== id),
  }));

export const setDestinationEnabled = (id: string, enabled: boolean): void =>
  updateSettings(({ destinations }) => ({
    destinations: destinations.map((destination) =>
      destination.id === id ? { ...destination, enabled } : destination,
    ),
  }));

export const setLiveQuality = (quality: LiveQualityId): void =>
  updateSettings(() => ({ quality }));
