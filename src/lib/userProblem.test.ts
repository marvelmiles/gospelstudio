import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiRequestError } from "./jsonApi";
import {
  CONNECTION_PROBLEM,
  SLOW_ANSWER_PROBLEM,
  UNEXPECTED_PROBLEM,
  UserFacingError,
  userProblemOf,
} from "./userProblem";

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => consoleError.mockRestore());

const requestError = (code: string, message: string, status = 0) =>
  new ApiRequestError(code, message, status);

describe("user problems", () => {
  it("asks people to check their connection when the service can't be reached", () => {
    expect(
      userProblemOf(requestError("network", "Couldn't reach the service.")),
    ).toEqual(CONNECTION_PROBLEM);
  });

  it("explains a slow answer instead of showing a raw timeout", () => {
    expect(userProblemOf(requestError("timeout", "Timed out."))).toEqual(
      SLOW_ANSWER_PROBLEM,
    );
  });

  it("hides setup details behind a plain message and logs them for developers", () => {
    const missing = requestError(
      "service_missing",
      "The GospelStudio account service isn't running at this address. Check VITE_API_URL and that the GospelStudio API is running.",
      404,
    );
    expect(userProblemOf(missing)).toEqual(UNEXPECTED_PROBLEM);
    expect(userProblemOf(requestError("internal_error", "Boom", 500))).toEqual(
      UNEXPECTED_PROBLEM,
    );
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("Unexpected problem"),
      missing,
    );
  });

  it("shows the server's own explanation for problems people can act on", () => {
    expect(
      userProblemOf(
        requestError(
          "invalid_reset_token",
          "This reset link has expired or was already used. Ask for a new one.",
          400,
        ),
      ),
    ).toEqual({
      message:
        "This reset link has expired or was already used. Ask for a new one.",
      suggestSupport: false,
    });
  });

  it("points to support when email can't be sent", () => {
    expect(
      userProblemOf(
        requestError(
          "email_unavailable",
          "We couldn't send the reset email just now. Wait a few minutes and try again.",
          503,
        ),
      ),
    ).toEqual({
      message:
        "We couldn't send the reset email just now. Wait a few minutes and try again.",
      suggestSupport: true,
    });
  });

  it("keeps messages written for people", () => {
    expect(userProblemOf(new UserFacingError("You're signed out."))).toEqual({
      message: "You're signed out.",
      suggestSupport: false,
    });
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("never shows a raw programming error", () => {
    const crash = new TypeError(
      "Cannot read properties of undefined (reading 'id')",
    );
    expect(userProblemOf(crash)).toEqual(UNEXPECTED_PROBLEM);
    expect(userProblemOf("thrown string")).toEqual(UNEXPECTED_PROBLEM);
    expect(consoleError).toHaveBeenCalledTimes(2);
  });
});
