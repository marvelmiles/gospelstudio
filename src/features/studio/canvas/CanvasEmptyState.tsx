import { useState } from "react";
import { LayoutTemplate, Webcam } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCENE_TEMPLATES } from "../lib/sceneTemplates";
import { useSources } from "../store/productionStore";
import { applyTemplate } from "../store/sceneActions";
import { CameraPicker } from "../camera/CameraPicker";
import { LayoutDiagram } from "../scenes/LayoutDiagram";
import { TemplateGallery } from "../scenes/TemplateGallery";
import { useTemplatePreviews } from "../hooks/useTemplatePreviews";

const QUICK_TEMPLATE_IDS = [
  "full-camera",
  "camera-bible",
  "camera-manuscript",
  "picture-in-picture",
];

const QUICK_TEMPLATES = SCENE_TEMPLATES.filter((template) =>
  QUICK_TEMPLATE_IDS.includes(template.id),
);

export const CanvasEmptyState = ({ sceneId }: { sceneId: string }) => {
  const previews = useTemplatePreviews();
  const camera = useSources()[0];
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isPickingCamera, setIsPickingCamera] = useState(false);

  return (
    <div className="@container absolute inset-0 grid place-items-center overflow-y-auto bg-black/55 p-3 backdrop-blur-[2px] @md:p-4">
      <div className="flex w-full max-w-150 flex-col items-center gap-2 text-center @md:gap-3">
        <div>
          <h3 className="m-0 text-[14px] font-semibold text-white @md:text-[16px]">
            Pick a layout to start
          </h3>
          <p className="mt-1 mb-0 hidden text-[12.5px] text-white/65 @md:block">
            Or add things one at a time with Add to this scene.
          </p>
        </div>

        <div className="grid w-full grid-cols-4 gap-1.5 @md:gap-2">
          {QUICK_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => applyTemplate(sceneId, template.id)}
              className="flex min-w-0 flex-col gap-1 rounded-lg border border-white/12 bg-card/90 p-1 text-left transition-colors outline-none hover:border-primary/60 focus-visible:ring-[3px] focus-visible:ring-ring/50 @md:gap-1.5 @md:rounded-xl @md:p-1.75"
            >
              <LayoutDiagram
                layers={previews.get(template.id) ?? []}
                background={template.background}
              />
              <span className="truncate px-0.5 text-[10.5px] font-semibold text-foreground @md:text-[12px]">
                {template.name}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsGalleryOpen(true)}
          >
            <LayoutTemplate />
            More layouts
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsPickingCamera(true)}
            title={camera ? "Change the camera" : "Choose your camera"}
            className="max-w-64"
          >
            <Webcam />
            <span className="truncate">
              {camera ? camera.deviceLabel : "Choose camera"}
            </span>
          </Button>
        </div>
      </div>

      <TemplateGallery
        target={isGalleryOpen ? { kind: "apply", sceneId } : null}
        onClose={() => setIsGalleryOpen(false)}
      />
      <CameraPicker
        open={isPickingCamera}
        currentSourceId={camera?.id}
        onChoose={() => setIsPickingCamera(false)}
        onClose={() => setIsPickingCamera(false)}
      />
    </div>
  );
};
