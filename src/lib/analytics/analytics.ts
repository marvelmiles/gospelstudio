import { getAnalyticsConfig } from "./analyticsConfig";
import { setAnalyticsOptedOut } from "./analyticsConsent";
import { endAllSessions, forgetOpenSessions } from "./analyticsSessions";
import {
  resetVisitorType,
  startPlausible,
  stopEngagementPings,
} from "./plausible";
import { forgetVisitorType } from "./visitorType";

export const startAnalytics = (): void => {
  if (!startPlausible()) return;
  window.addEventListener("pagehide", endAllSessions);
};

export const isAnalyticsAvailable = (): boolean =>
  getAnalyticsConfig() !== null;

export const setUsageStatisticsEnabled = (enabled: boolean): void => {
  if (!enabled) {
    forgetOpenSessions();
    forgetVisitorType();
    resetVisitorType();
  }
  setAnalyticsOptedOut(!enabled);
  if (!enabled) stopEngagementPings();
};
