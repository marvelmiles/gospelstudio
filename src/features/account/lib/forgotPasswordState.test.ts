import { describe, expect, it } from "vitest";
import {
  emailFromForgotPasswordState,
  forgotPasswordStateOf,
} from "./forgotPasswordState";

describe("forgot password state", () => {
  it("carries the email typed on the sign-in page", () => {
    const state = forgotPasswordStateOf("  media@gracechapel.org ");
    expect(emailFromForgotPasswordState(state)).toBe("media@gracechapel.org");
  });

  it("starts empty when the page was opened without a usable email", () => {
    expect(emailFromForgotPasswordState(undefined)).toBe("");
    expect(emailFromForgotPasswordState(null)).toBe("");
    expect(emailFromForgotPasswordState({ email: 42 })).toBe("");
    expect(emailFromForgotPasswordState({ email: "a".repeat(300) })).toBe("");
  });
});
