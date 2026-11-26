import type { z } from "zod";

export type FieldErrors = Record<string, string>;

export type FormCheck<T> =
  { valid: true; data: T } | { valid: false; errors: FieldErrors };

export const checkForm = <S extends z.ZodTypeAny>(
  schema: S,
  values: unknown,
): FormCheck<z.output<S>> => {
  const parsed = schema.safeParse(values);
  if (parsed.success) return { valid: true, data: parsed.data };
  const errors: FieldErrors = {};
  for (const issue of parsed.error.issues) {
    const field = String(issue.path[0] ?? "form");
    errors[field] ??= issue.message;
  }
  return { valid: false, errors };
};
