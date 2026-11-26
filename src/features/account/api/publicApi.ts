import type { z } from "zod";
import {
  ApiRequestError,
  REQUEST_FAILURE_CODES,
  requestJson,
  requestNoContent,
} from "../../../lib/jsonApi";
import { API_SERVER_MISSING_HINT, apiServerUrl } from "../../../lib/apiServer";

const ACCOUNT_SERVICE_NAME = "GospelStudio account service";

export interface ApiCall {
  path: string;
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface JsonApiCall<S extends z.ZodTypeAny> extends ApiCall {
  dataSchema: S;
}

const apiUrl = (path: string): string => {
  const base = apiServerUrl();
  if (!base)
    throw new ApiRequestError(
      REQUEST_FAILURE_CODES.notConfigured,
      "Accounts are not set up on this site yet.",
      0,
    );
  return `${base}${path}`;
};

export const requestOf = ({
  path,
  method = "GET",
  body,
  headers = {},
  signal,
}: ApiCall) => ({
  url: apiUrl(path),
  init: {
    method,
    signal,
    headers: {
      ...(body !== undefined && { "Content-Type": "application/json" }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  },
  serviceName: ACCOUNT_SERVICE_NAME,
  missingServiceHint: API_SERVER_MISSING_HINT,
});

export const callPublicApi = <S extends z.ZodTypeAny>({
  dataSchema,
  ...call
}: JsonApiCall<S>): Promise<z.output<S>> =>
  requestJson({ ...requestOf(call), dataSchema });

export const callPublicApiWithoutContent = (call: ApiCall): Promise<void> =>
  requestNoContent(requestOf(call));
