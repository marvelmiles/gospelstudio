import { describe, expect, it } from "vitest";
import { API_ERROR_CODES } from "@/contracts/apiErrors";
import { ApiRequestError, REQUEST_FAILURE_CODES } from "../../../lib/jsonApi";
import { UserFacingError } from "../../../lib/userProblem";
import {
  CHURCH_LOGO_MAX_BYTES,
  CHURCH_LOGO_MESSAGES,
  isMissingLogo,
  logoFileProblem,
  logoUploadErrorOf,
  logoUploadResponseSchema,
} from "./churchLogo";

const fileOf = (type: string, size: number) => ({ type, size });

describe("church logo file check", () => {
  it.each(["image/png", "image/jpeg", "image/webp"])("accepts %s", (type) => {
    expect(logoFileProblem(fileOf(type, 48_213))).toBeNull();
  });

  it("accepts a file of exactly 5 MB", () => {
    expect(
      logoFileProblem(fileOf("image/png", CHURCH_LOGO_MAX_BYTES)),
    ).toBeNull();
    expect(CHURCH_LOGO_MAX_BYTES).toBe(5_242_880);
  });

  it.each(["image/svg+xml", "image/gif", "application/pdf", ""])(
    "refuses %s",
    (type) => {
      expect(logoFileProblem(fileOf(type, 1_000))).toBe(
        CHURCH_LOGO_MESSAGES.wrongType,
      );
    },
  );

  it("refuses a file over 5 MB", () => {
    expect(
      logoFileProblem(fileOf("image/webp", CHURCH_LOGO_MAX_BYTES + 1)),
    ).toBe(CHURCH_LOGO_MESSAGES.tooLarge);
  });

  it("refuses an empty file", () => {
    expect(logoFileProblem(fileOf("image/png", 0))).toBe(
      CHURCH_LOGO_MESSAGES.empty,
    );
  });
});

describe("church logo upload errors", () => {
  it("explains a file the server refused because of its contents", () => {
    const error = logoUploadErrorOf(
      new ApiRequestError(API_ERROR_CODES.unsupportedMediaType, "raw", 415),
    );
    expect(error).toBeInstanceOf(UserFacingError);
    expect((error as UserFacingError).message).toBe(
      CHURCH_LOGO_MESSAGES.wrongType,
    );
  });

  it.each([API_ERROR_CODES.payloadTooLarge, API_ERROR_CODES.fileTooLarge])(
    "explains %s as a size limit",
    (code) => {
      const error = logoUploadErrorOf(new ApiRequestError(code, "raw", 413));
      expect((error as UserFacingError).message).toBe(
        CHURCH_LOGO_MESSAGES.tooLarge,
      );
    },
  );

  it("passes other failures through unchanged", () => {
    const offline = new ApiRequestError(
      REQUEST_FAILURE_CODES.network,
      "offline",
      0,
    );
    expect(logoUploadErrorOf(offline)).toBe(offline);
    const unknown = new Error("boom");
    expect(logoUploadErrorOf(unknown)).toBe(unknown);
  });
});

describe("church logo responses", () => {
  it("reads the account the upload sends back", () => {
    const parsed = logoUploadResponseSchema.parse({
      data: {
        id: "665f1c2e9b3a4d0012ab34cd",
        email: "media@gracechapel.org",
        churchName: "Grace Chapel",
        logo: {
          contentType: "image/png",
          size: 48213,
          updatedAt: "2026-11-27T09:15:42.120Z",
        },
        createdAt: "2026-10-02T14:03:11.000Z",
      },
    });
    expect(parsed.data.logo?.size).toBe(48213);
  });

  it("reads an account without a logo", () => {
    const parsed = logoUploadResponseSchema.parse({
      data: {
        id: "665f1c2e9b3a4d0012ab34cd",
        email: "media@gracechapel.org",
        churchName: "Grace Chapel",
        logo: null,
        createdAt: "2026-10-02T14:03:11.000Z",
      },
    });
    expect(parsed.data.logo).toBeNull();
  });

  it("treats not_found as a church with no logo yet", () => {
    expect(
      isMissingLogo(
        new ApiRequestError(API_ERROR_CODES.notFound, "No logo", 404),
      ),
    ).toBe(true);
    expect(
      isMissingLogo(
        new ApiRequestError(API_ERROR_CODES.internalError, "boom", 500),
      ),
    ).toBe(false);
  });
});
