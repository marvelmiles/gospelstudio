import type { Background, Theme } from "../../types";
import { resolveStyle } from "../../lib/resolve";
import { SlideCanvas } from "../../components/SlideCanvas";
import {
  previewFrameClassName,
  previewStageClassName,
} from "../../components/layout/EditorColumns";
import { THEME_SAMPLE_SLIDE } from "./themeSample";

interface ThemePreviewPanelProps {
  theme: Theme;
  background: Background;
}

export const ThemePreviewPanel = ({
  theme,
  background,
}: ThemePreviewPanelProps) => (
  <div className={previewStageClassName}>
    <div className={previewFrameClassName}>
      <SlideCanvas
        slide={THEME_SAMPLE_SLIDE}
        style={resolveStyle(undefined, undefined, theme)}
        bg={background}
        radius={14}
        playBackground
      />
    </div>

    <div className="mx-auto mt-4.5 flex w-full max-w-205 items-center justify-center gap-1.5 text-center text-[12.5px] text-sub">
      A sample slide, so you can see the theme as the congregation will.
    </div>
  </div>
);
