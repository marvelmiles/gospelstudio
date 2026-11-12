import { useState } from "react";
import { SwitchField } from "@/components/shared/SwitchField";
import type { IconLayer } from "../types/layer";
import {
  ICONS,
  iconDefinition,
  isIconName,
  type IconName,
} from "../lib/iconCatalog";
import { IconPicker } from "../icons/IconPicker";
import { ContentPickerRow } from "./ContentPickerRow";
import { ColorField, PropertySection, SliderField } from "./fields";
import { useLayerEditor } from "./useLayerEditor";

export const IconProperties = ({ layer }: { layer: IconLayer }) => {
  const edit = useLayerEditor(layer);
  const [isPicking, setIsPicking] = useState(false);
  const current = iconDefinition(layer.icon);

  const changeIcon = (icon: IconName) => {
    setIsPicking(false);
    edit({
      icon,
      name: layer.name === current.label ? ICONS[icon].label : layer.name,
    });
  };

  return (
    <PropertySection
      title="Icon"
      info="Fill the inside for a solid icon, like a bell or a camera. Leave it off for an outline."
    >
      <ContentPickerRow
        icon={current.icon}
        name={current.label}
        emptyLabel="No icon chosen"
        actionLabel="Change"
        onPick={() => setIsPicking(true)}
      />
      <ColorField
        label="Colour"
        value={layer.color}
        onChange={(color) => edit({ color }, "color")}
      />
      <SliderField
        label="Line thickness"
        value={layer.strokeWidth}
        min={0.5}
        max={4}
        step={0.25}
        onChange={(strokeWidth) => edit({ strokeWidth }, "strokeWidth")}
      />
      <SwitchField
        label="Fill the inside"
        checked={layer.filled}
        onChange={(filled) => edit({ filled })}
      />
      {layer.filled && (
        <ColorField
          label="Inside colour"
          value={layer.fill}
          onChange={(fill) => edit({ fill }, "fill")}
        />
      )}
      <IconPicker
        open={isPicking}
        value={isIconName(layer.icon) ? layer.icon : undefined}
        onChoose={changeIcon}
        onClose={() => setIsPicking(false)}
      />
    </PropertySection>
  );
};
