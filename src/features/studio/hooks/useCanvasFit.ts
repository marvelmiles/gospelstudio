import { useLayoutEffect, useRef, useState } from "react";
import {
  stageTransform,
  type StageFit,
  type StageTransform,
} from "../lib/canvasCoordinates";

const UNMEASURED: StageTransform = {
  scaleX: 0,
  scaleY: 0,
  offsetX: 0,
  offsetY: 0,
};

const sameTransform = (a: StageTransform, b: StageTransform): boolean =>
  a.scaleX === b.scaleX &&
  a.scaleY === b.scaleY &&
  a.offsetX === b.offsetX &&
  a.offsetY === b.offsetY;

export const useCanvasFit = <T extends HTMLElement>(fit: StageFit) => {
  const ref = useRef<T>(null);
  const [transform, setTransform] = useState<StageTransform>(UNMEASURED);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const next = stageTransform(
        { width: element.clientWidth, height: element.clientHeight },
        fit,
      );
      setTransform((current) =>
        sameTransform(current, next) ? current : next,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [fit]);

  return { ref, transform };
};
