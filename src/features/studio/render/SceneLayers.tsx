import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Layer } from "../types/layer";
import { silenceEchoClones } from "../lib/linkedItems";
import { layerEntranceMotion, layerExitMotion } from "../lib/sceneTransitions";
import { LayerSurface } from "../elements/LayerContent";

interface PresentLayer {
  layer: Layer;
  order: number;
  exiting: boolean;
}

const reconcile = (previous: PresentLayer[], next: Layer[]): PresentLayer[] => {
  const nextIds = new Set(next.map((layer) => layer.id));
  const present = next.map((layer, order) => ({
    layer,
    order,
    exiting: false,
  }));
  const leaving = previous
    .filter(
      (entry) =>
        !nextIds.has(entry.layer.id) &&
        layerExitMotion(entry.layer.animation) !== null,
    )
    .map((entry) => ({ ...entry, exiting: true }));
  return [...present, ...leaving];
};

interface SceneLayersProps {
  layers: Layer[];
  background: string;
  geometryMs: number;
}

export const SceneLayers = ({
  layers,
  background,
  geometryMs,
}: SceneLayersProps) => {
  const visible = useMemo(
    () => silenceEchoClones(layers.filter((layer) => layer.visible)),
    [layers],
  );
  const [source, setSource] = useState(visible);
  const [rendered, setRendered] = useState<PresentLayer[]>(() =>
    reconcile([], visible),
  );

  if (source !== visible) {
    setSource(visible);
    setRendered(reconcile(rendered, visible));
  }

  const removeExited = useCallback(
    (layerId: string) =>
      setRendered((current) =>
        current.filter(
          (entry) => !(entry.exiting && entry.layer.id === layerId),
        ),
      ),
    [],
  );

  return (
    <div style={{ background }} className="absolute inset-0 overflow-hidden">
      {rendered.map((entry) => (
        <AnimatedLayer
          key={entry.layer.id}
          entry={entry}
          geometryMs={geometryMs}
          onExited={removeExited}
        />
      ))}
    </div>
  );
};

interface AnimatedLayerProps {
  entry: PresentLayer;
  geometryMs: number;
  onExited: (layerId: string) => void;
}

const AnimatedLayer = ({ entry, geometryMs, onExited }: AnimatedLayerProps) => {
  const { layer, order, exiting } = entry;
  const ref = useRef<HTMLDivElement>(null);
  const [entrance] = useState(() => layerEntranceMotion(layer.animation));

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || !entrance) return;
    const animation = element.animate(entrance.keyframes, {
      duration: entrance.durationMs,
      easing: entrance.easing,
      fill: "backwards",
    });
    return () => animation.cancel();
  }, [entrance]);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || !exiting) return;
    const motion = layerExitMotion(layer.animation);
    if (!motion) {
      onExited(layer.id);
      return;
    }
    const animation = element.animate(motion.keyframes, {
      duration: motion.durationMs,
      easing: motion.easing,
      fill: "forwards",
    });
    animation.onfinish = () => onExited(layer.id);
    return () => {
      animation.onfinish = null;
      animation.cancel();
    };
  }, [exiting, layer.animation, layer.id, onExited]);

  return (
    <div
      ref={ref}
      aria-hidden={exiting || undefined}
      style={{
        left: layer.position.x,
        top: layer.position.y,
        width: layer.dimensions.width,
        height: layer.dimensions.height,
        zIndex: order + 1,
        transitionProperty:
          geometryMs > 0 ? "left, top, width, height" : undefined,
        transitionDuration: geometryMs > 0 ? `${geometryMs}ms` : undefined,
        transitionTimingFunction: "cubic-bezier(0.65, 0, 0.35, 1)",
      }}
      className="absolute"
    >
      <LayerSurface layer={layer} />
    </div>
  );
};
