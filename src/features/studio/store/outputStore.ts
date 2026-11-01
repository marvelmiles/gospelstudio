import { create } from "zustand";

interface OutputStoreState {
  isConnected: boolean;
  isTesting: boolean;
}

export const useOutputStore = create<OutputStoreState>()(() => ({
  isConnected: false,
  isTesting: false,
}));
