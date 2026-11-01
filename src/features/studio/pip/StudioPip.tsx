import { useEffect, useMemo } from "react";
import { useProductionStore } from "../store/productionStore";
import { findSceneItem } from "../lib/sceneItems";
import { isDeckLayer } from "../lib/deckContent";
import { DeckPip } from "./DeckPip";
import { VideoPip } from "./VideoPip";
import { closeItemPip, usePipStore } from "./pipStore";

export const StudioPip = () => {
  const openLayerIds = usePipStore((state) => state.openLayerIds);
  return (
    <>
      {openLayerIds.map((layerId, index) => (
        <ItemPip key={layerId} layerId={layerId} stackIndex={index} />
      ))}
    </>
  );
};

const ItemPip = ({
  layerId,
  stackIndex,
}: {
  layerId: string;
  stackIndex: number;
}) => {
  const production = useProductionStore((state) => state.production);
  const item = useMemo(
    () => findSceneItem(production, layerId),
    [production, layerId],
  );
  const isGone = Boolean(production && !item);

  useEffect(() => {
    if (isGone) closeItemPip(layerId);
  }, [isGone, layerId]);

  if (!item) return null;
  const { layer, isLive, sceneName } = item;
  const shared = { isLive, sceneName, stackIndex };
  if (isDeckLayer(layer)) return <DeckPip layer={layer} {...shared} />;
  if (layer.type === "video") return <VideoPip layer={layer} {...shared} />;
  return null;
};
