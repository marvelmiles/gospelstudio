import {
  init,
  track,
  type CustomProperties,
  type PlausibleRequestPayload,
} from "@plausible-analytics/tracker";
import { getAnalyticsConfig } from "./analyticsConfig";
import { isAnalyticsOptedOut } from "./analyticsConsent";
import { VISITOR_TYPE_PROPERTY, type VisitorType } from "./analyticsEvents";
import { trackedReferrer, trackedUrl } from "./trackedUrl";
import { resolveVisitorType } from "./visitorType";

let isStarted = false;
let visitorType: VisitorType | null = null;

const visitorProperties = (): CustomProperties => {
  if (isAnalyticsOptedOut()) return {};
  visitorType ??= resolveVisitorType();
  return visitorType ? { [VISITOR_TYPE_PROPERTY]: visitorType } : {};
};

const sanitizePayload = (
  payload: PlausibleRequestPayload,
): PlausibleRequestPayload | null => {
  const url = trackedUrl(payload.u);
  if (!url) return null;
  return {
    ...payload,
    u: url,
    r: trackedReferrer(payload.r, window.location.origin),
  };
};

export const startPlausible = (): boolean => {
  if (isStarted) return true;
  const config = getAnalyticsConfig();

  if (!config) return false;
  try {
    init({
      domain: config.domain,
      endpoint: config.endpoint,
      autoCapturePageviews: true,
      logging: false,
      customProperties: visitorProperties,
      transformRequest: sanitizePayload,
    });
    isStarted = true;
  } catch {
    isStarted = false;
  }
  return isStarted;
};

export const isPlausibleActive = (): boolean =>
  isStarted && !isAnalyticsOptedOut();

export const sendPlausibleEvent = (
  name: string,
  props: CustomProperties | undefined,
  interactive: boolean,
): void => {
  if (!isPlausibleActive()) return;
  try {
    track(name, { props, interactive });
  } catch {}
};

export const resetVisitorType = (): void => {
  visitorType = null;
};

/* The tracker's engagement pings skip the plausible_ignore check, but an ignored pageview stops them until the next counted pageview. */
export const stopEngagementPings = (): void => {
  if (!isStarted || !isAnalyticsOptedOut()) return;
  try {
    track("pageview", {});
  } catch {}
};
