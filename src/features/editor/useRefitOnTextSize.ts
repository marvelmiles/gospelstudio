import { useEffect, useEffectEvent, useRef } from "react";
import {
  sameSlideTextMetrics,
  type SlideTextMetrics,
} from "../../lib/slideLayout";
import type { ReflowOptions } from "../../lib/slideReflow";

interface RefitOptions {
  metrics: SlideTextMetrics;
  reflow?: ReflowOptions;
  refit: (metrics: SlideTextMetrics, options?: ReflowOptions) => boolean;
  onRefit?: () => void;
}

export const useRefitOnTextSize = ({
  metrics,
  reflow,
  refit,
  onRefit,
}: RefitOptions): void => {
  const lastRef = useRef(metrics);
  const refitTo = useEffectEvent((next: SlideTextMetrics) => {
    if (refit(next, reflow)) onRefit?.();
  });

  useEffect(() => {
    if (sameSlideTextMetrics(lastRef.current, metrics)) return;
    lastRef.current = metrics;
    refitTo(metrics);
  }, [metrics]);
};
