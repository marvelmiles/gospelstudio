import type { Theme } from "../../types";
import { builtInTheme } from "../../data/themes";

export const themeDefaults = (theme: Theme): Theme | null => {
  const shipped = builtInTheme(theme.id);
  if (!shipped) return null;
  return {
    ...shipped,
    createdAt: theme.createdAt,
    updatedAt: theme.updatedAt,
    keepOnReset: theme.keepOnReset,
    mark: theme.mark,
  };
};

export const sameTheme = (a: Theme, b: Theme): boolean => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<
    keyof Theme
  >;
  for (const key of keys) if (a[key] !== b[key]) return false;
  return true;
};
