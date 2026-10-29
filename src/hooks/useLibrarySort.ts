import { useSessionStorage } from "usehooks-ts";
import {
  DEFAULT_LIBRARY_SORT,
  isLibrarySortOption,
  type LibrarySortOption,
} from "../lib/librarySort";

const readStoredSort = (stored: string): LibrarySortOption => {
  try {
    const parsed: unknown = JSON.parse(stored);
    return isLibrarySortOption(parsed) ? parsed : DEFAULT_LIBRARY_SORT;
  } catch {
    return DEFAULT_LIBRARY_SORT;
  }
};

export const useLibrarySort = (
  library: string,
): [LibrarySortOption, (sort: LibrarySortOption) => void] => {
  const [sort, setSort] = useSessionStorage<LibrarySortOption>(
    `gospelstudio:library-sort:${library}`,
    DEFAULT_LIBRARY_SORT,
    { deserializer: readStoredSort },
  );
  return [sort, setSort];
};
