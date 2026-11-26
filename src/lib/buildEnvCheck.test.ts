import { describe, expect, it } from "vitest";
import { checkBuildEnv, formatBuildEnvErrors } from "./buildEnvCheck";

const RELAY_URL = "https://relay.example.com";
const API_URL = "https://api.example.com";

describe("build environment check", () => {
  it("passes a build with valid relay and API addresses", () => {
    expect(
      checkBuildEnv({
        VITE_RELAY_SERVER_URL: RELAY_URL,
        VITE_API_URL: API_URL,
      }),
    ).toEqual({
      errors: [],
      warnings: [],
    });
  });

  it("stops a build that only has the previous relay variable name", () => {
    const { errors, warnings } = checkBuildEnv({
      VITE_LIVE_RELAY_URL: RELAY_URL,
      VITE_API_URL: API_URL,
    });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain(
      "VITE_LIVE_RELAY_URL was renamed to VITE_RELAY_SERVER_URL",
    );
    expect(warnings).toEqual([]);
  });

  it("only warns when both the previous and the current name are set", () => {
    const { errors, warnings } = checkBuildEnv({
      VITE_LIVE_RELAY_URL: RELAY_URL,
      VITE_RELAY_SERVER_URL: RELAY_URL,
      VITE_API_URL: API_URL,
    });
    expect(errors).toEqual([]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("VITE_LIVE_RELAY_URL is no longer read");
  });

  it("stops a build with an invalid value and reports it once", () => {
    const { errors, warnings } = checkBuildEnv({
      VITE_LIVE_RELAY_URL: RELAY_URL,
      VITE_RELAY_SERVER_URL: "gospelstudio.onrender.com",
      VITE_API_URL: API_URL,
    });
    expect(errors).toEqual([
      "VITE_RELAY_SERVER_URL is set but its value is not valid.",
    ]);
    expect(warnings).toEqual([]);
  });

  it("warns that streaming is off when the relay address is missing", () => {
    const { errors, warnings } = checkBuildEnv({ VITE_API_URL: API_URL });
    expect(errors).toEqual([]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("VITE_RELAY_SERVER_URL is not set");
  });

  it("warns that accounts are off when the API address is missing", () => {
    const { errors, warnings } = checkBuildEnv({
      VITE_RELAY_SERVER_URL: RELAY_URL,
    });
    expect(errors).toEqual([]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("VITE_API_URL is not set");
  });

  it("lists every error in the build failure message", () => {
    const message = formatBuildEnvErrors(["First problem.", "Second problem."]);
    expect(message).toContain("  - First problem.");
    expect(message).toContain("  - Second problem.");
  });
});
