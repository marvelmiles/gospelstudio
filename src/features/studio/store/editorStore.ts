import { create } from "zustand";
import type { Guide } from "../lib/snapping";

export type SidebarView = "items" | "add" | "scene";

interface EditorStoreState {
  selectedLayerId: string | null;
  guides: Guide[];
  isStudioOpen: boolean;
  sidebarView: SidebarView;
}

export const useEditorStore = create<EditorStoreState>()(() => ({
  selectedLayerId: null,
  guides: [],
  isStudioOpen: false,
  sidebarView: "items",
}));

const NO_GUIDES: Guide[] = [];

export const selectLayer = (layerId: string | null): void =>
  useEditorStore.setState((state) =>
    state.selectedLayerId === layerId
      ? state
      : layerId
        ? { selectedLayerId: layerId, sidebarView: "items" }
        : { selectedLayerId: null },
  );

export const showSidebarView = (sidebarView: SidebarView): void =>
  useEditorStore.setState({ sidebarView, selectedLayerId: null });

export const showGuides = (guides: Guide[]): void =>
  useEditorStore.setState((state) =>
    guides.length === 0 && state.guides.length === 0
      ? state
      : { guides: guides.length ? guides : NO_GUIDES },
  );

export const clearGuides = (): void => showGuides(NO_GUIDES);

export const setStudioOpen = (isStudioOpen: boolean): void =>
  useEditorStore.setState({ isStudioOpen });
