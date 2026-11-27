import { isQuotaError } from "../../lib/fileStore";
import { ApiRequestError } from "../../lib/jsonApi";

export interface SyncFailure {
  message: string;
  failedAt: string;
  retryAt: string | null;
}

const STORAGE_FULL_STATUS = 507;
const SERVER_ERROR_STATUS = 500;
const CLIENT_ERROR_STATUS = 400;
const STORAGE_FULL_RETRY_MS = 15 * 60 * 1000;
const SERVER_ERROR_RETRY_MS = 2 * 60 * 1000;

/* These say nothing about the item itself: the device is offline, signed out, or the server is busy, so the whole lane waits and retries instead. */
const WHOLE_LANE_STATUSES: ReadonlySet<number> = new Set([
  0, 401, 408, 429, 503,
]);

const UNEXPECTED_ITEM_MESSAGE =
  "Something went wrong while syncing this item. It will try again shortly.";

const failure = (
  message: string,
  nowMs: number,
  retryAfterMs: number | null,
): SyncFailure => ({
  message,
  failedAt: new Date(nowMs).toISOString(),
  retryAt:
    retryAfterMs === null ? null : new Date(nowMs + retryAfterMs).toISOString(),
});

export const permanentFailure = (message: string, nowMs: number): SyncFailure =>
  failure(message, nowMs, null);

/* Returns null when the error is not about this one item, so the caller stops the lane rather than setting the item aside. */
export const itemFailureFor = (
  error: unknown,
  nowMs: number,
): SyncFailure | null => {
  if (isQuotaError(error)) return null;
  if (!(error instanceof ApiRequestError))
    return failure(UNEXPECTED_ITEM_MESSAGE, nowMs, SERVER_ERROR_RETRY_MS);
  if (WHOLE_LANE_STATUSES.has(error.status)) return null;
  if (error.status === STORAGE_FULL_STATUS)
    return failure(error.message, nowMs, STORAGE_FULL_RETRY_MS);
  if (error.status >= SERVER_ERROR_STATUS || error.status < CLIENT_ERROR_STATUS)
    return failure(error.message, nowMs, SERVER_ERROR_RETRY_MS);
  return failure(error.message, nowMs, null);
};

/* How long until the soonest set-aside item may be tried again, so the lane wakes exactly then instead of checking on a timer. */
export const nextRetryDelayMs = (
  failures: readonly (SyncFailure | undefined)[],
  nowMs: number,
): number | null => {
  let soonestMs: number | null = null;
  for (const failure of failures) {
    if (!failure?.retryAt) continue;
    const retryAtMs = Date.parse(failure.retryAt);
    if (retryAtMs <= nowMs) continue;
    soonestMs = soonestMs === null ? retryAtMs : Math.min(soonestMs, retryAtMs);
  }
  return soonestMs === null ? null : soonestMs - nowMs;
};

export const isFailureActive = (
  itemFailure: SyncFailure | undefined,
  nowMs: number,
): boolean =>
  itemFailure !== undefined &&
  (itemFailure.retryAt === null || Date.parse(itemFailure.retryAt) > nowMs);
