import { API_ERROR_CODES } from "@/contracts/apiErrors";
import { APP_NAME } from "../../app.config";
import { ApiRequestError, REQUEST_FAILURE_CODES } from "./jsonApi";

export interface UserProblem {
  message: string;
  suggestSupport: boolean;
}

export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserFacingError";
  }
}

export const CONNECTION_PROBLEM: UserProblem = {
  message: `We couldn't connect to ${APP_NAME}. Check your internet connection and try again.`,
  suggestSupport: false,
};

export const SLOW_ANSWER_PROBLEM: UserProblem = {
  message: `${APP_NAME} is taking longer than usual to answer. Wait a moment, then try again.`,
  suggestSupport: false,
};

export const UNEXPECTED_PROBLEM: UserProblem = {
  message:
    "Something went wrong on our side, so this didn't go through. Try again in a moment.",
  suggestSupport: true,
};

const CODES_FAILING_ON_OUR_SIDE: ReadonlySet<string> = new Set([
  REQUEST_FAILURE_CODES.serviceMissing,
  REQUEST_FAILURE_CODES.unexpectedStatus,
  REQUEST_FAILURE_CODES.invalidResponse,
  API_ERROR_CODES.internalError,
  API_ERROR_CODES.serviceUnavailable,
  API_ERROR_CODES.forbiddenOrigin,
  API_ERROR_CODES.methodNotAllowed,
  API_ERROR_CODES.unsupportedMediaType,
]);

const CODES_NEEDING_SUPPORT: ReadonlySet<string> = new Set([
  API_ERROR_CODES.emailUnavailable,
  REQUEST_FAILURE_CODES.notConfigured,
]);

const logUnexpected = (error: unknown): void =>
  console.error(`[${APP_NAME}] Unexpected problem:`, error);

const problemOfRequest = (error: ApiRequestError): UserProblem => {
  if (error.code === REQUEST_FAILURE_CODES.network) return CONNECTION_PROBLEM;
  if (error.code === REQUEST_FAILURE_CODES.timeout) return SLOW_ANSWER_PROBLEM;
  if (CODES_FAILING_ON_OUR_SIDE.has(error.code)) {
    logUnexpected(error);
    return UNEXPECTED_PROBLEM;
  }
  return {
    message: error.message,
    suggestSupport: CODES_NEEDING_SUPPORT.has(error.code),
  };
};

export const userProblemOf = (error: unknown): UserProblem => {
  if (error instanceof ApiRequestError) return problemOfRequest(error);
  if (error instanceof UserFacingError)
    return { message: error.message, suggestSupport: false };
  logUnexpected(error);
  return UNEXPECTED_PROBLEM;
};
