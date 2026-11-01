import { MarqueeTrack } from "@/components/shared/MarqueeTrack";
import type { AnnouncementLayer } from "../types/layer";
import { LayerBackdrop } from "./LayerBackdrop";
import { fontStack } from "./textAppearanceStyle";
import { TextPanel } from "./TextPanel";

const ACCENT_BAR_HEIGHT = 14;

export const AnnouncementElement = ({ layer }: { layer: AnnouncementLayer }) =>
  layer.variant === "ticker" ? (
    <AnnouncementTicker layer={layer} />
  ) : (
    <AnnouncementCard layer={layer} />
  );

const AnnouncementCard = ({ layer }: { layer: AnnouncementLayer }) => {
  const { heading, body, detail, accent, text } = layer;
  const fitKey = `${heading}:${body}:${detail}:${layer.dimensions.width}x${layer.dimensions.height}`;

  return (
    <div className="relative size-full">
      <LayerBackdrop fill={layer.fill} />
      <div
        style={{ background: accent, height: ACCENT_BAR_HEIGHT }}
        className="absolute inset-x-0 top-0 z-1"
      />
      <TextPanel text={text} fit fitKey={fitKey}>
        {heading && (
          <div className="mb-[0.45em] text-[1.75em] leading-[1.1] font-extrabold">
            {heading}
          </div>
        )}
        {body && <div className="whitespace-pre-wrap">{body}</div>}
        {detail && (
          <div
            style={{ color: accent }}
            className="mt-[0.8em] text-[0.85em] font-bold whitespace-pre-wrap"
          >
            {detail}
          </div>
        )}
      </TextPanel>
    </div>
  );
};

const AnnouncementTicker = ({ layer }: { layer: AnnouncementLayer }) => {
  const { heading, body, detail, accent, text, tickerSeconds } = layer;
  const message = [heading, body, detail].filter(Boolean).join("   ·   ");

  return (
    <div className="@container-size relative flex size-full items-stretch overflow-hidden">
      <LayerBackdrop fill={layer.fill} />
      {heading && (
        <div
          style={{
            background: accent,
            fontFamily: fontStack(text.fontFamily),
            fontSize: text.fontSize * 0.8,
            color: "#ffffff",
            paddingInline: text.padding,
          }}
          className="relative z-1 flex shrink-0 items-center font-extrabold tracking-[0.04em] uppercase"
        >
          {heading}
        </div>
      )}
      <MarqueeTrack
        text={message}
        crossSeconds={tickerSeconds}
        style={{
          color: text.color,
          fontFamily: fontStack(text.fontFamily),
          fontSize: text.fontSize,
          fontWeight: text.fontWeight,
        }}
      />
    </div>
  );
};
