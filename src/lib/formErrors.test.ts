import { describe, expect, it } from "vitest";
import { z } from "zod";
import { checkForm } from "./formErrors";

const schema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(10, "Too long."),
});

describe("checking a form", () => {
  it("returns the parsed values when everything is valid", () => {
    expect(
      checkForm(schema, { email: "a@b.org", password: "12345678" }),
    ).toEqual({
      valid: true,
      data: { email: "a@b.org", password: "12345678" },
    });
  });

  it("reports the first problem for each field", () => {
    expect(checkForm(schema, { email: "nope", password: "" })).toEqual({
      valid: false,
      errors: {
        email: "Enter a valid email address.",
        password: "Use at least 8 characters.",
      },
    });
  });
});
