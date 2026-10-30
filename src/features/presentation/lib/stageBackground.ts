import type { CSSProperties } from "react";
import type { Background } from "../../../types";

export const stageTransportClassName =
  "fixed bottom-21.5 left-1/2 z-20 w-[min(680px,calc(100vw-32px))] -translate-x-1/2";

export const DECK_END_LABELS: Record<string, string> = {
  manuscript: "End of manuscript",
  scripture: "End of passage",
  image: "End of images",
  video: "End of video",
};

export const backgroundCssOf = (
  background: Background | null,
): string | undefined => {
  if (!background || background.type === "image" || background.type === "video")
    return undefined;
  if (background.type === "solid") return background.color;
  return background.css || undefined;
};

export const stageBackgroundStyle = (
  background: Background | null,
  blobUrl: string | null,
): CSSProperties => {
  if (background?.type === "image") {
    const url = background.blobId ? blobUrl : background.src;
    return { backgroundImage: url ? `url(${url})` : undefined };
  }
  return { background: backgroundCssOf(background) };
};
