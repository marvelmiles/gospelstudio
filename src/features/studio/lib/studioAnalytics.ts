import type { SceneCreationSource } from "../../../lib/analytics/analyticsEvents";
import { analyticsKey, trackEvent } from "../../../lib/analytics/trackEvent";

const sceneKey = (sceneId: string): string => analyticsKey("scene", sceneId);

export const trackSceneCreated = (
  sceneId: string,
  source: SceneCreationSource,
): void =>
  trackEvent("Production Scene Created", {
    props: { source },
    dedupeKey: sceneKey(sceneId),
  });

export const trackSceneEdited = (sceneId: string): void =>
  trackEvent("Production Scene Edited", { dedupeKey: sceneKey(sceneId) });

export const trackSceneDeleted = (): void =>
  trackEvent("Production Scene Deleted");

export const trackSceneActivated = (): void =>
  trackEvent("Production Scene Activated");
