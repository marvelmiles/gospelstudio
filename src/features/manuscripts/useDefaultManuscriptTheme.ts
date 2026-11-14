import type { Theme } from "../../types";
import { DEFAULT_MANUSCRIPT_THEME_ID } from "../../data/themes";
import { useStore } from "../../store/useStore";

export const useDefaultManuscriptThemeId = (): string =>
  useStore(
    (s) => s.prefs.defaultManuscriptThemeId || DEFAULT_MANUSCRIPT_THEME_ID,
  );

export const useDefaultManuscriptTheme = (): Theme | undefined => {
  const themeId = useDefaultManuscriptThemeId();
  return useStore(
    (s) => s.themes.find((theme) => theme.id === themeId) ?? s.themes[0],
  );
};
