import type { CustomProperties } from "@plausible-analytics/tracker";
import {
  ANALYTICS_EVENTS,
  type AnalyticsEvent,
  type AnalyticsEventProps,
} from "./analyticsEvents";
import { createOccurrenceCheck } from "./eventDeduplication";
import { isPlausibleActive, sendPlausibleEvent } from "./plausible";

const REPEAT_ACTION_WINDOW_MS = 30 * 60 * 1000;

const isFreshOccurrence = createOccurrenceCheck(REPEAT_ACTION_WINDOW_MS);

type TrackOptions<E extends AnalyticsEvent> = {
  dedupeKey?: string;
} & (AnalyticsEventProps<E> extends undefined
  ? { props?: undefined }
  : { props: AnalyticsEventProps<E> });

export type TrackArgs<E extends AnalyticsEvent> =
  AnalyticsEventProps<E> extends undefined
    ? [options?: TrackOptions<E>]
    : [options: TrackOptions<E>];

export type EventWithoutProps = {
  [E in AnalyticsEvent]: AnalyticsEventProps<E> extends undefined ? E : never;
}[AnalyticsEvent];

export const trackEvent = <E extends AnalyticsEvent>(
  event: E,
  ...[options]: TrackArgs<E>
): void => {
  try {
    if (!isPlausibleActive()) return;
    if (options?.dedupeKey && !isFreshOccurrence(options.dedupeKey)) return;
    sendPlausibleEvent(
      event,
      options?.props as CustomProperties | undefined,
      ANALYTICS_EVENTS[event].interactive,
    );
  } catch {}
};

export const analyticsKey = (kind: string, id: string): string =>
  `${kind}:${id}`;
