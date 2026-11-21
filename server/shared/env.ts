import { z } from "zod";

export const emptyAsMissing = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema);

export type EnvResult<T> =
  { ok: true; env: T } | { ok: false; invalidVariables: string[] };

export const parseEnvWith = <T extends z.ZodTypeAny>(
  schema: T,
  source: Record<string, string | undefined>,
): EnvResult<z.infer<T>> => {
  const result = schema.safeParse(source);
  if (result.success) return { ok: true, env: result.data };
  return {
    ok: false,
    invalidVariables: [
      ...new Set(result.error.issues.map((issue) => String(issue.path[0]))),
    ],
  };
};
