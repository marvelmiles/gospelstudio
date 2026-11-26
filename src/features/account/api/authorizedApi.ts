import type { z } from "zod";
import {
  ApiRequestError,
  failureOf,
  requestJson,
  requestNoContent,
  sendServiceRequest,
} from "../../../lib/jsonApi";
import {
  SignedOutError,
  accessTokenFor,
  endLocalSession,
  forgetAccessToken,
} from "../session/sessionManager";
import { requestOf, type ApiCall, type JsonApiCall } from "./publicApi";

export interface RawApiCall {
  path: string;
  method: string;
  headers?: Record<string, string>;
  body?: BodyInit;
  signal?: AbortSignal;
}

const isUnauthorized = (error: unknown): boolean =>
  error instanceof ApiRequestError && error.status === 401;

/* A 401 can mean the access token expired a moment early, so the call is retried once with a renewed token before the session counts as ended. */
const withAccessToken = async <T>(
  send: (token: string) => Promise<T>,
): Promise<T> => {
  try {
    return await send(await accessTokenFor());
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
  }
  forgetAccessToken();
  try {
    return await send(await accessTokenFor());
  } catch (error) {
    if (!isUnauthorized(error)) throw error;
    await endLocalSession("expired");
    throw new SignedOutError();
  }
};

const withAuthorization = (
  token: string,
  headers: Record<string, string> = {},
): Record<string, string> => ({ ...headers, Authorization: `Bearer ${token}` });

export const callAccountApi = <S extends z.ZodTypeAny>({
  dataSchema,
  headers,
  ...call
}: JsonApiCall<S>): Promise<z.output<S>> =>
  withAccessToken((token) =>
    requestJson({
      ...requestOf({ ...call, headers: withAuthorization(token, headers) }),
      dataSchema,
    }),
  );

export const callAccountApiWithoutContent = ({
  headers,
  ...call
}: ApiCall): Promise<void> =>
  withAccessToken((token) =>
    requestNoContent(
      requestOf({ ...call, headers: withAuthorization(token, headers) }),
    ),
  );

export const sendAccountRequest = ({
  path,
  method,
  headers,
  body,
  signal,
}: RawApiCall): Promise<Response> =>
  withAccessToken(async (token) => {
    const base = requestOf({ path });
    const request = {
      ...base,
      init: {
        method,
        body,
        signal,
        headers: withAuthorization(token, headers),
      },
    };
    const response = await sendServiceRequest(request);
    if (!response.ok) throw await failureOf(request, response);
    return response;
  });
