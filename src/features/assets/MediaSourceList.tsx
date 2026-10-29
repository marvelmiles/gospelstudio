import { useMemo, useRef, useState } from "react";
import {
  Check,
  Film,
  Image as ImageIcon,
  Layers,
  Pencil,
  Plus,
  Upload,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MediaKind } from "../../types";
import { cn } from "../../lib/utils";
import { useStore } from "../../store/useStore";
import { ATTENTION_CLASS, attentionAttribute } from "../../hooks/useAttention";
import {
  formatDuration,
  mediaPlayLength,
  sortMediaByRecency,
} from "../../lib/media";
import routes from "../../routes";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { LazyMount } from "@/components/shared/LazyMount";
import { LibrarySection } from "@/components/shared/LibrarySection";
import { SegmentedTabs } from "@/components/shared/SegmentedTabs";
import { ImageSurface } from "../../components/media/ImageSurface";
import { VideoThumb } from "../../components/media/VideoThumb";
import type { AssetSection } from "./assetLibraryNavigation";
import { useOpenAssetEditor } from "./assetLibraryNavigation";
import {
  assetGridClassName,
  cardOverlayButtonClassName,
} from "./assetCardStyles";
import { formatCount } from "../../lib/formatNumber";

type SourceFilter = "all" | "added";

interface KindCopy {
  icon: LucideIcon;
  libraryLabel: string;
  uploadLabel: string;
  accept: string;
  editTitle: string;
  emptyTitle: string;
}

const COPY: Record<MediaKind, KindCopy> = {
  image: {
    icon: ImageIcon,
    libraryLabel: "Images library",
    uploadLabel: "Upload images",
    accept: "image/*",
    editTitle: "Edit in Images",
    emptyTitle: "No images here",
  },
  video: {
    icon: Film,
    libraryLabel: "Videos library",
    uploadLabel: "Upload videos",
    accept: "video/*",
    editTitle: "Edit in Videos",
    emptyTitle: "No videos here",
  },
};

interface MediaSourceListProps {
  kind: MediaKind;
  title: string;
  description: string;
  attentionId: string | null;
  addedByMediaId: Map<string, string>;
  onAdd: (mediaId: string) => void;
  onRemove: (entryId: string) => void;
  addLabel: string;
  addedLabel: string;
  addedFilterLabel: string;
  section: AssetSection;
  filterable?: boolean;
  emptyMessage: string;
}

export const MediaSourceList = ({
  kind,
  title,
  description,
  attentionId,
  addedByMediaId,
  onAdd,
  onRemove,
  addLabel,
  addedLabel,
  addedFilterLabel,
  section,
  filterable,
  emptyMessage,
}: MediaSourceListProps) => {
  const media = useStore((s) => s.media);
  const beginUpload = useStore((s) => s.beginUpload);
  const openEditor = useOpenAssetEditor();
  const fileInput = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<SourceFilter>("all");

  const copy = COPY[kind];

  const library = useMemo(
    () => media.filter((item) => item.kind === kind).sort(sortMediaByRecency),
    [media, kind],
  );

  const items = useMemo(
    () =>
      filter === "all"
        ? library
        : library.filter((item) => addedByMediaId.has(item.id)),
    [addedByMediaId, filter, library],
  );

  const upload = (files: File[]) =>
    beginUpload(kind, files, (ids) => {
      for (const id of ids) if (id) onAdd(id);
    });

  return (
    <LibrarySection
      title={title}
      meta={`${formatCount(items.length)} of ${formatCount(library.length)}`}
      description={description}
      action={
        <Button size="sm" onClick={() => fileInput.current?.click()}>
          <Upload size={14} />
          {copy.uploadLabel}
        </Button>
      }
    >
      <input
        ref={fileInput}
        type="file"
        accept={copy.accept}
        multiple
        hidden
        onChange={(event) => {
          const files = Array.from(event.target.files || []);
          if (files.length) upload(files);
          event.target.value = "";
        }}
      />

      {filterable && (
        <div className="mb-3.5">
          <SegmentedTabs<SourceFilter>
            ariaLabel={`${copy.libraryLabel} filter`}
            tabs={[
              {
                id: "all",
                label: copy.libraryLabel,
                icon: copy.icon,
                count: library.length,
              },
              {
                id: "added",
                label: addedFilterLabel,
                icon: Layers,
                count: addedByMediaId.size,
              },
            ]}
            value={filter}
            onChange={setFilter}
            minSegmentWidth={150}
          />
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={copy.icon}
          title={copy.emptyTitle}
          message={emptyMessage}
          compact
          bare
        />
      ) : (
        <div className={assetGridClassName}>
          {items.map((item) => {
            const entryId = addedByMediaId.get(item.id);
            const added = Boolean(entryId);
            return (
              <div
                key={item.id}
                {...attentionAttribute(item.id)}
                className={cn(
                  "relative rounded-[11px]",
                  item.id === attentionId && ATTENTION_CLASS,
                )}
              >
                <div
                  className={cn(
                    "relative aspect-video overflow-hidden rounded-[9px] border-[1.5px] bg-black",
                    added ? "border-primary" : "border-border",
                  )}
                >
                  <LazyMount>
                    {item.kind === "image" ? (
                      <ImageSurface item={item} variant="thumb" />
                    ) : (
                      <VideoThumb item={item} applySettings />
                    )}
                  </LazyMount>
                  <button
                    onClick={() =>
                      openEditor(routes.mediaItem(item.kind, item.id), section)
                    }
                    aria-label={`Edit ${item.name}`}
                    title={copy.editTitle}
                    className={cn(
                      cardOverlayButtonClassName,
                      "absolute top-1.5 right-1.5",
                    )}
                  >
                    <Pencil size={13} />
                  </button>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-1.5">
                  <div className="min-w-0">
                    <div className="truncate text-xs text-foreground">
                      {item.name}
                    </div>
                    {mediaPlayLength(item) ? (
                      <div className="text-[11.5px] text-muted-foreground tabular-nums">
                        {formatDuration(mediaPlayLength(item))}
                      </div>
                    ) : null}
                  </div>
                  <button
                    onClick={() =>
                      entryId ? onRemove(entryId) : onAdd(item.id)
                    }
                    aria-pressed={added}
                    title={
                      added ? `Remove ${item.name}` : `${addLabel} ${item.name}`
                    }
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.25 rounded-full border px-2.25 py-1 text-[11.5px] font-semibold",
                      added
                        ? "border-primary/40 bg-primary/16 text-primary-soft"
                        : "border-border bg-transparent text-muted-foreground",
                    )}
                  >
                    {added ? <Check size={12} /> : <Plus size={12} />}
                    {added ? addedLabel : addLabel}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </LibrarySection>
  );
};
