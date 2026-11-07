import { useEffect, useRef } from "react";
import type { CameraPairingMethod } from "../../../lib/analytics/analyticsEvents";
import {
  endSession,
  isSessionOpen,
  startSession,
} from "../../../lib/analytics/analyticsSessions";
import { trackBroadcastFailure } from "../lib/broadcastAnalytics";

interface BroadcastAnalyticsOptions {
  isLive: boolean;
  hasFailed: boolean;
  method: CameraPairingMethod;
}

export const useBroadcastAnalytics = ({
  isLive,
  hasFailed,
  method,
}: BroadcastAnalyticsOptions): void => {
  const hasReportedFailureRef = useRef(false);

  useEffect(() => {
    if (isLive) startSession("camera", { props: { method } });
  }, [isLive, method]);

  useEffect(() => {
    if (!hasFailed || hasReportedFailureRef.current) return;
    if (isSessionOpen("camera")) return;
    hasReportedFailureRef.current = true;
    trackBroadcastFailure(method, "connection_failed");
  }, [hasFailed, method]);

  useEffect(() => () => endSession("camera"), []);
};
