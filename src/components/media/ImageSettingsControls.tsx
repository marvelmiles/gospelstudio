import {
  FlipHorizontal2,
  FlipVertical2,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import type { ImageSettings } from "../../types";
import { Button } from "@/components/ui/button";
import { Field, SectionTitle } from "@/components/shared/Field";
import { OptionSelect } from "@/components/shared/OptionSelect";
import { SwitchField } from "@/components/shared/SwitchField";
import { cn } from "../../lib/utils";
import { SCREEN_FIT_OPTIONS } from "../../lib/mediaOptions";
import { AdjustmentControls } from "./AdjustmentControls";
import { settingsColumns } from "./settingsColumns";

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
        <Button size="sm" variant="secondary" onClick={() => rotateBy(-90)}>
          <RotateCcw size={14} />
          Rotate left
        </Button>
        <Button size="sm" variant="secondary" onClick={() => rotateBy(90)}>
          <RotateCw size={14} />
          Rotate right
        </Button>
        <Button
          size="sm"
          variant={settings.flipH ? "default" : "secondary"}
          onClick={() => onChange({ flipH: !settings.flipH })}
        >
          <FlipHorizontal2 size={14} />
          Flip H
        </Button>
        <Button
          size="sm"
          variant={settings.flipV ? "default" : "secondary"}
          onClick={() => onChange({ flipV: !settings.flipV })}
        >
          <FlipVertical2 size={14} />
          Flip V
        </Button>
      </div>
      <div className={cn("grid gap-x-4", settingsColumns(narrow))}>
        <Field label="Screen fit">
          <OptionSelect
            value={settings.fit}
            options={SCREEN_FIT_OPTIONS}
            onValueChange={(next) =>
              onChange({ fit: next as ImageSettings["fit"] })
            }
          />
        </Field>
        <div className={cn("pb-3", !narrow && "pt-6")}>
          <SwitchField
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
