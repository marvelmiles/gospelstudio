import { LayersPanel } from "../layers/LayersPanel";
import { ElementsPanel } from "../library/ElementsPanel";
import { LayerProperties } from "../properties/LayerProperties";
import { SceneProperties } from "../properties/SceneProperties";
import { useEditorStore } from "../store/editorStore";
import { usePreviewScene } from "../store/productionStore";

export const StudioSidebar = () => {
  const scene = usePreviewScene();
  const selectedLayerId = useEditorStore((state) => state.selectedLayerId);
  const view = useEditorStore((state) => state.sidebarView);
  if (!scene) return null;

  const layer = scene.layers.find((entry) => entry.id === selectedLayerId);
  if (layer) return <LayerProperties key={layer.id} layer={layer} />;
  if (view === "add") return <ElementsPanel />;
  if (view === "scene") return <SceneProperties scene={scene} />;
  return <LayersPanel />;
};
