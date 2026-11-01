import { useGoLive } from "../../../hooks/useGoLive";
import { studioOutputWindow } from "../lib/outputChannel";
import { useOutputStore } from "../store/outputStore";

export type OutputConnection = "closed" | "connecting" | "connected";

export const useOutputConnection = (): OutputConnection => {
  const { isLive: isWindowOpen } = useGoLive(studioOutputWindow);
  const isConnected = useOutputStore((state) => state.isConnected);
  if (isConnected) return "connected";
  return isWindowOpen ? "connecting" : "closed";
};
