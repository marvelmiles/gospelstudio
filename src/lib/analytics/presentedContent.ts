import type { PresentedContent } from "./analyticsEvents";
import { trackEvent, type EventWithoutProps } from "./trackEvent";

const CONTENT_EVENTS: Record<PresentedContent, EventWithoutProps | null> = {
  manuscript: null,
  scripture: "Bible Verse Displayed",
  image: "Image Presented",
  video: null,
};

export const trackPresentedContent = (content: PresentedContent): void => {
  const event = CONTENT_EVENTS[content];
  if (event) trackEvent(event);
};
