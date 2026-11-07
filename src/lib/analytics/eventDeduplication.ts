const MAX_REMEMBERED_KEYS = 500;

type OccurrenceCheck = (key: string) => boolean;

export const createOccurrenceCheck = (
  windowMs: number,
  now: () => number = Date.now,
): OccurrenceCheck => {
  const lastSentAt = new Map<string, number>();

  const forgetExpired = (at: number): void => {
    for (const [key, sentAt] of lastSentAt)
      if (at - sentAt >= windowMs) lastSentAt.delete(key);
  };

  return (key) => {
    const at = now();
    const previous = lastSentAt.get(key);
    if (previous !== undefined && at - previous < windowMs) return false;
    lastSentAt.set(key, at);
    if (lastSentAt.size > MAX_REMEMBERED_KEYS) forgetExpired(at);
    return true;
  };
};
