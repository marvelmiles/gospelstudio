import type { z } from "zod";

const STORAGE_PREFIX = "gospelstudio:";

export const readDeviceSetting = <S extends z.ZodTypeAny>(
  name: string,
  schema: S,
  fallback: z.output<S>,
): z.output<S> => {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${name}`);
    if (raw === null) return fallback;
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : fallback;
  } catch {
    return fallback;
  }
};

export const writeDeviceSetting = (name: string, value: unknown): void => {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${name}`, JSON.stringify(value));
  } catch {}
};
