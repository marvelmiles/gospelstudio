import type { ReactNode } from "react";
import { cn } from "../../../lib/utils";
import type { TextAppearance } from "../types/layer";
import { useFitText } from "../hooks/useFitText";
import { panelStyle, typeStyle } from "./textAppearanceStyle";

interface TextPanelProps {
  text: TextAppearance;
  fitKey: string;
  fit?: boolean;
  className?: string;
  children: ReactNode;
}

export const TextPanel = ({
  text,
  fitKey,
  fit = false,
  className,
  children,
}: TextPanelProps) => {
  const { boxRef, contentRef } = useFitText(
    text.fontSize,
    text.padding,
    fit,
    fitKey,
  );

  return (
    <div
      ref={boxRef}
      style={panelStyle(text)}
      className={cn(
        "relative flex size-full flex-col overflow-hidden",
        className,
      )}
    >
      <div
        ref={contentRef}
        style={{
          ...typeStyle(text),
          fontSize: fit ? undefined : text.fontSize,
        }}
        className="w-full break-words"
      >
        {children}
      </div>
    </div>
  );
};
