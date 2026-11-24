import { z } from "zod";

export class ApiRequestError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
    this.status = status;
  }
}

const apiErrorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});

interface JsonRequest<S extends z.ZodTypeAny> {
  url: string;
  init?: RequestInit;
  dataSchema: S;
  serviceName: string;
  missingServiceHint?: string;
}

const DEFAULT_MISSING_SERVICE_HINT = "Check that it is running and try again.";

const isJsonResponse = (response: Response): boolean =>
  response.headers.get("content-type")?.includes("application/json") ?? false;

const readJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const requestJson = async <S extends z.ZodTypeAny>({
  url,
  init = {},
  dataSchema,
  serviceName,
  missingServiceHint = DEFAULT_MISSING_SERVICE_HINT,
}: JsonRequest<S>): Promise<z.output<S>> => {
  let response: Response;
  try {
    response = await fetch(url, {
      cache: "no-store",
      ...init,
      headers: { Accept: "application/json", ...init.headers },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError")
      throw new ApiRequestError(
        "timeout",
        `The ${serviceName} took too long to answer. If it was asleep it may be waking up, so try again in a moment.`,
        0,
      );
    if (init.signal?.aborted) throw error;
    throw new ApiRequestError(
      "network",
      `Couldn't reach the ${serviceName}. Check the connection and try again.`,
      0,
    );
  }

  if (!isJsonResponse(response))
    throw new ApiRequestError(
      "service_missing",
      `The ${serviceName} isn't running at this address. ${missingServiceHint}`,
      response.status,
    );

  const body = await readJson(response);
  if (!response.ok) {
    const parsed = apiErrorSchema.safeParse(body);
    throw parsed.success
      ? new ApiRequestError(
          parsed.data.error.code,
          parsed.data.error.message,
          response.status,
        )
      : new ApiRequestError(
          "unexpected",
          `The ${serviceName} answered with status ${response.status}.`,
          response.status,
        );
  }

  const parsed = z.object({ data: dataSchema }).safeParse(body);
  if (!parsed.success)
    throw new ApiRequestError(
      "invalid_response",
      `The ${serviceName} sent a response this page can't read.`,
      response.status,
    );
  return parsed.data.data;
};
