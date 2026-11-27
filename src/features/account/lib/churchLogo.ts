import { z } from "zod";
import { API_ERROR_CODES } from "@/contracts/apiErrors";
import { accountSchema } from "@/contracts/accountContract";
import { ApiRequestError } from "../../../lib/jsonApi";
import { UserFacingError } from "../../../lib/userProblem";

export const CHURCH_LOGO_PATH = "/v1/account/logo";
export const CHURCH_LOGO_FORM_FIELD = "logo";

const CHURCH_LOGO_MAX_MEGABYTES = 5;
export const CHURCH_LOGO_MAX_BYTES = CHURCH_LOGO_MAX_MEGABYTES * 1024 * 1024;

export const CHURCH_LOGO_CONTENT_TYPES: readonly string[] = [
  "image/png",
  "image/jpeg",
  "image/webp",
];

export const CHURCH_LOGO_ACCEPT = CHURCH_LOGO_CONTENT_TYPES.join(",");
export const CHURCH_LOGO_RULES = `PNG, JPEG or WebP, up to ${CHURCH_LOGO_MAX_MEGABYTES} MB.`;

export const CHURCH_LOGO_MESSAGES = {
  wrongType: "Choose a PNG, JPEG or WebP image.",
  tooLarge: `Choose an image up to ${CHURCH_LOGO_MAX_MEGABYTES} MB.`,
  empty: "That file is empty. Choose another image.",
} as const;

const churchLogoSchema = z.object({
  contentType: z.string(),
  size: z.number().int().min(0),
  updatedAt: z.string(),
});

export type ChurchLogo = z.infer<typeof churchLogoSchema>;

export const logoUploadResponseSchema = z.object({
  data: accountSchema.extend({ logo: churchLogoSchema.nullable() }),
});

export const logoFileProblem = ({
  type,
  size,
}: Pick<Blob, "type" | "size">): string | null => {
  if (!CHURCH_LOGO_CONTENT_TYPES.includes(type))
    return CHURCH_LOGO_MESSAGES.wrongType;
  if (size === 0) return CHURCH_LOGO_MESSAGES.empty;
  if (size > CHURCH_LOGO_MAX_BYTES) return CHURCH_LOGO_MESSAGES.tooLarge;
  return null;
};

const FILE_REJECTION_MESSAGES: Readonly<Record<string, string>> = {
  [API_ERROR_CODES.unsupportedMediaType]: CHURCH_LOGO_MESSAGES.wrongType,
  [API_ERROR_CODES.payloadTooLarge]: CHURCH_LOGO_MESSAGES.tooLarge,
  [API_ERROR_CODES.fileTooLarge]: CHURCH_LOGO_MESSAGES.tooLarge,
};

export const logoUploadErrorOf = (error: unknown): unknown => {
  if (!(error instanceof ApiRequestError)) return error;
  const message = FILE_REJECTION_MESSAGES[error.code];
  return message ? new UserFacingError(message) : error;
};

export const isMissingLogo = (error: unknown): boolean =>
  error instanceof ApiRequestError && error.code === API_ERROR_CODES.notFound;
