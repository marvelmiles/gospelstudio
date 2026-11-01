import { create } from "zustand";

interface PipStoreState {
  openLayerIds: readonly string[];
  pausedLayerIds: ReadonlySet<string>;
}

export const usePipStore = create<PipStoreState>()(() => ({
  openLayerIds: [],
  pausedLayerIds: new Set<string>(),
}));

export const openItemPip = (layerId: string): void =>
  usePipStore.setState((state) =>
    state.openLayerIds.includes(layerId)
      ? state
      : { openLayerIds: [...state.openLayerIds, layerId] },
  );

export const closeItemPip = (layerId: string): void =>
  usePipStore.setState((state) => ({
    openLayerIds: state.openLayerIds.filter((id) => id !== layerId),
  }));

export const toggleAutoPlayPaused = (layerId: string): void =>
  usePipStore.setState((state) => {
    const pausedLayerIds = new Set(state.pausedLayerIds);
    if (pausedLayerIds.has(layerId)) pausedLayerIds.delete(layerId);
    else pausedLayerIds.add(layerId);
    return { pausedLayerIds };
  });

export const useIsAutoPlayPaused = (layerId: string): boolean =>
  usePipStore((state) => state.pausedLayerIds.has(layerId));
