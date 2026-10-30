export const nextSlideIndex = (
  index: number,
  count: number,
  loop: boolean,
): number | null => {
  if (index + 1 < count) return index + 1;
  return loop && count > 1 ? 0 : null;
};

export const neighborSlideIndex = (
  index: number,
  offset: number,
  count: number,
  loop: boolean,
): number | null => {
  const target = index + offset;
  if (target >= 0 && target < count) return target;
  if (!loop || count < 2) return null;
  return ((target % count) + count) % count;
};
