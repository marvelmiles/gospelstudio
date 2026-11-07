import { useSyncExternalStore } from "react";
import {
  isAnalyticsAvailable,
  setUsageStatisticsEnabled,
} from "../lib/analytics/analytics";
import {
  isAnalyticsOptedOut,
  subscribeToAnalyticsConsent,
} from "../lib/analytics/analyticsConsent";

const isSharingUsage = (): boolean => !isAnalyticsOptedOut();

export const useUsageStatistics = () => {
  const isEnabled = useSyncExternalStore(
    subscribeToAnalyticsConsent,
    isSharingUsage,
  );
  return {
    isAvailable: isAnalyticsAvailable(),
    isEnabled,
    setEnabled: setUsageStatisticsEnabled,
  };
};
