import type { Manuscript } from "../../types";
import { DEFAULT_COLLECTION } from "../../data/collections";
import { now, uid } from "../id";
import { defaultMaxLines, parseManuscriptSlides } from "../parser";

const UNTITLED_MANUSCRIPT = "Untitled Manuscript";

export const isUntitledManuscript = (title: string): boolean => {
  const trimmed = title.trim();
  return !trimmed || trimmed === UNTITLED_MANUSCRIPT;
};

const STARTER_BODY = "[verse]\nType your text here";

export const buildNewManuscript = (themeId: string): Manuscript => {
  const timestamp = now();
  const maxLines = defaultMaxLines();
  return {
    id: uid(),
    title: UNTITLED_MANUSCRIPT,
    author: "",
    collection: DEFAULT_COLLECTION,
    defaultThemeId: themeId,
    defaultBackgroundId: "",
    defaultAudioId: null,
    body: STARTER_BODY,
    maxLines,
    createdAt: timestamp,
    updatedAt: timestamp,
    deleted: false,
    builtIn: false,
    style: {},
    slides: parseManuscriptSlides(STARTER_BODY, { maxLines }),
  };
};
