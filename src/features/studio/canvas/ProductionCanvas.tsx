import { useCallback, useLayoutEffect, useRef } from "react";
import type { Layer, LayerFrame } from "../types/layer";
import { frameOf } from "../lib/canvasCoordinates";
import { selectLayer, useEditorStore } from "../store/editorStore";
import { usePreviewScene, useProductionStore } from "../store/productionStore";
import { RenderSurfaceContext } from "../render/renderSurface";
import { ScaledStage } from "../render/ScaledStage";
import { AlignmentGuides } from "./AlignmentGuides";
import { CanvasEmptyState } from "./CanvasEmptyState";
import { EditableLayer } from "./EditableLayer";

export const ProductionCanvas = () => {
  const scene = usePreviewScene();
  const selectedLayerId = useEditorStore((state) => state.selectedLayerId);
  const snapEnabled = useProductionStore(
    (state) => state.production?.settings.snapToGuides ?? true,
  );
  const layersRef = useRef<Layer[]>([]);

  useLayoutEffect(() => {
    layersRef.current = scene?.layers ?? [];
  });

  const snapTargets = useCallback(
    (layerId: string): LayerFrame[] =>
      layersRef.current
        .filter((layer) => layer.id !== layerId && layer.visible)
        .map(frameOf),
    [],
  );

  if (!scene) return null;
  const isEmpty = scene.layers.length === 0;

  return (
    <RenderSurfaceContext.Provider value="editor">
      <ScaledStage
        background={scene.background}
        className="aspect-video w-full rounded-xl ring-1 ring-border"
        overlay={isEmpty ? <CanvasEmptyState sceneId={scene.id} /> : undefined}
      >
        <div
          aria-hidden
          onPointerDown={() => selectLayer(null)}
          className="absolute inset-0"
        />
        {scene.layers.map((layer, order) =>
          layer.visible ? (
            <EditableLayer
              key={layer.id}
              layer={layer}
              order={order}
              isSelected={layer.id === selectedLayerId}
              snapEnabled={snapEnabled}
              snapTargets={snapTargets}
            />
          ) : null,
        )}
        <AlignmentGuides />
      </ScaledStage>
    </RenderSurfaceContext.Provider>
  );
};
