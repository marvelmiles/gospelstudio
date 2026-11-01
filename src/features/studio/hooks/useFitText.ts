import { useLayoutEffect, useRef } from "react";

const MIN_FIT_SCALE = 0.4;
const FIT_PASSES = 6;

export const useFitText = (
  fontSize: number,
  padding: number,
  enabled: boolean,
  fitKey: string,
) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const content = contentRef.current;
    if (!enabled || !box || !content) return;
    const available = box.clientHeight - padding * 2;
    let scale = 1;
    content.style.fontSize = `${fontSize}px`;
    for (let pass = 0; pass < FIT_PASSES; pass += 1) {
      const needed = content.scrollHeight;
      if (available <= 0 || needed <= available + 1) break;
      scale = Math.max(MIN_FIT_SCALE, scale * (available / needed) * 0.98);
      content.style.fontSize = `${fontSize * scale}px`;
      if (scale === MIN_FIT_SCALE) break;
    }
  }, [fontSize, padding, enabled, fitKey]);

  return { boxRef, contentRef };
};
