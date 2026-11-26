import { describe, expect, it } from "vitest";
import {
  churchNameSchema,
  emailSchema,
  newPasswordSchema,
} from "./accountContract";
import { refreshTokenSchema, passwordResetLink } from "./authContract";

describe("account contract", () => {
  it("trims and lowercases email addresses", () => {
    expect(emailSchema.parse("  Media@GraceChapel.ORG ")).toBe(
      "media@gracechapel.org",
    );
    expect(emailSchema.safeParse("not an email").success).toBe(false);
  });

  it("asks for passwords of a sensible length", () => {
    expect(newPasswordSchema.safeParse("short").success).toBe(false);
    expect(newPasswordSchema.safeParse("long enough").success).toBe(true);
    expect(newPasswordSchema.safeParse("x".repeat(129)).success).toBe(false);
  });

  it("requires a church or ministry name", () => {
    expect(churchNameSchema.parse("  Grace Chapel  ")).toBe("Grace Chapel");
    expect(churchNameSchema.safeParse("   ").success).toBe(false);
  });

  it("accepts only well formed session tokens", () => {
    const token = `${"a".repeat(24)}.${"b".repeat(43)}`;
    expect(refreshTokenSchema.safeParse(token).success).toBe(true);
    expect(refreshTokenSchema.safeParse(`${token}x`).success).toBe(false);
  });

  it("puts the reset token in the link fragment so it never reaches a server log", () => {
    expect(passwordResetLink("https://gospelstudio.app", "abc")).toBe(
      "https://gospelstudio.app/reset-password#token=abc",
    );
  });
});
