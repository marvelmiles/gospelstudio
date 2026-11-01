import { Layers } from "lucide-react";
import { useStore } from "../../../store/useStore";
import { BackgroundSurface } from "../../../components/media/BackgroundSurface";
import type { BackgroundLayer } from "../types/layer";
import { ElementPlaceholder } from "./ElementPlaceholder";

export const BackgroundElement = ({ layer }: { layer: BackgroundLayer }) => {
  const background = useStore((state) =>
    state.backgrounds.find((entry) => entry.id === layer.backgroundId),
  );
  if (!background)
    return (
      <ElementPlaceholder
        icon={Layers}
        title="Choose a background"
        hint="Pick a colour, image or moving background from your library."
      />
    );
  return <BackgroundSurface background={background} variant="full" />;
};
