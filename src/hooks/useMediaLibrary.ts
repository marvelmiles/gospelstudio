import { useMemo } from "react";
import { useStore } from "../store/useStore";
import type { MediaLibrary } from "../lib/media";

export const useMediaLibrary = (): MediaLibrary => {
  const media = useStore((s) => s.media);
  const builtInMedia = useStore((s) => s.builtInMedia);
  return useMemo(() => ({ media, builtInMedia }), [media, builtInMedia]);
};
