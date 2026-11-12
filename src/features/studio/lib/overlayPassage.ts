import type { ScripturePassage, TextStyle } from "../../../types";
import { uid } from "../../../lib/id";
import {
  buildScripturePassage,
  rebuildPassage,
  type ScriptureSelection,
} from "../../bible/lib/scripturePassage";

export const PSALM_119_105: ScriptureSelection = {
  version: "KJV",
  range: {
    bookId: 19,
    bookName: "Psalms",
    chapter: 119,
    verseStart: 105,
    verseEnd: 105,
  },
  verses: [
    {
      v: 105,
      t: "Thy word is a lamp unto my feet, and a light unto my path.",
    },
  ],
};

export const JOHN_3_16: ScriptureSelection = {
  version: "KJV",
  range: {
    bookId: 43,
    bookName: "John",
    chapter: 3,
    verseStart: 16,
    verseEnd: 16,
  },
  verses: [
    {
      v: 16,
      t: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
    },
  ],
};

export const OVERLAY_PASSAGE_STYLE: TextStyle = {
  fontFamily: "Fraunces",
  fontWeight: 500,
  fontSize: 3.5,
  lineHeight: 1.34,
  letterSpacing: 0,
  color: "#ffffff",
  align: "left",
  verticalAlign: "bottom",
  uppercase: false,
  textShadow: "0 1px 14px rgba(0, 0, 0, 0.55)",
};

interface OverlayPassageOptions {
  sample?: ScriptureSelection;
  style?: TextStyle;
}

export const overlayPassage = ({
  sample = PSALM_119_105,
  style = OVERLAY_PASSAGE_STYLE,
}: OverlayPassageOptions = {}): ScripturePassage => {
  const passage = buildScripturePassage(
    {
      ...sample,
      versesPerSlide: 1,
      showVerseNumbers: false,
      showReference: true,
    },
    uid(),
    false,
  );
  return rebuildPassage({ ...passage, style }, {}, { splitLongVerses: true });
};
