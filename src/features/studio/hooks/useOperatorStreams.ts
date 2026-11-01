import { useMemo } from "react";
import { useCameraStore } from "../store/cameraStore";
import type { SourceStreams } from "../lib/outputStreams";

export const useOperatorStreams = (): SourceStreams => {
  const sources = useCameraStore((state) => state.sources);
  return useMemo(
    () =>
      Object.fromEntries(
        Object.entries(sources).map(([sourceId, source]) => [
          sourceId,
          source.stream,
        ]),
      ),
    [sources],
  );
};
