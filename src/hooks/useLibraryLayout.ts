import { useLocalStorage } from "usehooks-ts";

export type LibraryLayout = "grid" | "list";

export interface LibraryLayoutState {
  layout: LibraryLayout;
  setLayout: (layout: LibraryLayout) => void;
}

export const useLibraryLayout = (library: string): LibraryLayoutState => {
  const [layout, setLayout] = useLocalStorage<LibraryLayout>(
    `gospelstudio:library-layout:${library}`,
    "grid",
  );
  return { layout, setLayout };
};
