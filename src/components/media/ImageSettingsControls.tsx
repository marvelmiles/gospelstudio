import {
  FlipHorizontal2,
  FlipVertical2,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import type { ImageSettings } from "../../types";
import { Button } from "../ui/Button";
import { Field, SectionTitle, Select, Toggle } from "../ui/Field";
import { cn } from "../../lib/cn";
import { SCREEN_FIT_OPTIONS } from "../../lib/mediaOptions";
import { AdjustmentControls, settingsColumns } from "./AdjustmentControls";

interface ImageSettingsControlsProps {
  settings: ImageSettings;
  onChange: (changes: Partial<ImageSettings>) => void;
  narrow?: boolean;
}

export const ImageSettingsControls = ({
  settings,
  onChange,
  narrow,
}: ImageSettingsControlsProps) => {
  const rotateBy = (delta: 90 | -90) =>
    onChange({
      rotate: ((((settings.rotate + delta) % 360) + 360) %
        360) as ImageSettings["rotate"],
    });

  return (
    <>
      <SectionTitle>Transform</SectionTitle>
      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <Button size="sm" variant="ghost" onClick={() => rotateBy(-90)}>
          <RotateCcw size={14} />
          Rotate left
        </Button>
        <Button size="sm" variant="ghost" onClick={() => rotateBy(90)}>
          <RotateCw size={14} />
          Rotate right
        </Button>
        <Button
          size="sm"
          variant={settings.flipH ? "primary" : "ghost"}
          onClick={() => onChange({ flipH: !settings.flipH })}
        >
          <FlipHorizontal2 size={14} />
          Flip H
        </Button>
        <Button
          size="sm"
          variant={settings.flipV ? "primary" : "ghost"}
          onClick={() => onChange({ flipV: !settings.flipV })}
        >
          <FlipVertical2 size={14} />
          Flip V
        </Button>
      </div>
      <div className={cn("grid gap-x-4", settingsColumns(narrow))}>
        <Field label="Screen fit">
          <Select
            value={settings.fit}
            options={SCREEN_FIT_OPTIONS}
            onChange={(event) =>
              onChange({ fit: event.target.value as ImageSettings["fit"] })
            }
          />
        </Field>
        <div className={cn("pb-3", !narrow && "pt-6")}>
          <Toggle
            label="Darken overlay (legibility)"
            checked={settings.scrim}
            onChange={(scrim) => onChange({ scrim })}
          />
        </div>
      </div>

      <SectionTitle>Adjustments</SectionTitle>
      <AdjustmentControls value={settings} onChange={onChange} />
    </>
  );
};
