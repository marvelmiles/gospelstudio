const MIN_SHOWN_DECIMALS = 2;

const decimalsOf = (step: number): number => {
  const [, fraction = ""] = String(step).split(".");
  return fraction.length;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const roundForStep = (value: number, step: number): number =>
  Number(value.toFixed(Math.max(MIN_SHOWN_DECIMALS, decimalsOf(step))));

export const readTypedNumber = (
  raw: string,
  min: number,
  max: number,
): number | null => {
  const parsed = Number.parseFloat(raw.trim());
  return Number.isFinite(parsed) ? clamp(parsed, min, max) : null;
};

export const steppedNumber = (
  value: number,
  delta: number,
  min: number,
  max: number,
): number => clamp(value + delta, min, max);
