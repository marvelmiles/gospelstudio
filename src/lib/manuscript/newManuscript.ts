import type { Manuscript, ManuscriptFormat, Slide } from "../../types";
import { DEFAULT_COLLECTION } from "../../data/collections";
import { now, uid } from "../id";
import { defaultMaxLines, parseManuscriptSlides } from "../parser";

const UNTITLED_MANUSCRIPT = "Untitled Manuscript";

export const isUntitledManuscript = (title: string): boolean => {
  const trimmed = title.trim();
  return !trimmed || trimmed === UNTITLED_MANUSCRIPT;
};

const STARTER_BODY = "[verse]\nType your text here";

export interface ManuscriptContent {
  title: string;
  author: string;
  collection: string;
  body: string;
  maxLines: number;
  slides: Slide[];
  format?: ManuscriptFormat;
}

export const buildManuscript = (
  themeId: string,
  content: ManuscriptContent,
): Manuscript => {
  const timestamp = now();
  return {
    id: uid(),
    defaultThemeId: themeId,
    defaultBackgroundId: "",
    defaultAudioId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    deleted: false,
    builtIn: false,
    style: {},
    ...content,
  };
};

export const buildNewManuscript = (themeId: string): Manuscript => {
  const maxLines = defaultMaxLines();
  return buildManuscript(themeId, {
    title: UNTITLED_MANUSCRIPT,
    author: "",
    collection: DEFAULT_COLLECTION,
    body: STARTER_BODY,
    maxLines,
    slides: parseManuscriptSlides(STARTER_BODY, { maxLines }),
  });
};
