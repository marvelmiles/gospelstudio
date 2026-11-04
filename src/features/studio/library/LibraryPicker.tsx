import {
  memo,
  useDeferredValue,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  FileText,
  Film,
  Image as ImageIcon,
  Wallpaper,
  type LucideIcon,
} from "lucide-react";
import type { Background, Manuscript, MediaItem } from "../../../types";
import { useStore } from "../../../store/useStore";
import { useMediaLibrary } from "../../../hooks/useMediaLibrary";
import { useIncrementalList } from "../../../hooks/useIncrementalList";
import { buildSearchIndex, matchesSearch } from "../../../lib/search";
import { cn } from "../../../lib/utils";
import { Modal } from "@/components/shared/Modal";
import { EmptyState } from "@/components/shared/EmptyState";
import { LazyMount } from "@/components/shared/LazyMount";
import { LoadMoreFooter } from "@/components/shared/LoadMoreFooter";
import { SearchInput } from "@/components/shared/SearchInput";
import { ImageSurface } from "../../../components/media/ImageSurface";
import { VideoThumb } from "../../../components/media/VideoThumb";
import { BgSwatch } from "../../../components/controls/BgSwatch";

export type LibraryKind = "manuscript" | "image" | "video" | "background";

export interface LibraryChoice {
  id: string;
  name: string;
}

interface PickerEntry {
  id: string;
  name: string;
  detail?: string;
  searchIndex: string;
  preview?: ReactNode;
}

interface KindCopy {
  title: string;
  icon: LucideIcon;
  search: string;
  empty: string;
  noun: string;
}

const COPY: Record<LibraryKind, KindCopy> = {
  manuscript: {
    title: "Choose a manuscript",
    icon: FileText,
    search: "Search manuscripts by title or author",
    empty: "Add a manuscript on the Manuscripts page and it appears here.",
    noun: "manuscripts",
  },
  image: {
    title: "Choose an image",
    icon: ImageIcon,
    search: "Search images",
    empty: "Upload an image on the Images page and it appears here.",
    noun: "images",
  },
  video: {
    title: "Choose a video",
    icon: Film,
    search: "Search videos",
    empty: "Upload a video on the Videos page and it appears here.",
    noun: "videos",
  },
  background: {
    title: "Choose a background",
    icon: Wallpaper,
    search: "Search backgrounds",
    empty: "Add a background in the asset library and it appears here.",
    noun: "backgrounds",
  },
};

const manuscriptEntry = (manuscript: Manuscript): PickerEntry => {
  const detail = [manuscript.author, manuscript.collection]
    .filter(Boolean)
    .join(" · ");
  return {
    id: manuscript.id,
    name: manuscript.title,
    detail: detail || `${manuscript.slides.length} slides`,
    searchIndex: buildSearchIndex([
      manuscript.title,
      manuscript.author,
      manuscript.collection,
    ]),
  };
};

const mediaEntry = (item: MediaItem): PickerEntry => ({
  id: item.id,
  name: item.name,
  detail: item.builtIn ? "Built in" : undefined,
  searchIndex: buildSearchIndex([item.name]),
  preview:
    item.kind === "image" ? (
      <ImageSurface item={item} variant="thumb" />
    ) : (
      <VideoThumb item={item} applySettings />
    ),
});

const backgroundEntry = (background: Background): PickerEntry => ({
  id: background.id,
  name: background.name,
  detail: background.category,
  searchIndex: buildSearchIndex([background.name, background.category]),
  preview: <BgSwatch bg={background} className="size-full" />,
});

const useEntries = (kind: LibraryKind | null): PickerEntry[] => {
  const manuscripts = useStore((state) => state.manuscripts);
  const backgrounds = useStore((state) => state.backgrounds);
  const { media, builtInMedia } = useMediaLibrary();

  return useMemo(() => {
    switch (kind) {
      case "manuscript":
        return manuscripts
          .filter((manuscript) => !manuscript.deleted)
          .map(manuscriptEntry);
      case "image":
      case "video":
        return [...media, ...builtInMedia]
          .filter((item) => item.kind === kind)
          .map(mediaEntry);
      case "background":
        return backgrounds.map(backgroundEntry);
      default:
        return [];
    }
  }, [kind, manuscripts, media, builtInMedia, backgrounds]);
};

interface LibraryPickerProps {
  kind: LibraryKind | null;
  onPick: (choice: LibraryChoice) => void;
  onClose: () => void;
}

export const LibraryPicker = ({
  kind,
  onPick,
  onClose,
}: LibraryPickerProps) => {
  const entries = useEntries(kind);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const filtered = useMemo(
    () =>
      entries.filter((entry) =>
        matchesSearch(entry.searchIndex, deferredQuery),
      ),
    [entries, deferredQuery],
  );
  const list = useIncrementalList(filtered, `${kind}:${deferredQuery}`);

  if (!kind) return null;
  const copy = COPY[kind];
  const isVisual = kind !== "manuscript";

  const choose = (entry: PickerEntry) => {
    onPick({ id: entry.id, name: entry.name });
    setQuery("");
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={copy.title}
      width={isVisual ? 720 : 520}
    >
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder={copy.search}
        className="mb-3.5 min-w-0"
      />
      {filtered.length === 0 ? (
        <EmptyState
          icon={copy.icon}
          title={entries.length === 0 ? "Nothing here yet" : "No matches"}
          message={
            entries.length === 0 ? copy.empty : "Try a different search."
          }
          compact
          bare
        />
      ) : (
        <>
          <div
            className={cn(
              isVisual
                ? "grid grid-cols-[repeat(auto-fill,minmax(min(150px,100%),1fr))] gap-2.5"
                : "flex flex-col gap-1.5",
            )}
          >
            {list.visibleItems.map((entry) => (
              <EntryButton
                key={entry.id}
                entry={entry}
                isVisual={isVisual}
                icon={copy.icon}
                onChoose={choose}
              />
            ))}
          </div>
          <LoadMoreFooter list={list} noun={copy.noun} />
        </>
      )}
    </Modal>
  );
};

interface EntryButtonProps {
  entry: PickerEntry;
  isVisual: boolean;
  icon: LucideIcon;
  onChoose: (entry: PickerEntry) => void;
}

const EntryButton = memo(
  ({ entry, isVisual, icon: Icon, onChoose }: EntryButtonProps) =>
    isVisual ? (
      <button
        type="button"
        onClick={() => onChoose(entry)}
        className="flex flex-col gap-1.5 rounded-xl border border-border bg-background p-1.5 text-left transition-colors hover:border-primary/45"
      >
        <span className="relative block aspect-video w-full overflow-hidden rounded-lg bg-thumbnail">
          <LazyMount>{entry.preview}</LazyMount>
        </span>
        <span className="px-0.5">
          <span className="block truncate text-[12.5px] font-semibold text-foreground">
            {entry.name}
          </span>
          {entry.detail && (
            <span className="block truncate text-[11px] text-subtle-foreground">
              {entry.detail}
            </span>
          )}
        </span>
      </button>
    ) : (
      <button
        type="button"
        onClick={() => onChoose(entry)}
        className="flex w-full items-center gap-2.75 rounded-[11px] border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-primary/45"
      >
        <Icon size={16} className="shrink-0 text-primary-soft" />
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] font-semibold text-foreground">
            {entry.name}
          </span>
          {entry.detail && (
            <span className="block truncate text-[11.5px] text-subtle-foreground">
              {entry.detail}
            </span>
          )}
        </span>
      </button>
    ),
);

EntryButton.displayName = "EntryButton";
