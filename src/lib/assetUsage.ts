import { z } from "zod";
import type {
  AudioSettings,
  ContentKind,
  ImageSettings,
  Slide,
  SlideDeckDoc,
  SlideOverrides,
  VideoSettings,
} from "../types";
import {
  audioSettingsSchema,
  imageSettingsSchema,
  videoSettingsSchema,
} from "./schema";
import routes from "../routes";

export type AssetUsageKind = "image" | "video" | "audio";

export type AssetUsageDocKind = Extract<
  ContentKind,
  "manuscript" | "scripture"
>;

type AssetUsageSubject =
  | { kind: "image"; settings: ImageSettings; defaults: ImageSettings }
  | { kind: "video"; settings: VideoSettings; defaults: VideoSettings }
  | { kind: "audio"; settings: AudioSettings; defaults: AudioSettings };

export type AssetUsageRequest = AssetUsageSubject & {
  assetId: string;
  inUse: boolean;
};

export interface AssetUsagePlace {
  label: string;
  slideId: string | null;
  docKind: AssetUsageDocKind;
  docId: string;
}

export type AssetUsageEdit = AssetUsageRequest & AssetUsagePlace;

const editShape = {
  assetId: z.string().min(1),
  inUse: z.boolean(),
  label: z.string().min(1),
  slideId: z.string().nullable(),
  docKind: z.enum(["manuscript", "scripture"]),
  docId: z.string().min(1),
};

export const assetUsageEditSchema = z.discriminatedUnion("kind", [
  z.object({
    ...editShape,
    kind: z.literal("image"),
    settings: imageSettingsSchema,
    defaults: imageSettingsSchema,
  }),
  z.object({
    ...editShape,
    kind: z.literal("video"),
    settings: videoSettingsSchema,
    defaults: videoSettingsSchema,
  }),
  z.object({
    ...editShape,
    kind: z.literal("audio"),
    settings: audioSettingsSchema,
    defaults: audioSettingsSchema,
  }),
]);

export const isAssetUsageDocKind = (
  kind: ContentKind,
): kind is AssetUsageDocKind => kind === "manuscript" || kind === "scripture";

const DOCUMENT_ROUTE: Record<AssetUsageDocKind, (id: string) => string> = {
  manuscript: routes.manuscript,
  scripture: routes.passage,
};

export const assetUsageReturnPath = (place: AssetUsagePlace): string =>
  DOCUMENT_ROUTE[place.docKind](place.docId);

export const assetUsagePath = (edit: AssetUsageEdit): string =>
  routes.assetUsage(
    edit.kind === "audio" ? "sound" : "background",
    edit.assetId,
  );

export const assetUsageNote = (label: string, kind: AssetUsageKind): string => {
  const noun =
    kind === "image" ? "picture" : kind === "video" ? "clip" : "sound";
  return `These changes apply to ${label} only. The ${noun} in your library is left as it is, so everywhere else it is used stays the way it is.`;
};

const assetUsageSlideChanges = (
  edit: AssetUsageEdit,
): Partial<SlideOverrides> => {
  if (edit.kind === "image")
    return { backgroundId: edit.assetId, backgroundImage: edit.settings };
  if (edit.kind === "video")
    return { backgroundId: edit.assetId, backgroundVideo: edit.settings };
  return { audioId: edit.assetId, audioSettings: edit.settings };
};

const assetUsageDocumentChanges = (
  edit: AssetUsageEdit,
): Partial<SlideDeckDoc> => {
  if (edit.kind === "image")
    return {
      defaultBackgroundId: edit.assetId,
      defaultBackgroundImage: edit.settings,
    };
  if (edit.kind === "video")
    return {
      defaultBackgroundId: edit.assetId,
      defaultBackgroundVideo: edit.settings,
    };
  return { defaultAudioId: edit.assetId, defaultAudioSettings: edit.settings };
};

const withSlideChanges = (slide: Slide, edit: AssetUsageEdit): Slide => ({
  ...slide,
  overrides: { ...slide.overrides, ...assetUsageSlideChanges(edit) },
});

export const applyAssetUsage = <T extends SlideDeckDoc>(
  doc: T,
  edit: AssetUsageEdit,
): T => {
  const { slideId } = edit;
  if (!slideId) return { ...doc, ...assetUsageDocumentChanges(edit) };
  return {
    ...doc,
    slides: (doc.slides ?? []).map((slide) =>
      slide.id === slideId ? withSlideChanges(slide, edit) : slide,
    ),
  };
};
