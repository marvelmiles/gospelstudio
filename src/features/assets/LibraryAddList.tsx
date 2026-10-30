import { useMemo } from "react";
import { Plus } from "lucide-react";
import type { MediaKind } from "../../types";
import { useStore } from "../../store/useStore";
import { formatDuration, mediaPlayLength } from "../../lib/media";
import type { LibrarySortOption } from "../../lib/librarySort";
import { formatCount } from "../../lib/formatNumber";
import { LazyMount } from "@/components/shared/LazyMount";
import { LibrarySection } from "@/components/shared/LibrarySection";
import { ImageSurface } from "../../components/media/ImageSurface";
import { VideoThumb } from "../../components/media/VideoThumb";
import { AssetTile } from "./AssetTile";
import { sortAssets } from "./assetSort";
import {
  assetGridClassName,
  assetPillButtonClassName,
} from "./assetCardStyles";

interface LibraryAddListProps {
  kind: MediaKind;
  title: string;
  description: string;
  addedMediaIds: ReadonlySet<string>;
  addLabel: string;
  sort: LibrarySortOption;
  attentionId: string | null;
  onAdd: (mediaId: string) => void;
}

export const LibraryAddList = ({
  kind,
  title,
  description,
  addedMediaIds,
  addLabel,
  sort,
  attentionId,
  onAdd,
}: LibraryAddListProps) => {
  const media = useStore((s) => s.media);

  const available = useMemo(
    () =>
      sortAssets(
        media.filter(
          (item) => item.kind === kind && !addedMediaIds.has(item.id),
        ),
        sort,
      ),
    [addedMediaIds, kind, media, sort],
  );

  if (!available.length) return null;

  return (
    <LibrarySection
      title={title}
      meta={formatCount(available.length)}
      description={description}
    >
      <div className={assetGridClassName}>
        {available.map((item) => {
          const playLength = mediaPlayLength(item);
          return (
            <AssetTile
              key={item.id}
              id={item.id}
              name={item.name}
              highlighted={item.id === attentionId}
              detail={playLength ? formatDuration(playLength) : undefined}
              preview={
                <LazyMount>
                  {item.kind === "image" ? (
                    <ImageSurface item={item} variant="thumb" />
                  ) : (
                    <VideoThumb item={item} applySettings />
                  )}
                </LazyMount>
              }
              footerAction={
                <button
                  type="button"
                  title={`${addLabel}: ${item.name}`}
                  onClick={() => onAdd(item.id)}
                  className={assetPillButtonClassName}
                >
                  <Plus size={12} />
                  {addLabel}
                </button>
              }
            />
          );
        })}
      </div>
    </LibrarySection>
  );
};
