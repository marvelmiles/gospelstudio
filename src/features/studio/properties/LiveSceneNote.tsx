import { Radio } from "lucide-react";
import { usePreviewScene, useProgram } from "../store/productionStore";

export const LiveSceneNote = () => {
  const scene = usePreviewScene();
  const liveSceneId = useProgram()?.sceneId;
  if (!scene || liveSceneId !== scene.id) return null;

  return (
    <div className="mb-3 flex items-start gap-2 rounded-[10px] border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] leading-snug text-destructive-foreground">
      <Radio size={14} className="mt-px shrink-0 text-destructive" />
      On the live screen. Press GO LIVE to show your changes.
    </div>
  );
};
