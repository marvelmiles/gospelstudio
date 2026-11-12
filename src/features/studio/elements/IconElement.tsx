import type { IconLayer } from "../types/layer";
import { iconDefinition } from "../lib/iconCatalog";

export const IconElement = ({ layer }: { layer: IconLayer }) => {
  const { icon: Icon } = iconDefinition(layer.icon);
  return (
    <Icon
      aria-hidden
      color={layer.color}
      fill={layer.filled ? layer.fill : "none"}
      strokeWidth={layer.strokeWidth}
      className="block size-full"
    />
  );
};
