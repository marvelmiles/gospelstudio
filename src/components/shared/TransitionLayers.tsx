import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type Key,
  type ReactNode,
} from "react";
import type { LayerMotion, SlideTransition } from "../../lib/animation";

interface Layer {
  id: number;
  key: Key;
  node: ReactNode;
  enter: LayerMotion | null;
  exit: LayerMotion | null;
}

interface TransitionLayersProps {
  transitionKey: Key;
  transition: SlideTransition;
  className?: string;
  children: ReactNode;
}

export const TransitionLayers = ({
  transitionKey,
  transition,
  className,
  children,
}: TransitionLayersProps) => {
  const [layers, setLayers] = useState<Layer[]>(() => [
    {
      id: 0,
      key: transitionKey,
      node: children,
      enter: null,
      exit: null,
    },
  ]);

  const active = layers[layers.length - 1];
  if (active.key !== transitionKey) {
    const { enter, exit, waitForExit } = transition;
    setLayers([
      ...layers.map((layer) => (layer.exit ? layer : { ...layer, exit })),
      {
        id: active.id + 1,
        key: transitionKey,
        node: children,
        enter: { ...enter, delayMs: waitForExit ? exit.durationMs : 0 },
        exit: null,
      },
    ]);
  } else if (active.node !== children) {
    setLayers(
      layers.map((layer) =>
        layer === active ? { ...layer, node: children } : layer,
      ),
    );
  }

  const removeLayer = useCallback(
    (id: number) =>
      setLayers((current) => current.filter((layer) => layer.id !== id)),
    [],
  );

  return layers.map((layer) => (
    <TransitionLayer
      key={layer.id}
      layer={layer}
      className={className}
      onExited={removeLayer}
    />
  ));
};

interface TransitionLayerProps {
  layer: Layer;
  className?: string;
  onExited: (id: number) => void;
}

const TransitionLayer = ({
  layer,
  className,
  onExited,
}: TransitionLayerProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { id, enter, exit } = layer;

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || !enter) return;
    const animation = element.animate(enter.keyframes, {
      duration: enter.durationMs,
      delay: enter.delayMs ?? 0,
      easing: enter.easing,
      fill: "both",
    });
    return () => animation.cancel();
  }, [enter]);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || !exit) return;
    const animation = element.animate(exit.keyframes, {
      duration: exit.durationMs,
      easing: exit.easing,
      fill: "forwards",
    });
    animation.onfinish = () => onExited(id);
    return () => {
      animation.onfinish = null;
      animation.cancel();
    };
  }, [exit, id, onExited]);

  return (
    <div ref={ref} aria-hidden={exit ? true : undefined} className={className}>
      {layer.node}
    </div>
  );
};
