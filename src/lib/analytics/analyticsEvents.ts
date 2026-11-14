export const ANALYTICS_FEATURES = [
  { id: "studio", label: "Studio" },
  { id: "manuscripts", label: "Manuscripts" },
  { id: "scenes", label: "Production Scenes" },
  { id: "bible", label: "Bible" },
  { id: "presentations", label: "Presentations" },
  { id: "camera", label: "Camera Broadcast" },
  { id: "media", label: "Media" },
] as const;

export type AnalyticsFeature = (typeof ANALYTICS_FEATURES)[number]["id"];

interface AnalyticsEventDefinition {
  feature: AnalyticsFeature;
  interactive: boolean;
  countsAsUsage: boolean;
}

export const ANALYTICS_EVENTS = {
  "Studio Opened": {
    feature: "studio",
    interactive: false,
    countsAsUsage: true,
  },
  "Studio Session Started": {
    feature: "studio",
    interactive: true,
    countsAsUsage: true,
  },
  "Studio Session Ended": {
    feature: "studio",
    interactive: false,
    countsAsUsage: false,
  },
  "Manuscript Created": {
    feature: "manuscripts",
    interactive: true,
    countsAsUsage: true,
  },
  "Manuscript Edited": {
    feature: "manuscripts",
    interactive: true,
    countsAsUsage: true,
  },
  "Manuscript Deleted": {
    feature: "manuscripts",
    interactive: true,
    countsAsUsage: true,
  },
  "Manuscripts Imported": {
    feature: "manuscripts",
    interactive: true,
    countsAsUsage: true,
  },
  "Production Scene Created": {
    feature: "scenes",
    interactive: true,
    countsAsUsage: true,
  },
  "Production Scene Edited": {
    feature: "scenes",
    interactive: true,
    countsAsUsage: true,
  },
  "Production Scene Deleted": {
    feature: "scenes",
    interactive: true,
    countsAsUsage: true,
  },
  "Production Scene Activated": {
    feature: "scenes",
    interactive: true,
    countsAsUsage: true,
  },
  "Bible Opened": {
    feature: "bible",
    interactive: false,
    countsAsUsage: true,
  },
  "Bible Chapter Opened": {
    feature: "bible",
    interactive: true,
    countsAsUsage: true,
  },
  "Bible Verse Displayed": {
    feature: "bible",
    interactive: true,
    countsAsUsage: true,
  },
  "Presentation Started": {
    feature: "presentations",
    interactive: true,
    countsAsUsage: true,
  },
  "Presentation Ended": {
    feature: "presentations",
    interactive: false,
    countsAsUsage: false,
  },
  "Camera Broadcast Started": {
    feature: "camera",
    interactive: true,
    countsAsUsage: true,
  },
  "Camera Broadcast Ended": {
    feature: "camera",
    interactive: false,
    countsAsUsage: false,
  },
  "Camera Broadcast Failed": {
    feature: "camera",
    interactive: false,
    countsAsUsage: false,
  },
  "Media Uploaded": {
    feature: "media",
    interactive: true,
    countsAsUsage: true,
  },
  "Image Presented": {
    feature: "media",
    interactive: true,
    countsAsUsage: true,
  },
  "Video Presented": {
    feature: "media",
    interactive: true,
    countsAsUsage: true,
  },
} as const satisfies Record<string, AnalyticsEventDefinition>;

export type AnalyticsEvent = keyof typeof ANALYTICS_EVENTS;

export const ANALYTICS_EVENT_NAMES = Object.keys(
  ANALYTICS_EVENTS,
) as AnalyticsEvent[];

export const isAnalyticsEvent = (name: string): name is AnalyticsEvent =>
  (ANALYTICS_EVENT_NAMES as string[]).includes(name);

export const eventsOfFeature = (feature: AnalyticsFeature): AnalyticsEvent[] =>
  ANALYTICS_EVENT_NAMES.filter(
    (event) => ANALYTICS_EVENTS[event].feature === feature,
  );

export type PresentedContent = "manuscript" | "scripture" | "image" | "video";
export type ManuscriptImportSource = "files" | "folder";
type UploadedMediaKind = "image" | "video" | "audio";
export type SceneCreationSource = "blank" | "template" | "layout" | "duplicate";
export type CameraPairingMethod = "one_tap" | "code";
export type CameraFailureReason = "camera_unavailable" | "connection_failed";
export type VisitorType = "new" | "returning";

export const VISITOR_TYPE_PROPERTY = "visitor_type";

interface EventPropsWithValues {
  "Presentation Started": { content: PresentedContent };
  "Manuscripts Imported": { source: ManuscriptImportSource };
  "Production Scene Created": { source: SceneCreationSource };
  "Camera Broadcast Started": { method: CameraPairingMethod };
  "Camera Broadcast Failed": {
    method: CameraPairingMethod;
    reason: CameraFailureReason;
  };
  "Media Uploaded": { kind: UploadedMediaKind };
}

export type AnalyticsEventProps<E extends AnalyticsEvent> =
  E extends keyof EventPropsWithValues ? EventPropsWithValues[E] : undefined;
