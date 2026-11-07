import { describe, expect, it } from "vitest";
import { isAuthorizedAdmin } from "./adminAuth";
import { parseServerEnv } from "./serverEnv";

const VALID_ENV = {
  PLAUSIBLE_API_KEY: "server-side-api-key-123456",
  PLAUSIBLE_SITE_ID: "gospelstudio.app",
  ANALYTICS_ADMIN_TOKEN: "a-very-long-admin-token-for-tests-1234567890",
};

describe("server environment", () => {
  it("fills in the Plausible address and the Lagos time zone by default", () => {
    const result = parseServerEnv({
      ...VALID_ENV,
      PLAUSIBLE_API_BASE_URL: "",
      ANALYTICS_TIMEZONE: "",
    });
    expect(result).toEqual({
      ok: true,
      env: {
        ...VALID_ENV,
        PLAUSIBLE_API_BASE_URL: "https://plausible.io",
        ANALYTICS_TIMEZONE: "Africa/Lagos",
      },
    });
  });

  it("names every missing or invalid variable without echoing values", () => {
    const result = parseServerEnv({
      PLAUSIBLE_API_KEY: "short",
      ANALYTICS_ADMIN_TOKEN: "too-short",
      ANALYTICS_TIMEZONE: "Mars/Olympus",
    });
    expect(result).toEqual({
      ok: false,
      invalidVariables: [
        "PLAUSIBLE_API_KEY",
        "PLAUSIBLE_SITE_ID",
        "ANALYTICS_ADMIN_TOKEN",
        "ANALYTICS_TIMEZONE",
      ],
    });
  });
});

describe("admin authorisation", () => {
  it("accepts only the exact bearer token", () => {
    const token = VALID_ENV.ANALYTICS_ADMIN_TOKEN;
    expect(isAuthorizedAdmin(`Bearer ${token}`, token)).toBe(true);
    expect(isAuthorizedAdmin(`Bearer ${token}x`, token)).toBe(false);
    expect(isAuthorizedAdmin(token, token)).toBe(false);
    expect(isAuthorizedAdmin(`Basic ${token}`, token)).toBe(false);
    expect(isAuthorizedAdmin(null, token)).toBe(false);
  });
});
