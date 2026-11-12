import { now, uid } from "../../../lib/id";
import type { Layer } from "../types/layer";
import {
  isLocalCamera,
  type CameraSource,
  type MediaSource,
  type RemoteCameraSource,
} from "../types/mediaSource";
import type {
  Production,
  ProductionSettings,
  ProductionSummary,
} from "../types/production";
import {
  copyProduction,
  createProduction,
  summariseProduction,
} from "../lib/productionFactory";
import {
  normalizeLayout,
  normalizeProduction,
} from "../lib/productionNormalizer";
import {
  clearProductions,
  readLayouts,
  readProductions,
  removeProduction,
  writeProduction,
} from "../lib/productionStorage";
import { retainSources } from "../lib/cameraService";
import { retainRemoteCameras } from "../lib/remoteCameras";
import type { InputDevice } from "./cameraStore";
import { selectLayer } from "./editorStore";
import {
  INITIAL_PRODUCTION_STATE,
  cancelScheduledSave,
  documents,
  editProduction,
  flushSave,
  resetHistory,
  useProductionStore,
} from "./productionStore";

const LAST_PRODUCTION_KEY = "gospelstudio:studio-production";

const rememberProduction = (id: string): void => {
  try {
    localStorage.setItem(LAST_PRODUCTION_KEY, id);
  } catch {}
};

const rememberedProductionId = (): string | null => {
  try {
    return localStorage.getItem(LAST_PRODUCTION_KEY);
  } catch {
    return null;
  }
};

const byNewest = <T extends { updatedAt: string }>(items: T[]): T[] =>
  [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

const summaries = () =>
  byNewest([...documents.values()].map(summariseProduction));

const activate = (production: Production): void => {
  rememberProduction(production.id);
  useProductionStore.setState({
    production,
    productions: summaries(),
    saveState: "saved",
  });
  resetHistory();
  selectLayer(null);
};

const persistNew = async (production: Production): Promise<void> => {
  documents.set(production.id, production);
  activate(production);
  try {
    await writeProduction(production);
  } catch {
    useProductionStore.setState({ saveState: "failed" });
  }
};

let productionsLoad: Promise<void> | null = null;
let studioOpening: Promise<void> | null = null;

const readStoredProductions = async (): Promise<void> => {
  useProductionStore.setState({ status: "loading" });
  const [stored, layouts] = await Promise.all([
    readProductions(),
    readLayouts(),
  ]);
  documents.clear();
  for (const production of stored)
    documents.set(production.id, normalizeProduction(production));
  useProductionStore.setState({
    status: "ready",
    productions: summaries(),
    layouts: byNewest(layouts.map(normalizeLayout)),
  });
};

export const loadProductions = (): Promise<void> => {
  productionsLoad ??= readStoredProductions().catch((error: unknown) => {
    productionsLoad = null;
    throw error;
  });
  return productionsLoad;
};

const openActiveProduction = async (): Promise<void> => {
  await loadProductions();
  if (useProductionStore.getState().production) return;
  const remembered = documents.get(rememberedProductionId() ?? "");
  const active = remembered ?? byNewest([...documents.values()])[0];
  if (active) activate(active);
  else await persistNew(createProduction());
};

export const loadStudio = (): Promise<void> => {
  studioOpening ??= openActiveProduction().catch((error: unknown) => {
    studioOpening = null;
    throw error;
  });
  return studioOpening;
};

export const productionsFrom = (
  entries: ProductionSummary[],
  active: Production | null,
): Production[] =>
  entries.flatMap((entry) => {
    if (entry.id === active?.id) return [active];
    const stored = documents.get(entry.id);
    return stored ? [stored] : [];
  });

export const allProductions = (): Production[] => {
  const { productions, production } = useProductionStore.getState();
  return productionsFrom(productions, production);
};

interface ProductionImport {
  incoming: Production[];
  replaceAll: boolean;
  importedWins: boolean;
}

export const importProductions = async ({
  incoming,
  replaceAll,
  importedWins,
}: ProductionImport): Promise<void> => {
  await loadProductions();
  await flushSave();
  if (replaceAll) {
    await clearProductions();
    documents.clear();
  }
  for (const production of incoming) {
    if (!importedWins && documents.has(production.id)) continue;
    documents.set(production.id, production);
    await writeProduction(production);
  }

  const { production: active } = useProductionStore.getState();
  if (!active) {
    useProductionStore.setState({ productions: summaries() });
    return;
  }
  const replacement =
    documents.get(active.id) ?? byNewest([...documents.values()])[0];
  if (replacement) activate(replacement);
  else await persistNew(createProduction());
};

export const openProduction = async (id: string): Promise<void> => {
  const target = documents.get(id);
  if (!target) return;
  await flushSave();
  activate(documents.get(id) ?? target);
};

export const startNewProduction = async (name: string): Promise<void> => {
  await flushSave();
  await persistNew(createProduction(name.trim() || undefined));
};

const isActiveProduction = (id: string): boolean =>
  useProductionStore.getState().production?.id === id;

export const duplicateProduction = async (id: string): Promise<void> => {
  await flushSave();
  const { production } = useProductionStore.getState();
  const source = production?.id === id ? production : documents.get(id);
  if (!source) return;
  await persistNew(copyProduction(source, `${source.name} copy`));
};

const renameStoredProduction = async (
  id: string,
  name: string,
): Promise<void> => {
  const stored = documents.get(id);
  if (!stored || stored.name === name) return;
  const renamed: Production = { ...stored, name, updatedAt: now() };
  documents.set(id, renamed);
  useProductionStore.setState({ productions: summaries() });
  await writeProduction(renamed);
};

export const renameProduction = async (
  id: string,
  name: string,
): Promise<void> => {
  const trimmed = name.trim();
  if (!trimmed) return;
  if (!isActiveProduction(id)) {
    await renameStoredProduction(id, trimmed);
    return;
  }
  editProduction(
    (production) =>
      production.name === trimmed
        ? production
        : { ...production, name: trimmed },
    { record: false },
  );
};

export const deleteProduction = async (id: string): Promise<void> => {
  const { production } = useProductionStore.getState();
  documents.delete(id);
  await removeProduction(id);
  if (production?.id !== id) {
    useProductionStore.setState({ productions: summaries() });
    return;
  }
  cancelScheduledSave();
  const next = byNewest([...documents.values()])[0];
  if (next) activate(next);
  else await persistNew(createProduction());
};

export const updateSettings = (patch: Partial<ProductionSettings>): void =>
  editProduction(
    (production) => ({
      ...production,
      settings: { ...production.settings, ...patch },
    }),
    { record: false },
  );

const isUnassignedCamera = (layer: Layer): boolean =>
  layer.type === "camera" && layer.sourceId === null;

const withSource = (
  production: Production,
  source: MediaSource,
): Production => ({
  ...production,
  sources: [
    source,
    ...production.sources.filter((entry) => entry.id !== source.id),
  ],
  scenes: production.scenes.map((scene) =>
    scene.layers.some(isUnassignedCamera)
      ? {
          ...scene,
          layers: scene.layers.map((layer) =>
            isUnassignedCamera(layer)
              ? { ...layer, sourceId: source.id }
              : layer,
          ),
        }
      : scene,
  ),
});

export const chooseCameraDevice = (device: InputDevice): string => {
  const { production } = useProductionStore.getState();
  if (!production) return "";
  const existing = production.sources
    .filter(isLocalCamera)
    .find((source) => source.deviceId === device.deviceId);
  const source: CameraSource = existing ?? {
    id: uid(),
    name: device.label,
    type: "camera",
    deviceId: device.deviceId,
    audioDeviceId: null,
    deviceLabel: device.label,
  };
  editProduction((current) => withSource(current, source));
  return source.id;
};

export const saveRemoteCamera = (
  sourceId: string,
  deviceName: string,
): void => {
  editProduction((current) => {
    const previous = current.sources.find((entry) => entry.id === sourceId);
    const source: RemoteCameraSource = {
      id: sourceId,
      name: deviceName,
      type: "remote",
      deviceLabel: deviceName,
      muted: previous?.type === "remote" && previous.muted,
    };
    return withSource(current, source);
  });
};

export const setDeviceSoundMuted = (sourceId: string, muted: boolean): void =>
  editProduction(
    (production) => ({
      ...production,
      sources: production.sources.map((source) =>
        source.id === sourceId && source.type === "remote"
          ? { ...source, muted }
          : source,
      ),
    }),
    { record: false },
  );

export const updateLocalCamera = (
  sourceId: string,
  patch: Partial<Omit<CameraSource, "id" | "type">>,
): void =>
  editProduction((production) => ({
    ...production,
    sources: production.sources.map((source) =>
      source.id === sourceId && isLocalCamera(source)
        ? { ...source, ...patch }
        : source,
    ),
  }));

export const resetStudio = (): void => {
  cancelScheduledSave();
  productionsLoad = null;
  studioOpening = null;
  documents.clear();
  retainSources([]);
  retainRemoteCameras(new Set());
  useProductionStore.setState({ ...INITIAL_PRODUCTION_STATE });
  selectLayer(null);
};
