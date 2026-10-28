interface RecentOptions<T> {
  limit?: number;
  createdAt: (item: T) => string | undefined;
  keep?: (item: T) => boolean;
}

export const mostRecent = <T>(
  items: T[],
  { limit, createdAt, keep }: RecentOptions<T>,
): T[] => {
  const ordered = [...items].sort((a, b) =>
    (createdAt(b) ?? "").localeCompare(createdAt(a) ?? ""),
  );
  if (limit === undefined || ordered.length <= limit) return ordered;

  const kept = keep ? ordered.filter(keep) : [];
  const room = Math.max(0, limit - kept.length);
  const shown = new Set([
    ...kept,
    ...ordered.filter((item) => !kept.includes(item)).slice(0, room),
  ]);
  return ordered.filter((item) => shown.has(item));
};
