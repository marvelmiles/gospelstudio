import { describe, expect, it } from "vitest";
import {
  ANALYTICS_EVENTS,
  ANALYTICS_EVENT_NAMES,
  ANALYTICS_FEATURES,
  eventsOfFeature,
  isAnalyticsEvent,
} from "./analyticsEvents";

const TITLE_CASE_WORDS = /^[A-Z][a-z]+( [A-Z][a-z]+)+$/;

describe("analytics event catalog", () => {
  it("names every event in Title Case words so Plausible goals match exactly", () => {
    for (const event of ANALYTICS_EVENT_NAMES)
      expect(event, event).toMatch(TITLE_CASE_WORDS);
  });

  it("gives every feature at least one usage event", () => {
    for (const feature of ANALYTICS_FEATURES)
      expect(
        eventsOfFeature(feature.id).some(
          (event) => ANALYTICS_EVENTS[event].countsAsUsage,
        ),
        feature.id,
      ).toBe(true);
  });

  it("never counts ends or failures as feature use", () => {
    for (const event of ANALYTICS_EVENT_NAMES)
      if (event.endsWith("Ended") || event.endsWith("Failed"))
        expect(ANALYTICS_EVENTS[event].countsAsUsage, event).toBe(false);
  });

  it("marks automatic page-access and end events as non-interactive", () => {
    expect(ANALYTICS_EVENTS["Studio Opened"].interactive).toBe(false);
    expect(ANALYTICS_EVENTS["Bible Opened"].interactive).toBe(false);
    expect(ANALYTICS_EVENTS["Presentation Ended"].interactive).toBe(false);
  });

  it("recognises only catalog names", () => {
    expect(isAnalyticsEvent("Manuscript Created")).toBe(true);
    expect(isAnalyticsEvent("toString")).toBe(false);
    expect(isAnalyticsEvent("Outbound Link: Click")).toBe(false);
  });
});
