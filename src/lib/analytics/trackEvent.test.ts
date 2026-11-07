import { beforeEach, describe, expect, it, vi } from "vitest";

const plausible = vi.hoisted(() => ({
  isActive: true,
  sent: [] as { name: string; props: unknown; interactive: boolean }[],
  failSending: false,
}));

vi.mock("./plausible", () => ({
  isPlausibleActive: () => plausible.isActive,
  sendPlausibleEvent: (name: string, props: unknown, interactive: boolean) => {
    if (plausible.failSending) throw new Error("network down");
    plausible.sent.push({ name, props, interactive });
  },
}));

const { analyticsKey, trackEvent } = await import("./trackEvent");
const { endAllSessions, endSession, startSession } =
  await import("./analyticsSessions");

const sentNames = () => plausible.sent.map((event) => event.name);

beforeEach(() => {
  plausible.isActive = true;
  plausible.failSending = false;
  plausible.sent.length = 0;
  endAllSessions();
  plausible.sent.length = 0;
});

describe("trackEvent", () => {
  it("sends one event per created manuscript, so five creations are five occurrences", () => {
    for (let index = 0; index < 5; index += 1)
      trackEvent("Manuscript Created", {
        dedupeKey: analyticsKey("manuscript", `created-${index}`),
      });
    expect(sentNames()).toEqual(Array(5).fill("Manuscript Created"));
  });

  it("counts autosaves of the same manuscript as one edit", () => {
    const key = analyticsKey("manuscript", "autosaved");
    for (let save = 0; save < 20; save += 1)
      trackEvent("Manuscript Edited", { dedupeKey: key });
    expect(sentNames()).toEqual(["Manuscript Edited"]);
  });

  it("does not report edits right after the same manuscript was created", () => {
    const key = analyticsKey("manuscript", "fresh");
    trackEvent("Manuscript Created", { dedupeKey: key });
    trackEvent("Manuscript Edited", { dedupeKey: key });
    expect(sentNames()).toEqual(["Manuscript Created"]);
  });

  it("sends only the approved properties and the catalog's interactive flag", () => {
    trackEvent("Media Uploaded", { props: { kind: "image" } });
    trackEvent("Bible Opened");
    expect(plausible.sent).toEqual([
      { name: "Media Uploaded", props: { kind: "image" }, interactive: true },
      { name: "Bible Opened", props: undefined, interactive: false },
    ]);
  });

  it("sends nothing while analytics is off or opted out", () => {
    plausible.isActive = false;
    trackEvent("Studio Opened");
    expect(plausible.sent).toHaveLength(0);
  });

  it("never throws when sending fails", () => {
    plausible.failSending = true;
    expect(() => trackEvent("Presentation Ended")).not.toThrow();
  });
});

describe("analytics sessions", () => {
  it("starts a session once no matter how often it is asked", () => {
    startSession("presentation", { props: { content: "scripture" } });
    startSession("presentation", { props: { content: "image" } });
    expect(plausible.sent).toEqual([
      {
        name: "Presentation Started",
        props: { content: "scripture" },
        interactive: true,
      },
    ]);
  });

  it("ends only sessions that are open", () => {
    endSession("studio");
    startSession("studio");
    endSession("studio");
    endSession("studio");
    expect(sentNames()).toEqual([
      "Studio Session Started",
      "Studio Session Ended",
    ]);
  });

  it("ends every open session when the page is closing", () => {
    startSession("studio");
    startSession("camera", { props: { method: "one_tap" } });
    plausible.sent.length = 0;
    endAllSessions();
    expect(sentNames().sort()).toEqual([
      "Camera Broadcast Ended",
      "Studio Session Ended",
    ]);
  });
});
