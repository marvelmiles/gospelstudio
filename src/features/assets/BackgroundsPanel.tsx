import { useMemo, useRef, useState } from "react";
import {
  Film,
  Image as ImageIcon,
  Palette,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Background, MediaItem, MediaKind } from "../../types";
import { useStore } from "../../store/useStore";
import { useMediaLibrary } from "../../hooks/useMediaLibrary";
import { useLibrarySort } from "../../hooks/useLibrarySort";
import {
  findMediaItem,
  isImageBackground,
  type MediaLibrary,
} from "../../lib/media";
import type { LibrarySortOption } from "../../lib/librarySort";
import { formatCount } from "../../lib/formatNumber";
import routes from "../../routes";
import { Button } from "@/components/ui/button";
import { LibrarySection } from "@/components/shared/LibrarySection";
import { LibrarySortSelect } from "@/components/shared/LibrarySortSelect";
import { SegmentedTabs } from "@/components/shared/SegmentedTabs";
import type { SegmentedTab } from "@/components/shared/SegmentedTabs";
import { pillTabPanelProps } from "@/components/shared/tabPanel";
import { BgSwatch } from "../../components/controls/BgSwatch";
import { CustomColorPicker } from "../../components/controls/CustomColorPicker";
import { useOpenAssetEditor } from "./assetLibraryNavigation";
import { AssetTile } from "./AssetTile";
import { sortAssets } from "./assetSort";
import { LibraryAddList } from "./LibraryAddList";
import { RenameBackgroundModal } from "./RenameBackgroundModal";
import {
  assetGridClassName,
  cardOverlayButtonClassName,
} from "./assetCardStyles";

type BackgroundKind = "images" | "videos" | "colors";

interface KindCopy {
  label: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

const KINDS: Record<BackgroundKind, KindCopy> = {
  images: {
    label: "Images",
    icon: ImageIcon,
    title: "Image backgrounds",
    description:
      "Pictures you can set behind any slide. Upload your own or add one from your Images page.",
  },
  videos: {
    label: "Videos",
    icon: Film,
    title: "Video backgrounds",
    description:
      "Motion loops that play silently behind your slides. Upload a clip or add one from your Videos page.",
  },
  colors: {
    label: "Colors",
    icon: Palette,
    title: "Colors and gradients",
    description:
      "Solid colors and gradients. Pick a preset or write any CSS color of your own.",
  },
};

const KIND_ORDER: BackgroundKind[] = ["images", "videos", "colors"];

const UPLOAD_KIND: Partial<Record<BackgroundKind, MediaKind>> = {
  images: "image",
  videos: "video",
};

const TAB_PREFIX = "asset-backgrounds";

const kindOf = (background: Background): BackgroundKind =>
  isImageBackground(background)
    ? "images"
    : background.type === "video"
      ? "videos"
      : "colors";

const initialKind = (
  backgrounds: Background[],
  media: MediaItem[],
  targetItemId: string | null,
): BackgroundKind => {
  const target = backgrounds.find((bg) => bg.id === targetItemId);
  if (target) return kindOf(target);
  const item = media.find((entry) => entry.id === targetItemId);
  return item?.kind === "video" ? "videos" : "images";
};

const groupByKind = (
  backgrounds: Background[],
  sort: LibrarySortOption,
): Record<BackgroundKind, Background[]> => {
  const groups: Record<BackgroundKind, Background[]> = {
    images: [],
    videos: [],
    colors: [],
  };
  for (const background of backgrounds)
    groups[kindOf(background)].push(background);
  for (const kind of KIND_ORDER) groups[kind] = sortAssets(groups[kind], sort);
  return groups;
};

const addedMediaIdsOf = (
  backgrounds: Background[],
  kind: MediaKind,
): Set<string> =>
  new Set(
    backgrounds.flatMap((background) => {
      const mediaId = kind === "image" ? background.blobId : background.mediaId;
      return mediaId && !background.builtIn ? [mediaId] : [];
    }),
  );

const editorPathOf = (
  background: Background,
  library: MediaLibrary,
): string | null => {
  if (background.type === "video") {
    const clip = findMediaItem(library, background.mediaId, "video");
    return clip ? routes.video(clip.id) : null;
  }
  if (background.type !== "image") return null;
  const picture = findMediaItem(
    library,
    background.builtIn ? background.mediaId : background.blobId,
    "image",
  );
  return picture ? routes.image(picture.id) : null;
};

interface BackgroundsPanelProps {
  attentionId: string | null;
  targetItemId: string | null;
}

export const BackgroundsPanel = ({
  attentionId,
  targetItemId,
}: BackgroundsPanelProps) => {
  const backgrounds = useStore((s) => s.backgrounds);
  const media = useStore((s) => s.media);
  const attachImageBackground = useStore((s) => s.attachImageBackground);
  const attachVideoBackground = useStore((s) => s.attachVideoBackground);
  const [kind, setKind] = useState<BackgroundKind>(() =>
    initialKind(backgrounds, media, targetItemId),
  );
  const [sort, setSort] = useLibrarySort("asset-backgrounds");

  const groups = useMemo(
    () => groupByKind(backgrounds, sort),
    [backgrounds, sort],
  );
  const addedImageIds = useMemo(
    () => addedMediaIdsOf(groups.images, "image"),
    [groups.images],
  );
  const addedVideoIds = useMemo(
    () => addedMediaIdsOf(groups.videos, "video"),
    [groups.videos],
  );

  const tabs: SegmentedTab<BackgroundKind>[] = KIND_ORDER.map((id) => ({
    id,
    label: KINDS[id].label,
    icon: KINDS[id].icon,
    count: groups[id].length,
  }));

  return (
    <div className="flex flex-col gap-3.5">
      <SegmentedTabs<BackgroundKind>
        ariaLabel="Background kinds"
        idPrefix={TAB_PREFIX}
        tabs={tabs}
        value={kind}
        onChange={setKind}
        minSegmentWidth={104}
      />
      <div
        {...pillTabPanelProps(TAB_PREFIX, kind)}
        className="flex flex-col gap-3.5"
      >
        <BackgroundList
          key={kind}
          kind={kind}
          backgrounds={groups[kind]}
          attentionId={attentionId}
          sort={sort}
          onSort={setSort}
        />
        {kind === "images" && (
          <LibraryAddList
            kind="image"
            title="From your Images page"
            description="Pictures you uploaded elsewhere that are not backgrounds yet."
            addedMediaIds={addedImageIds}
            addLabel="Add"
            sort={sort}
            attentionId={attentionId}
            onAdd={attachImageBackground}
          />
        )}
        {kind === "videos" && (
          <LibraryAddList
            kind="video"
            title="From your Videos page"
            description="Clips you uploaded elsewhere that are not backgrounds yet."
            addedMediaIds={addedVideoIds}
            addLabel="Add"
            sort={sort}
            attentionId={attentionId}
            onAdd={attachVideoBackground}
          />
        )}
      </div>
    </div>
  );
};

interface BackgroundListProps {
  kind: BackgroundKind;
  backgrounds: Background[];
  attentionId: string | null;
  sort: LibrarySortOption;
  onSort: (sort: LibrarySortOption) => void;
}

const BackgroundList = ({
  kind,
  backgrounds,
  attentionId,
  sort,
  onSort,
}: BackgroundListProps) => {
  const beginUpload = useStore((s) => s.beginUpload);
  const attachImageBackground = useStore((s) => s.attachImageBackground);
  const attachVideoBackground = useStore((s) => s.attachVideoBackground);
  const addCustomBackground = useStore((s) => s.addCustomBackground);
  const removeBackground = useStore((s) => s.removeBackground);
  const library = useMediaLibrary();
  const openEditor = useOpenAssetEditor();
  const fileInput = useRef<HTMLInputElement>(null);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [renaming, setRenaming] = useState<Background | null>(null);

  const copy = KINDS[kind];
  const uploadKind = UPLOAD_KIND[kind];

  const upload = (files: File[]) => {
    if (!uploadKind) return;
    const attach =
      uploadKind === "image" ? attachImageBackground : attachVideoBackground;
    beginUpload(uploadKind, files, (ids) => {
      for (const id of ids) if (id) attach(id);
    });
  };

  const editActionOf = (background: Background): (() => void) | null => {
    if (kind === "colors") return () => setRenaming(background);
    const editorPath = editorPathOf(background, library);
    return editorPath ? () => openEditor(editorPath, "backgrounds") : null;
  };

  const action = (
    <>
      <LibrarySortSelect value={sort} onChange={onSort} nameLabel="Name" />
      {uploadKind ? (
        <Button size="sm" onClick={() => fileInput.current?.click()}>
          <Upload size={14} />
          Upload {copy.label.toLowerCase()}
        </Button>
      ) : (
        <Button
          size="sm"
          variant={colorPickerOpen ? "secondary" : "default"}
          aria-expanded={colorPickerOpen}
          onClick={() => setColorPickerOpen((open) => !open)}
        >
          {colorPickerOpen ? <X size={14} /> : <Plus size={14} />}
          {colorPickerOpen ? "Close" : "New color"}
        </Button>
      )}
    </>
  );

  return (
    <LibrarySection
      title={copy.title}
      meta={formatCount(backgrounds.length)}
      description={copy.description}
      action={action}
    >
      {uploadKind && (
        <input
          ref={fileInput}
          type="file"
          accept={`${uploadKind}/*`}
          multiple
          hidden
          onChange={(event) => {
            const files = Array.from(event.target.files || []);
            if (files.length) upload(files);
            event.target.value = "";
          }}
        />
      )}
      {kind === "colors" && colorPickerOpen && (
        <CustomColorPicker
          onAdd={(value, name) => addCustomBackground(value, name)}
        />
      )}
      <div className={assetGridClassName}>
        {backgrounds.map((background) => {
          const editBackground = editActionOf(background);
          return (
            <AssetTile
              key={background.id}
              id={background.id}
              name={background.name}
              highlighted={background.id === attentionId}
              detail={background.builtIn ? "Built in" : undefined}
              preview={<BgSwatch bg={background} className="size-full" />}
              overlayActions={
                <>
                  {editBackground && (
                    <button
                      type="button"
                      onClick={editBackground}
                      aria-label={`Edit ${background.name}`}
                      title={kind === "colors" ? "Rename" : "Edit"}
                      className={cardOverlayButtonClassName}
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                  {!background.builtIn && (
                    <button
                      type="button"
                      onClick={() => void removeBackground(background.id)}
                      aria-label={`Remove ${background.name}`}
                      title="Remove from backgrounds"
                      className={cardOverlayButtonClassName}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </>
              }
            />
          );
        })}
      </div>
      {renaming && (
        <RenameBackgroundModal
          key={renaming.id}
          background={renaming}
          onClose={() => setRenaming(null)}
        />
      )}
    </LibrarySection>
  );
};
