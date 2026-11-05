import { useEffect, useEffectEvent } from "react";
import type { ScripturePassage, SlideDeckDoc } from "../../../types";
import { useSpeech } from "../../../hooks/useSpeech";
import { useStore } from "../../../store/useStore";
import { spokenPassageSlides } from "../../bible/lib/spokenScripture";

interface ReadAloudOptions {
  isScripture: boolean;
  doc: SlideDeckDoc | undefined;
  slideIndex: number;
  goTo: (index: number) => void;
}

const isPassage = (doc: SlideDeckDoc | undefined): doc is ScripturePassage =>
  Boolean(doc && "verses" in doc);

export const useScriptureReadAloud = ({
  isScripture,
  doc,
  slideIndex,
  goTo,
}: ReadAloudOptions) => {
  const speech = useSpeech();
  const readVerseNumbers = useStore((s) => s.prefs.readVerseNumbers);

  const toggleReadAloud = () => {
    if (!isScripture || !isPassage(doc)) return;
    if (speech.speaking) {
      speech.stop();
      return;
    }
    const startIndex = slideIndex;
    speech.speak(
      spokenPassageSlides(doc, readVerseNumbers).slice(startIndex),
      (index) => goTo(startIndex + index),
    );
  };

  const onReadAloudKey = useEffectEvent(toggleReadAloud);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key.toLowerCase() === "r") onReadAloudKey();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return {
    speech,
    canRead: isScripture && speech.supported,
    isReading: speech.speaking,
    toggleReadAloud,
  };
};
