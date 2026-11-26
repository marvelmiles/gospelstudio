import { describe, expect, it } from "vitest";
import type { Prefs } from "../../types";
import { DEFAULT_PREFS } from "../../store/slices/prefsSlice";
import { mergeRemotePrefs, parseRemoteRecord } from "./remoteRecords";

const theme = {
  id: "warm",
  name: "Warm",
  fontFamily: "Inter",
  fontWeight: 600,
  color: "#ffffff",
  align: "center",
  lineHeight: 1.3,
  letterSpacing: 0,
  fontSize: 64,
  uppercase: false,
  textShadow: "none",
  backgroundId: "bg-dawn",
};

describe("records from the account", () => {
  it("keeps a valid theme, including fields added by newer versions", () => {
    expect(parseRemoteRecord("themes", { ...theme, futureField: 1 })).toEqual({
      ...theme,
      futureField: 1,
    });
  });

  it("refuses records that are missing what the app needs", () => {
    const { fontFamily: _missing, ...broken } = theme;
    expect(parseRemoteRecord("themes", broken)).toBeNull();
    expect(parseRemoteRecord("manuscripts", "not a record")).toBeNull();
    expect(
      parseRemoteRecord("productions", { id: "p", name: "P", scenes: [] }),
    ).toBeNull();
  });

  it("fills in what an older device left out of a manuscript", () => {
    const manuscript = parseRemoteRecord("manuscripts", {
      id: "song-1",
      title: "Amazing Grace",
      body: "Amazing grace, how sweet the sound",
      slides: [],
      defaultThemeId: "classic",
      createdAt: "2026-11-01T10:00:00.000Z",
      updatedAt: "2026-11-02T10:00:00.000Z",
    });
    expect(manuscript).toMatchObject({
      id: "song-1",
      deleted: false,
      updatedAt: "2026-11-02T10:00:00.000Z",
    });
  });
});

describe("settings from the account", () => {
  const local: Prefs = {
    ...DEFAULT_PREFS,
    onboarded: true,
    hymnalVersion: 7,
    transitionDuration: 300,
  };

  it("takes shared settings but keeps what belongs to this device", () => {
    const merged = mergeRemotePrefs(local, {
      ...DEFAULT_PREFS,
      transition: "zoom",
      transitionDuration: 900,
      onboarded: false,
      hymnalVersion: 1,
    });
    expect(merged).toMatchObject({
      transition: "zoom",
      transitionDuration: 900,
      onboarded: true,
      hymnalVersion: 7,
      id: "app",
    });
  });

  it("falls back to a supported Bible version", () => {
    const merged = mergeRemotePrefs(local, {
      transition: "fade",
      bibleVersion: "NOT-A-VERSION",
    });
    expect(merged?.bibleVersion).toBe(DEFAULT_PREFS.bibleVersion);
  });
});
