import { AnimatePresence, motion } from "framer-motion";
import type { Align } from "../../types";
import { useStore } from "../../store/useStore";
import { ANIMATION_VARIANTS, buildTransition } from "../../lib/animation";
import { FormattedText } from "../../components/FormattedText";
import { cn } from "../../lib/utils";
import { OverlayPicture } from "./OverlayPicture";
import {
  BADGE_GAP_RATIO,
  BADGE_PADDING_RATIO,
  type OverlayBadgeStyle,
  type OverlayBlockStyle,
} from "./lib/overlayAppearance";
import type { ContentOverlay } from "./lib/streamOverlay";
import { useOverlayBlocks } from "./lib/useOverlayBlocks";

const FLEX_ALIGN: Record<Align, string> = {
  left: "items-start",
  center: "items-center",
  right: "items-end",
};

export const OverlayTextBlock = ({ overlay }: { overlay: ContentOverlay }) => {
  const prefs = useStore((s) => s.prefs);
  const blocks = useOverlayBlocks(overlay);
  const { block, badge } = overlay;

  if (blocks.length === 0) return null;
  const index = Math.min(Math.max(overlay.slideIndex, 0), blocks.length - 1);
  const current = blocks[index];
  const variant =
    ANIMATION_VARIANTS[overlay.animation] ?? ANIMATION_VARIANTS.fade;
  const transition = buildTransition(prefs.transitionDuration, prefs.easing);
  const showBadge = badge.show && current.badge.trim() !== "";

  return (
    <div className="absolute inset-0 overflow-hidden">
      <Backdrop style={block} />
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          initial={variant.initial}
          animate={variant.animate}
          exit={{ opacity: 0 }}
          transition={transition}
          style={{
            gap: `${badge.fontSize * BADGE_GAP_RATIO}cqw`,
            padding: `${block.padding}cqw`,
          }}
          className={cn(
            "absolute inset-0 flex flex-col justify-center",
            FLEX_ALIGN[block.align],
          )}
        >
          {showBadge && <Badge text={current.badge} style={badge} />}
          <div
            className="w-full"
            style={{
              fontFamily: `'${block.fontFamily}', serif`,
              fontSize: `${block.fontSize}cqw`,
              fontWeight: block.fontWeight,
              lineHeight: block.lineHeight,
              color: block.textColor,
              textAlign: block.align,
            }}
          >
            {current.lines.map((line, lineIndex) => (
              <div key={lineIndex}>
                <FormattedText text={line} baseWeight={block.fontWeight} />
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const Backdrop = ({ style }: { style: OverlayBlockStyle }) => {
  if (!style.background && !style.backgroundImage) return null;
  return (
    <div style={{ background: style.background }} className="absolute inset-0">
      {style.backgroundImage && (
        <OverlayPicture image={style.backgroundImage} fit="cover" />
      )}
    </div>
  );
};

const Badge = ({ text, style }: { text: string; style: OverlayBadgeStyle }) => {
  return (
    <span
      className="relative inline-flex max-w-full items-center overflow-hidden rounded-full leading-[1.15] tracking-[0.04em] whitespace-nowrap"
      style={{
        padding: `${style.fontSize * BADGE_PADDING_RATIO}cqw ${style.fontSize * 0.95}cqw`,
        background: style.background,
        fontFamily: `'${style.fontFamily}', sans-serif`,
        fontSize: `${style.fontSize}cqw`,
        fontWeight: style.fontWeight,
        color: style.textColor,
      }}
    >
      {style.backgroundImage && (
        <OverlayPicture image={style.backgroundImage} fit="cover" />
      )}
      <span className="relative">{text}</span>
    </span>
  );
};
