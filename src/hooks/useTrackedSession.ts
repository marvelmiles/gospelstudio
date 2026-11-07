import { useEffect, useEffectEvent } from "react";
import {
  endSession,
  startSession,
  type AnalyticsSession,
  type SessionStartArgs,
} from "../lib/analytics/analyticsSessions";

export const useTrackedSession = <S extends AnalyticsSession>(
  session: S,
  activeStartArgs: SessionStartArgs<S> | null,
): void => {
  const isActive = activeStartArgs !== null;
  const start = useEffectEvent(() => {
    if (activeStartArgs) startSession(session, ...activeStartArgs);
  });

  useEffect(() => {
    if (!isActive) return;
    start();
    return () => endSession(session);
  }, [isActive, session]);
};
