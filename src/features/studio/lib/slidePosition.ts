export const clampIndex = (index: number, count: number): number =>
  Math.min(Math.max(Math.floor(index), 0), Math.max(count - 1, 0));
