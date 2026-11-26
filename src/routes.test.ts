import { describe, expect, it } from "vitest";
import routes, { isSafeNextPath } from "./routes";

describe("returning after sign in", () => {
  it("accepts pages inside the app", () => {
    expect(isSafeNextPath("/studio")).toBe(true);
    expect(isSafeNextPath(routes.account())).toBe(true);
  });

  it("refuses anything that could leave the app", () => {
    for (const next of [
      null,
      "",
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
    ])
      expect(isSafeNextPath(next)).toBe(false);
  });

  it("carries the page to return to in the sign-in link", () => {
    expect(routes.signIn("/account")).toBe("/sign-in?next=%2Faccount");
    expect(routes.signIn()).toBe("/sign-in");
  });

  it("keeps the page to return to when moving between sign in and sign up", () => {
    expect(routes.signUp("/studio")).toBe("/sign-up?next=%2Fstudio");
    expect(routes.signIn("/")).toBe("/sign-in");
    expect(routes.signUp("/")).toBe("/sign-up");
  });

  it("uses the same reset address the API puts in its emails", () => {
    expect(routes.resetPassword()).toBe("/reset-password");
  });
});
