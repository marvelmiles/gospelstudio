import { create } from "zustand";
import { now } from "../../../lib/id";
import type { Layer } from "../types/layer";
import type { MediaSource } from "../types/mediaSource";
import type { Production, ProductionSummary } from "../types/production";
import type { Scene, SceneLayout } from "../types/scene";
import { previewSceneOf, summariseProduction } from "../lib/productionFactory";
import { writeProduction } from "../lib/productionStorage";

const HISTORY_LIMIT = 100;
const COALESCE_MS = 700;
const AUTOSAVE_DELAY_MS = 700;

type LoadStatus = "idle" | "loading" | "ready";
export type SaveState = "saved" | "saving" | "unsaved" | "failed";

interface HistoryEntry {
  scenes: Scene[];
  sources: MediaSource[];
  previewSceneId: string;
}

interface ProductionStoreState {
  status: LoadStatus;
  productions: ProductionSummary[];
  production: Production | null;
  layouts: SceneLayout[];
  past: HistoryEntry[];
  future: HistoryEntry[];
  saveState: SaveState;
  lastSavedAt: string | null;
}

export const INITIAL_PRODUCTION_STATE: ProductionStoreState = {
  status: "idle",
  productions: [],
  production: null,
  layouts: [],
  past: [],
  future: [],
  saveState: "saved",
  lastSavedAt: null,
};

export const useProductionStore = create<ProductionStoreState>()(() => ({
  ...INITIAL_PRODUCTION_STATE,
}));

export const documents = new Map<string, Production>();

export interface EditOptions {
  coalesceKey?: string;
  record?: boolean;
}

let lastCoalesce: { key: string; at: number } | null = null;
let saveTimer: number | undefined;

const entryOf = (production: Production): HistoryEntry => ({
  scenes: production.scenes,
  sources: production.sources,
  previewSceneId: production.previewSceneId,
});

const shouldMerge = (coalesceKey: string | undefined): boolean => {
  const at = Date.now();
  const merge = Boolean(
    coalesceKey &&
    lastCoalesce?.key === coalesceKey &&
    at - lastCoalesce.at < COALESCE_MS,
  );
  lastCoalesce = coalesceKey ? { key: coalesceKey, at } : null;
  return merge;
};

const replaceSummary = (
  summaries: ProductionSummary[],
  production: Production,
): ProductionSummary[] => {
  const summary = summariseProduction(production);
  const exists = summaries.some((entry) => entry.id === production.id);
  const next = exists
    ? summaries.map((entry) => (entry.id === production.id ? summary : entry))
    : [...summaries, summary];
  return next.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const flushSave = async (): Promise<void> => {
  window.clearTimeout(saveTimer);
  saveTimer = undefined;
  const { production } = useProductionStore.getState();
  if (!production) return;
  useProductionStore.setState({ saveState: "saving" });
  try {
    await writeProduction(production);
    documents.set(production.id, production);
    const current = useProductionStore.getState().production;
    useProductionStore.setState((state) => ({
      productions: replaceSummary(state.productions, production),
      saveState: current === production ? "saved" : "unsaved",
      lastSavedAt: now(),
    }));
  } catch {
    useProductionStore.setState({ saveState: "failed" });
  }
};

const scheduleSave = (): void => {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => void flushSave(), AUTOSAVE_DELAY_MS);
};

export const cancelScheduledSave = (): void => {
  window.clearTimeout(saveTimer);
  saveTimer = undefined;
};

export const editProduction = (
  recipe: (production: Production) => Production,
  { coalesceKey, record = true }: EditOptions = {},
): void => {
  const { production, past, future } = useProductionStore.getState();
  if (!production) return;
  const next = recipe(production);
  if (next === production) return;
  const merge = record && shouldMerge(coalesceKey);
  useProductionStore.setState({
    production: { ...next, updatedAt: now() },
    past:
      record && !merge
        ? [...past, entryOf(production)].slice(-HISTORY_LIMIT)
        : past,
    future: record ? [] : future,
    saveState: "unsaved",
  });
  scheduleSave();
};

export const editScene = (
  sceneId: string,
  recipe: (scene: Scene) => Scene,
  options?: EditOptions,
): void =>
  editProduction((production) => {
    let changed = false;
    const scenes = production.scenes.map((scene) => {
      if (scene.id !== sceneId) return scene;
      const next = recipe(scene);
      if (next === scene) return scene;
      changed = true;
      return { ...next, updatedAt: now() };
    });
    return changed ? { ...production, scenes } : production;
  }, options);

export const editPreviewLayers = (
  recipe: (layers: Layer[]) => Layer[],
  options?: EditOptions,
): void => {
  const { production } = useProductionStore.getState();
  if (!production) return;
  editScene(
    previewSceneOf(production).id,
    (scene) => {
      const layers = recipe(scene.layers);
      return layers === scene.layers ? scene : { ...scene, layers };
    },
    options,
  );
};

const restore = (entry: HistoryEntry): void => {
  const { production } = useProductionStore.getState();
  if (!production) return;
  useProductionStore.setState({
    production: {
      ...production,
      scenes: entry.scenes,
      sources: entry.sources,
      previewSceneId: entry.scenes.some(
        (scene) => scene.id === entry.previewSceneId,
      )
        ? entry.previewSceneId
        : entry.scenes[0].id,
      updatedAt: now(),
    },
    saveState: "unsaved",
  });
  scheduleSave();
};

export const undo = (): void => {
  const { production, past, future } = useProductionStore.getState();
  const entry = past[past.length - 1];
  if (!production || !entry) return;
  lastCoalesce = null;
  useProductionStore.setState({
    past: past.slice(0, -1),
    future: [...future, entryOf(production)].slice(-HISTORY_LIMIT),
  });
  restore(entry);
};

export const redo = (): void => {
  const { production, past, future } = useProductionStore.getState();
  const entry = future[future.length - 1];
  if (!production || !entry) return;
  lastCoalesce = null;
  useProductionStore.setState({
    future: future.slice(0, -1),
    past: [...past, entryOf(production)].slice(-HISTORY_LIMIT),
  });
  restore(entry);
};

export const resetHistory = (): void => {
  lastCoalesce = null;
  useProductionStore.setState({ past: [], future: [] });
};

export const usePreviewScene = (): Scene | null =>
  useProductionStore((state) =>
    state.production ? previewSceneOf(state.production) : null,
  );

export const useProgram = () =>
  useProductionStore((state) => state.production?.program ?? null);

const EMPTY_SOURCES: MediaSource[] = [];

export const useSources = (): MediaSource[] =>
  useProductionStore((state) => state.production?.sources ?? EMPTY_SOURCES);
