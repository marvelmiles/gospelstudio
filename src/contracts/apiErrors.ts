export const API_ERROR_CODES = {
  invalidRequest: "invalid_request",
  notFound: "not_found",
  methodNotAllowed: "method_not_allowed",
  forbiddenOrigin: "forbidden_origin",
  rateLimited: "rate_limited",
  payloadTooLarge: "payload_too_large",
  unsupportedMediaType: "unsupported_media_type",
  internalError: "internal_error",
  unauthorized: "unauthorized",
  invalidCredentials: "invalid_credentials",
  tooManyAttempts: "too_many_attempts",
  sessionExpired: "session_expired",
  tokenRotated: "token_rotated",
  incorrectPassword: "incorrect_password",
  emailTaken: "email_taken",
  invalidResetToken: "invalid_reset_token",
  emailUnavailable: "email_unavailable",
  recordTooLarge: "record_too_large",
  fileTooLarge: "file_too_large",
  storageFull: "storage_full",
  syncBusy: "sync_busy",
  serviceUnavailable: "service_unavailable",
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];
