import type { LowerThirdLayer } from "../types/layer";
import { withOpacity } from "../lib/colors";
import { LayerBackdrop } from "./LayerBackdrop";
import { fontStack, typeStyle } from "./textAppearanceStyle";

const ACCENT_WIDTH = 14;
const SUBTITLE_STRENGTH = 78;

export const LowerThirdElement = ({ layer }: { layer: LowerThirdLayer }) => {
  const { title, subtitle, accent, text, variant } = layer;
  const isBar = variant === "bar";

  return (
    <div
      style={{
        paddingBlock: text.padding,
        paddingInline: text.padding + (isBar ? ACCENT_WIDTH : 0),
        fontFamily: fontStack(text.fontFamily),
      }}
      className="relative flex size-full flex-col justify-center overflow-hidden"
    >
      {isBar && <LayerBackdrop fill={layer.fill} />}
      {isBar && (
        <div
          style={{ background: accent, width: ACCENT_WIDTH }}
          className="absolute inset-y-0 left-0"
        />
      )}
      <div
        style={{ ...typeStyle(text), fontSize: text.fontSize }}
        className="relative truncate leading-[1.15]"
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            ...typeStyle({
              ...text,
              color: isBar
                ? withOpacity(text.color, SUBTITLE_STRENGTH)
                : accent,
            }),
            fontSize: text.fontSize * 0.58,
            fontWeight: 500,
          }}
          className="relative mt-[0.3em] truncate leading-[1.2]"
        >
          {subtitle}
        </div>
      )}
      {!isBar && (
        <div
          style={{ background: accent }}
          className="relative mt-[0.5em] h-1.5 w-[28%] rounded-full"
        />
      )}
    </div>
  );
};
