import { useCallback, useEffect, useRef, useState } from "react";

const speechSupported =
  typeof window !== "undefined" && "speechSynthesis" in window;

const FINISH_CHECK_MS = 500;

const isOwnCancel = (event: SpeechSynthesisErrorEvent): boolean =>
  event.error === "interrupted" || event.error === "canceled";

export const useSpeech = () => {
  const [speaking, setSpeaking] = useState(false);
  const [chunkIndex, setChunkIndex] = useState<number | null>(null);
  const session = useRef(0);
  const queued = useRef<SpeechSynthesisUtterance[]>([]);
  const finishCheck = useRef<number | undefined>(undefined);

  const finish = useCallback(() => {
    window.clearInterval(finishCheck.current);
    queued.current = [];
    setSpeaking(false);
    setChunkIndex(null);
  }, []);

  const stop = useCallback(() => {
    session.current += 1;
    if (speechSupported) window.speechSynthesis.cancel();
    finish();
  }, [finish]);

  const speak = useCallback(
    (chunks: string[], onChunkStart?: (index: number) => void) => {
      if (!speechSupported) return;
      window.speechSynthesis.cancel();
      window.clearInterval(finishCheck.current);
      const id = ++session.current;
      const isCurrent = () => session.current === id;
      const list = chunks
        .map((text, index) => ({ text: text.trim(), index }))
        .filter((chunk) => chunk.text);
      if (!list.length) {
        finish();
        return;
      }

      queued.current = list.map((chunk, position) => {
        const utterance = new SpeechSynthesisUtterance(chunk.text);
        utterance.onstart = () => {
          if (!isCurrent()) return;
          setChunkIndex(chunk.index);
          onChunkStart?.(chunk.index);
        };
        utterance.onerror = (event) => {
          if (isCurrent() && !isOwnCancel(event)) stop();
        };
        if (position === list.length - 1)
          utterance.onend = () => {
            if (isCurrent()) finish();
          };
        return utterance;
      });

      setSpeaking(true);
      for (const utterance of queued.current)
        window.speechSynthesis.speak(utterance);

      finishCheck.current = window.setInterval(() => {
        const synth = window.speechSynthesis;
        if (isCurrent() && !synth.speaking && !synth.pending) finish();
      }, FINISH_CHECK_MS);
    },
    [finish, stop],
  );

  useEffect(() => stop, [stop]);

  return { supported: speechSupported, speaking, chunkIndex, speak, stop };
};
