import { ApiRequestError, REQUEST_FAILURE_CODES } from "../../../lib/jsonApi";
import {
  CHURCH_LOGO_CONTENT_TYPES,
  CHURCH_LOGO_FORM_FIELD,
  CHURCH_LOGO_PATH,
  isMissingLogo,
  logoUploadErrorOf,
  logoUploadResponseSchema,
  type ChurchLogo,
} from "../lib/churchLogo";
import {
  callAccountApiWithoutContent,
  sendAccountRequest,
} from "./authorizedApi";

const UPLOAD_TIMEOUT_MS = 60_000;
const DOWNLOAD_ACCEPT = [...CHURCH_LOGO_CONTENT_TYPES, "application/json"].join(
  ", ",
);

const readJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const uploadChurchLogo = async (
  file: File,
): Promise<ChurchLogo | null> => {
  const form = new FormData();
  form.append(CHURCH_LOGO_FORM_FIELD, file);

  let response: Response;
  try {
    response = await sendAccountRequest({
      path: CHURCH_LOGO_PATH,
      method: "PUT",
      body: form,
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
    });
  } catch (error) {
    throw logoUploadErrorOf(error);
  }

  const parsed = logoUploadResponseSchema.safeParse(await readJson(response));
  if (!parsed.success)
    throw new ApiRequestError(
      REQUEST_FAILURE_CODES.invalidResponse,
      "The account service sent a logo answer this page can't read.",
      response.status,
    );
  return parsed.data.data.logo;
};

export const downloadChurchLogo = async (
  signal: AbortSignal,
): Promise<Blob | null> => {
  try {
    const response = await sendAccountRequest({
      path: CHURCH_LOGO_PATH,
      method: "GET",
      headers: { Accept: DOWNLOAD_ACCEPT },
      signal,
    });
    return await response.blob();
  } catch (error) {
    if (isMissingLogo(error)) return null;
    throw error;
  }
};

export const removeChurchLogo = async (): Promise<void> => {
  try {
    await callAccountApiWithoutContent({
      path: CHURCH_LOGO_PATH,
      method: "DELETE",
    });
  } catch (error) {
    if (!isMissingLogo(error)) throw error;
  }
};
