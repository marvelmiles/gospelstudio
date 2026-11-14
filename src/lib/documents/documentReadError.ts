export type DocumentReadFailure =
  | "unsupported"
  | "empty"
  | "protected"
  | "outdated"
  | "too-large"
  | "unreadable";

export class DocumentReadError extends Error {
  readonly failure: DocumentReadFailure;

  constructor(failure: DocumentReadFailure) {
    super(`Document could not be read: ${failure}`);
    this.name = "DocumentReadError";
    this.failure = failure;
  }
}

export const documentReadFailureOf = (error: unknown): DocumentReadFailure =>
  error instanceof DocumentReadError ? error.failure : "unreadable";
