import type { Slide, TextStyle } from "../types";
import { uid } from "./id";
import {
  chunkLinesToFit,
  slideChunkBaseLabel,
  slideChunkLabel,
  type SlideTextMetrics,
} from "./slideLayout";

export interface ReflowOptions {
  maxLines?: number;
}

const flowIdOf = (slide: Slide): string => slide.flowId || slide.id;

const isReflowable = (slide: Slide): boolean =>
  !slide.media?.length && !slide.textBoxes?.length;

interface Flow {
  slides: Slide[];
  reflowable: boolean;
}

const groupFlows = (slides: Slide[]): Flow[] => {
  const flows: Flow[] = [];
  for (const slide of slides) {
    const reflowable = isReflowable(slide);
    const previous = flows[flows.length - 1];
    const joins =
      previous?.reflowable &&
      reflowable &&
      flowIdOf(previous.slides[0]) === flowIdOf(slide);
    if (joins) previous.slides.push(slide);
    else flows.push({ slides: [slide], reflowable });
  }
  return flows;
};

interface JoinedFlow {
  lines: string[];
  lineOverrides: Record<number, TextStyle>;
  notes: string[];
}

const joinFlow = (slides: Slide[]): JoinedFlow => {
  const lines: string[] = [];
  const lineOverrides: Record<number, TextStyle> = {};
  const notes: string[] = [];

  for (const slide of slides) {
    const offset = lines.length;
    for (const [index, style] of Object.entries(slide.lineOverrides ?? {}))
      lineOverrides[Number(index) + offset] = style;
    lines.push(...(slide.lines ?? []));
    for (const note of (slide.notes || "").split("\n"))
      if (note.trim() && !notes.includes(note)) notes.push(note);
  }

  return { lines, lineOverrides, notes };
};

const sliceLineOverrides = (
  lineOverrides: Record<number, TextStyle>,
  start: number,
  end: number,
): Record<number, TextStyle> => {
  const slice: Record<number, TextStyle> = {};
  for (const [index, style] of Object.entries(lineOverrides)) {
    const line = Number(index);
    if (line >= start && line < end) slice[line - start] = style;
  }
  return slice;
};

const sameLines = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((line, index) => line === b[index]);

const rebuildFlow = (
  slides: Slide[],
  metrics: SlideTextMetrics,
  options: ReflowOptions,
): Slide[] => {
  const lead = slides[0];
  const { lines, lineOverrides, notes } = joinFlow(slides);
  const rebuilt = chunkLinesToFit(lines, metrics, {
    maxLines: options.maxLines,
  });

  if (
    rebuilt.length === slides.length &&
    rebuilt.every((chunk, index) => sameLines(chunk, slides[index].lines ?? []))
  )
    return slides;

  const flowId = flowIdOf(lead);
  const base = slideChunkBaseLabel(lead.label || "");
  const joinedNotes = notes.join("\n");

  let start = 0;
  return rebuilt.map((chunk, index) => {
    const from = start;
    start += chunk.length;
    const overrides = sliceLineOverrides(lineOverrides, from, start);
    return {
      ...lead,
      id: slides[index]?.id ?? uid(),
      flowId,
      label: slideChunkLabel(base, index, rebuilt.length),
      lines: chunk,
      lineOverrides: Object.keys(overrides).length ? overrides : undefined,
      notes: index === rebuilt.length - 1 ? joinedNotes : "",
    };
  });
};

export const reflowSlides = (
  slides: Slide[],
  metrics: SlideTextMetrics,
  options: ReflowOptions = {},
): Slide[] => {
  const next = groupFlows(slides).flatMap((flow) =>
    flow.reflowable ? rebuildFlow(flow.slides, metrics, options) : flow.slides,
  );
  const unchanged =
    next.length === slides.length &&
    next.every((slide, index) => slide === slides[index]);
  return unchanged ? slides : next;
};

export const detachFlow = (slide: Slide): Slide => ({
  ...slide,
  flowId: slide.id,
});
