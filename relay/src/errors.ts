import type { RelayErrorCode } from "../../src/features/liveStream/lib/liveRelayContract";

export class RelayError extends Error {
  readonly status: number;
  readonly code: RelayErrorCode;

  constructor(status: number, code: RelayErrorCode, message: string) {
    super(message);
    this.name = "RelayError";
    this.status = status;
    this.code = code;
  }
}

export const sessionNotFound = (): RelayError =>
  new RelayError(
    404,
    "not_found",
    "This live session has ended. Go live again to start a new one.",
  );
