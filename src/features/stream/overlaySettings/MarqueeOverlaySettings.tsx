import { Baseline } from "lucide-react";
import { FONT_WEIGHT_OPTIONS } from "../../../data/slideFonts";
import { inputClassName } from "../../../components/ui/Field";
import { cn } from "../../../lib/cn";
import {
  OverlayColorField,
  OverlaySelect,
  OverlaySettingsGroup,
  OverlaySlider,
} from "../OverlayControls";
import type { OverlaySurfaceStyle } from "../lib/overlayAppearance";
import {
  MAX_MARQUEE_CROSS_SECONDS,
  MIN_MARQUEE_CROSS_SECONDS,
  type MarqueeOverlay,
} from "../lib/streamOverlay";
import { editStreamOverlay } from "../lib/streamOverlayStore";
import { FONT_OPTIONS } from "./overlayOptions";
import { SurfacePictureField } from "./SurfacePictureField";

const toSpeed = (crossSeconds: number): number =>
  MIN_MARQUEE_CROSS_SECONDS + MAX_MARQUEE_CROSS_SECONDS - crossSeconds;

export const MarqueeOverlaySettings = ({
  overlay,
}: {
  overlay: MarqueeOverlay;
}) => {
  const patchStyle = (style: Partial<OverlaySurfaceStyle>) =>
    editStreamOverlay(overlay.id, { style: { ...overlay.style, ...style } });

  return (
    <>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-sub">
          Announcement
        </span>
        <textarea
          value={overlay.text}
          onChange={(event) =>
            editStreamOverlay(overlay.id, { text: event.target.value })
          }
          rows={2}
          className={cn(inputClassName, "resize-y leading-normal")}
        />
      </label>

      <OverlaySlider
        label="Scrolling speed"
        value={toSpeed(overlay.crossSeconds)}
        min={MIN_MARQUEE_CROSS_SECONDS}
        max={MAX_MARQUEE_CROSS_SECONDS}
        step={0.5}
        onChange={(speed) =>
          editStreamOverlay(overlay.id, { crossSeconds: toSpeed(speed) })
        }
      />

      <OverlaySettingsGroup title="Band" icon={Baseline}>
        <OverlayColorField
          label="Background"
          value={overlay.style.background}
          onChange={(background) => patchStyle({ background })}
        />
        <SurfacePictureField
          label="Background picture"
          image={overlay.style.backgroundImage}
          onChange={(backgroundImage) => patchStyle({ backgroundImage })}
        />
        <OverlayColorField
          label="Text colour"
          value={overlay.style.textColor}
          onChange={(textColor) => patchStyle({ textColor })}
        />
        <OverlaySelect
          label="Font"
          value={overlay.style.fontFamily}
          options={FONT_OPTIONS}
          onChange={(fontFamily) => patchStyle({ fontFamily })}
        />
        <OverlaySelect
          label="Weight"
          value={String(overlay.style.fontWeight)}
          options={FONT_WEIGHT_OPTIONS}
          onChange={(value) => patchStyle({ fontWeight: Number(value) })}
        />
        <OverlaySlider
          label="Text size"
          value={overlay.fontScale}
          min={20}
          max={80}
          suffix="%"
          onChange={(fontScale) => editStreamOverlay(overlay.id, { fontScale })}
        />
      </OverlaySettingsGroup>
    </>
  );
};
