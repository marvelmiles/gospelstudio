import { useMemo } from "react";
import { soundSharingDevices } from "../lib/deviceSound";
import { useCameraStore } from "../store/cameraStore";
import { useSources } from "../store/productionStore";

export const useSoundSharingDevices = () => {
  const sources = useSources();
  const states = useCameraStore((state) => state.sources);
  return useMemo(() => soundSharingDevices(sources, states), [sources, states]);
};
