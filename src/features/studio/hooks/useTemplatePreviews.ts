import { useMemo } from "react";
import type { Layer } from "../types/layer";
import { SCENE_TEMPLATES } from "../lib/sceneTemplates";

const DIAGRAM_CONTEXT = { cameraSourceId: null, backgroundId: null };

export const useTemplatePreviews = (): Map<string, Layer[]> =>
  useMemo(
    () =>
      new Map(
        SCENE_TEMPLATES.map((template) => [
          template.id,
          template.build(DIAGRAM_CONTEXT),
        ]),
      ),
    [],
  );
