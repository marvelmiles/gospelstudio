import { describe, expect, it } from "vitest";
import { parseEnvValues, renamedEnvFieldsIn } from "./envSchema";

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
      VITE_RELAY_SERVER_URL: "not a url",
    });
    expect(values).toMatchObject(FIREBASE);
    expect(invalidFields).toEqual([
      "VITE_PLAUSIBLE_DOMAIN",
      "VITE_RELAY_SERVER_URL",
    ]);
  });

  it("treats empty values as not set rather than invalid", () => {
    const { values, invalidFields } = parseEnvValues({
      ...FIREBASE,
      VITE_RELAY_SERVER_URL: "",
      VITE_PLAUSIBLE_API_BASE_URL: "   ",
    });
    expect(invalidFields).toEqual([]);
    expect(values.VITE_RELAY_SERVER_URL).toBeUndefined();
    expect(values.VITE_FIREBASE_API_KEY).toBe(FIREBASE.VITE_FIREBASE_API_KEY);
  });

  it("trims stray spaces around values", () => {
    expect(
      parseEnvValues({ VITE_RELAY_SERVER_URL: " https://live.example.com " })
        .values,
    ).toEqual({ VITE_RELAY_SERVER_URL: "https://live.example.com" });
  });

  it("ignores variables it does not know", () => {
    expect(parseEnvValues({ SOMETHING_ELSE: "x" })).toEqual({
      values: {},
      invalidFields: [],
    });
  });
});

describe("renamed environment variables", () => {
  it("names the replacement for a previous name that is still set", () => {
    expect(
      renamedEnvFieldsIn({ VITE_LIVE_RELAY_URL: "https://live.example.com" }),
    ).toEqual([
      {
        previousName: "VITE_LIVE_RELAY_URL",
        currentName: "VITE_RELAY_SERVER_URL",
      },
    ]);
  });

  it("ignores previous names that are empty or not set", () => {
    expect(renamedEnvFieldsIn({ VITE_LIVE_RELAY_URL: "  " })).toEqual([]);
    expect(renamedEnvFieldsIn({})).toEqual([]);
  });
});
