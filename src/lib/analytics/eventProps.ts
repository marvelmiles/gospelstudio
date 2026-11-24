import type { AnalyticsEvent } from "@/contracts/analyticsEvents";
import type { LiveQualityId } from "../../features/liveStream/lib/liveQuality";

export type PresentedContent = "manuscript" | "scripture" | "image" | "video";
type UploadedMediaKind = "image" | "video" | "audio";
export type SceneCreationSource = "blank" | "template" | "layout" | "duplicate";
export type CameraPairingMethod = "one_tap" | "code";
export type CameraFailureReason = "camera_unavailable" | "connection_failed";
export type LiveStreamFailureReason =
  | "capture_failed"
  | "service_unavailable"
  | "connection_failed"
  | "broadcast_failed"
  | "unsupported_browser";

interface EventPropsWithValues {
  "Presentation Started": { content: PresentedContent };
  "Production Scene Created": { source: SceneCreationSource };
  "Camera Broadcast Started": { method: CameraPairingMethod };
  "Camera Broadcast Failed": {
    method: CameraPairingMethod;
    reason: CameraFailureReason;
  };
  "Live Stream Started": { quality: LiveQualityId; platforms: string };
  "Live Stream Failed": { reason: LiveStreamFailureReason };
  "Media Uploaded": { kind: UploadedMediaKind };
}

export type AnalyticsEventProps<E extends AnalyticsEvent> =
  E extends keyof EventPropsWithValues ? EventPropsWithValues[E] : undefined;
