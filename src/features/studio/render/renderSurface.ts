import { createContext, useContext } from "react";
import { EMPTY_STREAMS, type SourceStreams } from "../lib/outputStreams";

export type RenderSurface = "editor" | "monitor" | "preview" | "output";

export const RenderSurfaceContext = createContext<RenderSurface>("monitor");

export const SourceStreamsContext = createContext<SourceStreams>(EMPTY_STREAMS);

export const StageScaleContext = createContext(1);

export const useRenderSurface = (): RenderSurface =>
  useContext(RenderSurfaceContext);

export const useSourceStream = (
  sourceId: string | null,
): MediaStream | null => {
  const streams = useContext(SourceStreamsContext);
  return sourceId ? (streams[sourceId] ?? null) : null;
};

export const useStageScale = (): number => useContext(StageScaleContext);
