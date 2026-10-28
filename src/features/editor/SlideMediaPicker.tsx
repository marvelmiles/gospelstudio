import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Film, Image as ImageIcon, Upload } from "lucide-react";
import type { MediaKind } from "../../types";
import { useStore } from "../../store/useStore";
import {
  formatDuration,
  isImageBackground,
  mediaPlayLength,
  sortMediaByRecency,
} from "../../lib/media";
import { backgroundChoice, mediaItemChoice } from "../../lib/slideMedia";
import type { SlideMediaChoice } from "../../lib/slideMedia";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { SearchInput } from "../../components/ui/SearchInput";
import { EmptyState } from "../../components/ui/EmptyState";
import { LazyMount } from "../../components/ui/LazyMount";
import { LibrarySection } from "../../components/ui/LibrarySection";
import { BgSwatch } from "../../components/controls/BgSwatch";
import { ImageSurface } from "../../components/media/ImageSurface";
import { VideoThumb } from "../../components/media/VideoThumb";
import { formatCount } from "../../lib/formatNumber";

interface SlideMediaPickerProps {
  kind: MediaKind;
  onPick: (choice: SlideMediaChoice) => void;
  onClose: () => void;
}

const COPY: Record<
  MediaKind,
  { title: string; upload: string; empty: string; uploadsHint: string }
> = {
  image: {
    title: "Add Image to Slide",
    upload: "Upload image",
    empty:
      "Upload a picture, or add one to the asset library, to place it on the slide.",
    uploadsHint: "Pictures from your Images page.",
  },
  video: {
    title: "Add Video to Slide",
    upload: "Upload video",
    empty: "Upload a clip to place it on the slide.",
    uploadsHint: "Clips from your Videos page.",
  },
};

const ASSETS_HINT = "Picture backgrounds saved in the asset library.";

const matches = (name: string, term: string): boolean =>
  !term || name.toLowerCase().includes(term);

export const SlideMediaPicker = ({
  kind,
  onPick,
  onClose,
}: SlideMediaPickerProps) => {
  const media = useStore((s) => s.media);
  const backgrounds = useStore((s) => s.backgrounds);
  const beginUpload = useStore((s) => s.beginUpload);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  const term = query.trim().toLowerCase();

  const uploads = useMemo(
    () =>
      media
        .filter((item) => item.kind === kind && matches(item.name, term))
        .sort(sortMediaByRecency),
    [media, kind, term],
  );

  const assets = useMemo(
    () =>
      kind === "image"
        ? backgrounds.filter(
            (background) =>
              isImageBackground(background) && matches(background.name, term),
          )
        : [],
    [backgrounds, kind, term],
  );

  const pick = (choice: SlideMediaChoice) => {
    onPick(choice);
    onClose();
  };

  const upload = (files: File[]) => {
    if (!files.length) return;
    beginUpload(kind, files, (ids) => {
      const saved = useStore
        .getState()
        .media.find((item) => item.id === ids[0]);
      if (saved) pick(mediaItemChoice(saved));
    });
  };

  return (
    <Modal open onClose={onClose} title={COPY[kind].title} width={720}>
      <div className="mb-4 flex flex-wrap gap-2.5">
        <div className="min-w-45 flex-1">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={`Search ${kind === "image" ? "images" : "videos"}…`}
          />
        </div>
        <Button variant="primary" onClick={() => inputRef.current?.click()}>
          <Upload size={15} />
          {COPY[kind].upload}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={`${kind}/*`}
        hidden
        onChange={(event) => {
          upload(Array.from(event.target.files || []));
          event.target.value = "";
        }}
      />

      {!uploads.length && !assets.length ? (
        <EmptyState
          icon={kind === "image" ? ImageIcon : Film}
          title={term ? "Nothing matches" : "Nothing to place yet"}
          message={term ? "Try a different search." : COPY[kind].empty}
          compact
          bare
        />
      ) : (
        <div className="flex flex-col gap-3.5">
          {uploads.length > 0 && (
            <LibrarySection
              title="Media library"
              meta={formatCount(uploads.length)}
              description={COPY[kind].uploadsHint}
            >
              <PickerGrid>
                {uploads.map((item) => (
                  <PickerTile
                    key={item.id}
                    name={item.name}
                    meta={
                      item.kind === "video"
                        ? formatDuration(mediaPlayLength(item))
                        : undefined
                    }
                    onPick={() => pick(mediaItemChoice(item))}
                  >
                    {item.kind === "image" ? (
                      <ImageSurface item={item} variant="thumb" />
                    ) : (
                      <VideoThumb item={item} />
                    )}
                  </PickerTile>
                ))}
              </PickerGrid>
            </LibrarySection>
          )}
          {assets.length > 0 && (
            <LibrarySection
              title="Asset library"
              meta={formatCount(assets.length)}
              description={ASSETS_HINT}
            >
              <PickerGrid>
                {assets.map((background) => (
                  <PickerTile
                    key={background.id}
                    name={background.name}
                    onPick={() => pick(backgroundChoice(background))}
                  >
                    <BgSwatch bg={background} className="absolute inset-0" />
                  </PickerTile>
                ))}
              </PickerGrid>
            </LibrarySection>
          )}
        </div>
      )}
    </Modal>
  );
};

const PickerGrid = ({ children }: { children: ReactNode }) => (
  <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
    {children}
  </div>
);

const PickerTile = ({
  name,
  meta,
  onPick,
  children,
}: {
  name: string;
  meta?: string;
  onPick: () => void;
  children: ReactNode;
}) => (
  <button
    onClick={onPick}
    title={name}
    className="overflow-hidden rounded-[11px] border border-line bg-raise p-0 text-left hover:border-accent/50"
  >
    <div className="relative aspect-video bg-black">
      <LazyMount>{children}</LazyMount>
    </div>
    <div className="truncate px-2.5 py-2 text-[12.5px] text-fg">
      {name}
      {meta && (
        <span className="text-dim">
          {" · "}
          {meta}
        </span>
      )}
    </div>
  </button>
);
