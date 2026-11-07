import type {
  CameraFailureReason,
  CameraPairingMethod,
} from "../../../lib/analytics/analyticsEvents";
import { trackEvent } from "../../../lib/analytics/trackEvent";

export const trackBroadcastFailure = (
  method: CameraPairingMethod,
  reason: CameraFailureReason,
): void => trackEvent("Camera Broadcast Failed", { props: { method, reason } });
