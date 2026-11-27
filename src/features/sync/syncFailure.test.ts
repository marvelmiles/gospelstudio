import { describe, expect, it } from "vitest";
import { ApiRequestError } from "../../lib/jsonApi";
import {
  isFailureActive,
  itemFailureFor,
  nextRetryDelayMs,
} from "./syncFailure";

const NOW_MS = Date.parse("2026-11-27T10:00:00.000Z");
const MINUTE_MS = 60 * 1000;

const apiError = (status: number, message = "Server said no.") =>
  new ApiRequestError("code", message, status);

describe("sync item failures", () => {
  it("leaves offline, signed-out and busy-server errors to the whole lane", () => {
    for (const status of [0, 401, 408, 429, 503])
      expect(itemFailureFor(apiError(status), NOW_MS)).toBeNull();
  });

  it("leaves a full device to the whole lane", () => {
    const quotaError = new DOMException("full", "QuotaExceededError");
    expect(itemFailureFor(quotaError, NOW_MS)).toBeNull();
  });

  it("sets an item aside for good when the server refuses it", () => {
    const failure = itemFailureFor(
      apiError(413, "Files larger than 512 MB can't be synced."),
      NOW_MS,
    );
    expect(failure).toEqual({
      message: "Files larger than 512 MB can't be synced.",
      failedAt: new Date(NOW_MS).toISOString(),
      retryAt: null,
    });
  });

  it("tries again later when cloud storage is full or the server fails", () => {
    expect(itemFailureFor(apiError(507), NOW_MS)?.retryAt).toBe(
      new Date(NOW_MS + 15 * MINUTE_MS).toISOString(),
    );
    expect(itemFailureFor(apiError(500), NOW_MS)?.retryAt).toBe(
      new Date(NOW_MS + 2 * MINUTE_MS).toISOString(),
    );
  });

  it("treats an unexpected error as about this item and retries it later", () => {
    const failure = itemFailureFor(new TypeError("bad data"), NOW_MS);
    expect(failure?.retryAt).toBe(
      new Date(NOW_MS + 2 * MINUTE_MS).toISOString(),
    );
  });

  it("keeps a failure active until its retry time passes", () => {
    const failure = itemFailureFor(apiError(500), NOW_MS);
    expect(isFailureActive(failure ?? undefined, NOW_MS + MINUTE_MS)).toBe(
      true,
    );
    expect(isFailureActive(failure ?? undefined, NOW_MS + 3 * MINUTE_MS)).toBe(
      false,
    );
    expect(isFailureActive(undefined, NOW_MS)).toBe(false);
  });
});

describe("waking for set-aside items", () => {
  it("waits until the soonest item may be tried again", () => {
    const failures = [507, 500, 413].map(
      (status) => itemFailureFor(apiError(status), NOW_MS) ?? undefined,
    );
    expect(nextRetryDelayMs([...failures, undefined], NOW_MS)).toBe(
      2 * MINUTE_MS,
    );
  });

  it("does not wake for items that only a person can retry, or that are due", () => {
    const permanent = itemFailureFor(apiError(413), NOW_MS) ?? undefined;
    const due = itemFailureFor(apiError(500), NOW_MS) ?? undefined;
    expect(nextRetryDelayMs([permanent], NOW_MS)).toBeNull();
    expect(nextRetryDelayMs([due], NOW_MS + 3 * MINUTE_MS)).toBeNull();
    expect(nextRetryDelayMs([], NOW_MS)).toBeNull();
  });
});
