import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Image as ImageIcon, Library, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SlideMediaSource } from "../../types";
import { useStore } from "../../store/useStore";
import { isImageBackground } from "../../lib/media";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { LibrarySection } from "../../components/ui/LibrarySection";
import { SegmentedTabs } from "../../components/ui/SegmentedTabs";
import type { SegmentedTab } from "../../components/ui/SegmentedTabs";
import { SearchInput } from "../../components/ui/SearchInput";
import { ImageSurface } from "../../components/media/ImageSurface";
import { BgSwatch } from "../../components/controls/BgSwatch";
import type { OverlayImageRef } from "./lib/overlayAppearance";
import { formatCount } from "../../lib/formatNumber";

export interface OverlayImageChoice extends OverlayImageRef {
  name: string;
}

interface PickableImage extends OverlayImageChoice {
  preview: ReactNode;
}

const SOURCE_COPY: Record<
  SlideMediaSource,
  { label: string; icon: LucideIcon; description: string; empty: string }
> = {
  media: {
    label: "Media library",
    icon: ImageIcon,
    description: "Pictures uploaded on your Images page.",
    empty: "Upload a picture in the Media library and it will appear here.",
  },
  background: {
    label: "Asset library",
    icon: Library,
    description: "Picture backgrounds saved in the asset library.",
    empty: "Add a picture background in the asset library to use it here.",
  },
};

export const OverlayImagePicker = ({
  open,
  title = "Add a picture",
  onPick,
  onClose,
  onClear,
}: {
  open: boolean;
  title?: string;
  onPick: (choice: OverlayImageChoice) => void;
  onClose: () => void;
  onClear?: () => void;
}) => {
  const media = useStore((s) => s.media);
  const backgrounds = useStore((s) => s.backgrounds);
  const [source, setSource] = useState<SlideMediaSource>("media");
  const [query, setQuery] = useState("");

  const mediaImages = useMemo<PickableImage[]>(
    () =>
      media
        .filter((item) => item.kind === "image")
        .map((item) => ({
          id: item.id,
          name: item.name,
          source: "media" as const,
          preview: <ImageSurface item={item} variant="thumb" />,
        })),
    [media],
  );

  const assetImages = useMemo<PickableImage[]>(
    () =>
      backgrounds.filter(isImageBackground).map((background) => ({
        id: background.id,
        name: background.name,
        source: "background" as const,
        preview: <BgSwatch bg={background} className="size-full" />,
      })),
    [backgrounds],
  );

  const items = source === "media" ? mediaImages : assetImages;

  const tabs: SegmentedTab<SlideMediaSource>[] = [
    {
      id: "media",
      label: SOURCE_COPY.media.label,
      icon: SOURCE_COPY.media.icon,
      count: mediaImages.length,
    },
    {
      id: "background",
      label: SOURCE_COPY.background.label,
      icon: SOURCE_COPY.background.icon,
      count: assetImages.length,
    },
  ];

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) => item.name.toLowerCase().includes(needle));
  }, [items, query]);

  if (!open) return null;

  return (
    <Modal open onClose={onClose} title={title} width={520}>
      <div className="flex flex-col gap-3.5">
        <SegmentedTabs<SlideMediaSource>
          ariaLabel="Picture sources"
          tabs={tabs}
          value={source}
          onChange={setSource}
        />

        <LibrarySection
          title={SOURCE_COPY[source].label}
          meta={`${formatCount(filtered.length)} of ${formatCount(items.length)}`}
          description={SOURCE_COPY[source].description}
          action={
            onClear && (
              <Button
                variant="subtle"
                size="sm"
                onClick={() => {
                  onClear();
                  onClose();
                }}
              >
                <X size={14} />
                No picture
              </Button>
            )
          }
        >
          <div className="mb-3">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search pictures…"
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={SOURCE_COPY[source].icon}
              title={items.length === 0 ? "Nothing here yet" : "No matches"}
              message={
                items.length === 0
                  ? SOURCE_COPY[source].empty
                  : "Try a different search."
              }
              compact
              bare
            />
          ) : (
            <div className="flex max-h-85 flex-col gap-1.5 overflow-y-auto">
              {filtered.map((item) => (
                <button
                  key={`${item.source}:${item.id}`}
                  onClick={() => onPick(item)}
                  className="flex w-full items-center gap-2.75 rounded-[11px] border border-line bg-canvas p-1.75 text-left text-[13.5px] font-semibold text-fg"
                >
                  <span className="relative h-8.5 w-15 shrink-0 overflow-hidden rounded-[7px] bg-raise">
                    {item.preview}
                  </span>
                  <span className="min-w-0 truncate">{item.name}</span>
                </button>
              ))}
            </div>
          )}
        </LibrarySection>
      </div>
    </Modal>
  );
};
