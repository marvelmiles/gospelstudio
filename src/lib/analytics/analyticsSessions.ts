import { trackEvent, type TrackArgs } from "./trackEvent";

const SESSION_EVENTS = {
  studio: { start: "Studio Session Started", end: "Studio Session Ended" },
  presentation: { start: "Presentation Started", end: "Presentation Ended" },
  camera: { start: "Camera Broadcast Started", end: "Camera Broadcast Ended" },
} as const;

export type AnalyticsSession = keyof typeof SESSION_EVENTS;

type SessionStartEvent<S extends AnalyticsSession> =
  (typeof SESSION_EVENTS)[S]["start"];

export type SessionStartArgs<S extends AnalyticsSession> = TrackArgs<
  SessionStartEvent<S>
>;

const openSessions = new Set<AnalyticsSession>();

export const isSessionOpen = (session: AnalyticsSession): boolean =>
  openSessions.has(session);

export const startSession = <S extends AnalyticsSession>(
  session: S,
  ...args: SessionStartArgs<S>
): void => {
  if (openSessions.has(session)) return;
  openSessions.add(session);
  trackEvent<SessionStartEvent<S>>(SESSION_EVENTS[session].start, ...args);
};

export const endSession = (session: AnalyticsSession): void => {
  if (!openSessions.delete(session)) return;
  trackEvent(SESSION_EVENTS[session].end);
};

export const endAllSessions = (): void => {
  for (const session of [...openSessions]) endSession(session);
};

export const forgetOpenSessions = (): void => openSessions.clear();
