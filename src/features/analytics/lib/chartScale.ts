const NICE_STEPS = [1, 2, 5, 10];

export const niceTicks = (
  maxValue: number,
  targetTickCount: number,
): number[] => {
  const rawStep = Math.max(1, maxValue / targetTickCount);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step =
    (NICE_STEPS.find((candidate) => candidate * magnitude >= rawStep) ?? 10) *
    magnitude;
  const top = Math.max(step, Math.ceil(maxValue / step) * step);
  const ticks: number[] = [];
  for (let value = 0; value <= top; value += step) ticks.push(value);
  return ticks;
};

export const evenlySpacedIndexes = (
  count: number,
  maxLabels: number,
): number[] => {
  if (count <= 0) return [];
  if (count <= maxLabels)
    return Array.from({ length: count }, (_, index) => index);
  const step = (count - 1) / (maxLabels - 1);
  return Array.from({ length: maxLabels }, (_, index) =>
    Math.round(index * step),
  );
};
