import { useCallback, useEffect, useRef, useState } from "react";
import type { ProgramSnapshot } from "../types/production";
import { isSameSnapshot } from "../lib/productionFactory";
import { applyProgramAssets } from "../lib/programAssets";
import {
  openPreviewChannel,
  postPreviewMessage,
  type PreviewFrame,
} from "../lib/previewChannel";

export interface PreviewFeed {
  shown: ProgramSnapshot | null;
  latestSceneName: string | null;
  isOutOfDate: boolean;
  hasOperator: boolean;
  update: () => void;
}

export const usePreviewFeed = (): PreviewFeed => {
  const [latest, setLatest] = useState<PreviewFrame | null>(null);
  const [shown, setShown] = useState<PreviewFrame | null>(null);
  const hasShownRef = useRef(false);

  useEffect(() => {
    const channel = openPreviewChannel((message) => {
      if (message.type !== "frame") return;
      setLatest(message.frame);
      if (hasShownRef.current && !message.show) return;
      hasShownRef.current = true;
      applyProgramAssets(message.frame.assets);
      setShown(message.frame);
    });
    postPreviewMessage(channel, { type: "hello" });
    return () => channel?.close();
  }, []);

  const update = useCallback(() => {
    if (!latest) return;
    applyProgramAssets(latest.assets);
    setShown(latest);
  }, [latest]);

  return {
    shown: shown?.program ?? null,
    latestSceneName: latest?.program.sceneName ?? null,
    isOutOfDate: Boolean(
      latest && shown && !isSameSnapshot(latest.program, shown.program),
    ),
    hasOperator: latest !== null,
    update,
  };
};
