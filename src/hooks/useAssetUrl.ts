import { useBlobUrl } from "../lib/blobUrls";

interface BinaryAsset {
  blobId?: string;
  src?: string;
}

export const useAssetUrl = (
  asset: BinaryAsset | undefined | null,
): string | null => {
  const blobUrl = useBlobUrl(asset?.blobId);
  if (!asset) return null;
  if (asset.blobId) return blobUrl;
  return asset.src || null;
};
