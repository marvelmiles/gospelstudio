import { sortLibrary, type LibrarySortOption } from "../../lib/librarySort";

interface DatedAsset {
  name: string;
  builtIn?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const SHIPPED_STAMP = new Date(0).toISOString();

const stampsOf = ({ builtIn, createdAt, updatedAt }: DatedAsset) => {
  if (!builtIn) {
    const created = createdAt ?? SHIPPED_STAMP;
    return { createdAt: created, updatedAt: updatedAt ?? created };
  }
  const edited = updatedAt && updatedAt !== createdAt;
  return {
    createdAt: SHIPPED_STAMP,
    updatedAt: edited ? updatedAt : SHIPPED_STAMP,
  };
};

export const sortAssets = <T extends DatedAsset>(
  assets: T[],
  option: LibrarySortOption,
): T[] =>
  sortLibrary(
    assets.map((asset) => ({ asset, ...stampsOf(asset) })),
    option,
    (entry) => entry.asset.name,
  ).map((entry) => entry.asset);
