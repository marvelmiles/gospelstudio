import { describe, expect, it } from "vitest";
import { parseEnvValues } from "./env";

const FIREBASE = {
  VITE_FIREBASE_API_KEY: "AIza-test-key",
  VITE_FIREBASE_PROJECT_ID: "gospel-studio",
  VITE_FIREBASE_APP_ID: "1:2:web:3",
  VITE_FIREBASE_DATABASE_URL:
    "https://gospel-studio-default-rtdb.firebaseio.com",
};

describe("environment variables", () => {
  it("keeps the Firebase settings when another variable is invalid", () => {
    const { values, invalidFields } = parseEnvValues({
      ...FIREBASE,
      VITE_PLAUSIBLE_DOMAIN: "localhost",
      VITE_LIVE_RELAY_URL: "not a url",
    });
    expect(values).toMatchObject(FIREBASE);
    expect(invalidFields).toEqual([
      "VITE_PLAUSIBLE_DOMAIN",
      "VITE_LIVE_RELAY_URL",
    ]);
  });

  it("treats empty values as not set rather than invalid", () => {
    const { values, invalidFields } = parseEnvValues({
      ...FIREBASE,
      VITE_LIVE_RELAY_URL: "",
      VITE_PLAUSIBLE_API_BASE_URL: "   ",
    });
    expect(invalidFields).toEqual([]);
    expect(values.VITE_LIVE_RELAY_URL).toBeUndefined();
    expect(values.VITE_FIREBASE_API_KEY).toBe(FIREBASE.VITE_FIREBASE_API_KEY);
  });

  it("trims stray spaces around values", () => {
    expect(
      parseEnvValues({ VITE_LIVE_RELAY_URL: " https://live.example.com " })
        .values,
    ).toEqual({ VITE_LIVE_RELAY_URL: "https://live.example.com" });
  });

  it("ignores variables it does not know", () => {
    expect(parseEnvValues({ SOMETHING_ELSE: "x" })).toEqual({
      values: {},
      invalidFields: [],
    });
  });
});
