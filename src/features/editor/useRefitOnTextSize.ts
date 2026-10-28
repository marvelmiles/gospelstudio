import { useEffect, useRef } from "react";
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
  const latest = useRef({ reflow, refit, onRefit });
  latest.current = { reflow, refit, onRefit };

  useEffect(() => {
    if (sameSlideTextMetrics(lastRef.current, metrics)) return;
    lastRef.current = metrics;
    const { refit: apply, reflow: options, onRefit: done } = latest.current;
    if (apply(metrics, options)) done?.();
  }, [metrics]);
};
