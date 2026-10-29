import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Film,
  Image as ImageIcon,
  ImagePlus,
  PenLine,
  Share2,
  Trash2,
  Upload,
  Wallpaper,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MediaItem, MediaKind } from "../../types";
import { useStore } from "../../store/useStore";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useLibraryLayout } from "../../hooks/useLibraryLayout";
import { formatBytes } from "../../lib/storageStats";
import { formatDuration, mediaPlayLength } from "../../lib/media";
import { formatDate } from "../../lib/id";
import { sortPinnedFirst } from "../../lib/pinning";
import { sortLibrary } from "../../lib/librarySort";
import { imageDeckIndex } from "../presentation/useDeck";
import { PageHeader, pageClassName } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { LazyMount } from "@/components/shared/LazyMount";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/shared/IconButton";
import { MoreMenu } from "@/components/shared/MoreMenu";
import { PinButton } from "@/components/shared/PinControl";
import {
  CardActions,
  CardTitle,
  cardBodyClassName,
  cardClassName,
  cardGridClassName,
  cardSubClassName,
  cardThumbBadgeClassName,
  cardThumbClassName,
} from "@/components/shared/InteractiveCard";
import { cardOpenProps } from "@/components/shared/cardOpenProps";
import { LibrarySortSelect } from "@/components/shared/LibrarySortSelect";
import { LayoutToggle } from "@/components/shared/LayoutToggle";
import {
  LibraryListRow,
  listClassName,
} from "@/components/shared/LibraryListRow";
import { PresentMenu } from "@/components/shared/PresentMenu";
import { QuickShareModal } from "../share/QuickShareModal";
import { useBackupSource } from "../share/lib/useBackupSource";
import { useQuickShareTarget } from "../share/lib/useQuickShareTarget";
import { recordsForMedia } from "../../lib/shareCatalog";
import { ImageSurface } from "../../components/media/ImageSurface";
import { VideoThumb } from "../../components/media/VideoThumb";
import routes from "../../routes";
import { useLibrarySort } from "@/hooks/useLibrarySort";

interface MediaPageConfig {
  kind: MediaKind;
  title: string;
  subtitle: string;
  uploadLabel: string;
  accept: string;
  emptyTitle: string;
  emptyMessage: string;
  emptyIcon: LucideIcon;
}

const CONFIGS: Record<MediaKind, MediaPageConfig> = {
  image: {
    kind: "image",
    title: "Images",
    subtitle: "Upload, edit and project images.",
    uploadLabel: "Upload Images",
    accept: "image/*",
    emptyTitle: "No images yet",
    emptyMessage: "Upload some to present or use as backgrounds.",
    emptyIcon: ImageIcon,
  },
  video: {
    kind: "video",
    title: "Videos",
    subtitle: "Upload, trim and play videos live.",
    uploadLabel: "Upload Videos",
    accept: "video/*",
    emptyTitle: "No videos yet",
    emptyMessage: "Upload some to play them on the projector.",
    emptyIcon: Film,
  },
};

const MediaLibraryPage = ({ kind }: { kind: MediaKind }) => {
  const config = CONFIGS[kind];
  useDocumentTitle(config.title);

  const media = useStore((s) => s.media);
  const backgrounds = useStore((s) => s.backgrounds);
  const beginUpload = useStore((s) => s.beginUpload);
  const removeMedia = useStore((s) => s.removeMedia);
  const startPresent = useStore((s) => s.startPresent);
  const toggleImageBackground = useStore((s) => s.toggleImageBackground);
  const pushToast = useStore((s) => s.pushToast);

  const shareSource = useBackupSource();
  const quickShare = useQuickShareTarget();

  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useLibrarySort(config.title.toLowerCase());
  const [deleting, setDeleting] = useState<MediaItem | null>(null);
  const { layout, setLayout } = useLibraryLayout(config.title.toLowerCase());

  const location = useLocation();
  const navigate = useNavigate();
  const openEditor = (item: MediaItem) =>
    navigate(routes.mediaItem(kind, item.id));

  const openId = (location.state as { openId?: string } | null)?.openId;
  const handedOff = useRef<string | null>(null);
  useEffect(() => {
    if (!openId || handedOff.current === openId) return;
    handedOff.current = openId;
    const known = media.some((m) => m.id === openId && m.kind === kind);
    navigate(known ? routes.mediaItem(kind, openId) : location.pathname, {
      replace: true,
      state: null,
    });
  }, [openId, media, kind, navigate, location.pathname]);

  const library = useMemo(
    () => media.filter((m) => m.kind === kind),
    [media, kind],
  );

  const list = useMemo(() => {
    const term = query.trim().toLowerCase();
    const base = term
      ? library.filter((m) => m.name.toLowerCase().includes(term))
      : library;
    const ordered = sortLibrary(base, sort, (m) => m.name);
    return term ? ordered : sortPinnedFirst(ordered);
  }, [library, query, sort]);

  const backgroundImageIds = useMemo(
    () =>
      new Set(
        backgrounds
          .map((b) => b.blobId)
          .filter((id): id is string => Boolean(id)),
      ),
    [backgrounds],
  );

  const present = (item: MediaItem, live: boolean) => {
    if (kind === "image")
      startPresent("image", item.id, imageDeckIndex(media, item.id), { live });
    else startPresent("video", item.id, 0, { live });
  };

  const toggleBackground = (item: MediaItem) => {
    const nowBackground = toggleImageBackground(item.id);
    pushToast(
      nowBackground
        ? `Added "${item.name}" to your backgrounds.`
        : `Removed "${item.name}" from your backgrounds.`,
    );
  };

  return (
    <div className={pageClassName}>
      <PageHeader
        title={config.title}
        subtitle={config.subtitle}
        actions={
          <Button onClick={() => inputRef.current?.click()}>
            <Upload size={16} />
            {config.uploadLabel}
          </Button>
        }
      />
      <input
        ref={inputRef}
        type="file"
        accept={config.accept}
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) beginUpload(kind, files);
          e.target.value = "";
        }}
      />

      <div className="mb-4.5 flex flex-wrap items-center gap-2.5">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={`Search ${config.title.toLowerCase()}…`}
        />
        <LibrarySortSelect value={sort} onChange={setSort} nameLabel="Name" />
        <LayoutToggle
          value={layout}
          onChange={setLayout}
          noun={config.title.toLowerCase()}
        />
      </div>

      {list.length === 0 ? (
        query.trim() ? (
          <EmptyState
            icon={config.emptyIcon}
            title={`No ${config.title.toLowerCase()} match`}
            message="Try a different search."
          />
        ) : (
          <EmptyState
            icon={config.emptyIcon}
            title={config.emptyTitle}
            message={config.emptyMessage}
            action={
              <Button onClick={() => inputRef.current?.click()}>
                <ImagePlus size={15} />
                {config.uploadLabel}
              </Button>
            }
          />
        )
      ) : (
        <div className={layout === "grid" ? cardGridClassName : listClassName}>
          {list.map((item) => {
            const props = {
              item,
              library,
              isBackground: backgroundImageIds.has(item.id),
              onOpen: () => openEditor(item),
              onPresent: (live: boolean) => present(item, live),
              onToggleBackground: () => toggleBackground(item),
              onQuickShare: () =>
                quickShare.open(
                  recordsForMedia(shareSource, item.id),
                  item.name,
                ),
              onDelete: () => setDeleting(item),
            };
            return layout === "grid" ? (
              <MediaCard key={item.id} {...props} />
            ) : (
              <MediaRow key={item.id} {...props} />
            );
          })}
        </div>
      )}

      {quickShare.target && (
        <QuickShareModal
          records={quickShare.target.records}
          title={quickShare.target.title}
          onClose={quickShare.close}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete ${kind}?`}
        message={`"${deleting?.name}" will be permanently removed. This can't be undone.`}
        onConfirm={() => {
          if (deleting) {
            void removeMedia(deleting.id);
            pushToast(`Deleted "${deleting.name}".`);
          }
          setDeleting(null);
        }}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
};

interface MediaCardProps {
  item: MediaItem;
  library: MediaItem[];
  isBackground: boolean;
  onOpen: () => void;
  onPresent: (live: boolean) => void;
  onToggleBackground: () => void;
  onQuickShare: () => void;
  onDelete: () => void;
}

const MediaThumb = ({ item }: { item: MediaItem }) => (
  <LazyMount>
    {item.kind === "image" ? (
      <ImageSurface item={item} variant="thumb" />
    ) : (
      <>
        <VideoThumb item={item} />
        {mediaPlayLength(item) !== undefined && (
          <div className={cardThumbBadgeClassName}>
            {formatDuration(mediaPlayLength(item))}
          </div>
        )}
      </>
    )}
  </LazyMount>
);

const mediaDetails = (item: MediaItem): string[] => [
  ...(item.width && item.height ? [`${item.width}×${item.height}`] : []),
  formatBytes(item.size || 0),
  ...(mediaPlayLength(item) !== undefined
    ? [formatDuration(mediaPlayLength(item))]
    : []),
  `Added ${formatDate(item.createdAt)}`,
  `Last modified ${formatDate(item.updatedAt)}`,
];

const MediaMenu = ({
  item,
  isBackground,
  onOpen,
  onToggleBackground,
  onQuickShare,
}: Pick<
  MediaCardProps,
  "item" | "isBackground" | "onOpen" | "onToggleBackground" | "onQuickShare"
>) => (
  <MoreMenu
    filled
    size="sm"
    items={[
      { label: "Open in editor", icon: PenLine, onClick: onOpen },
      {
        label: "Quick share",
        icon: Share2,
        title: "Send this to another device on your WiFi",
        onClick: onQuickShare,
      },
      ...(item.kind === "image"
        ? [
            {
              label: isBackground
                ? "Remove from backgrounds"
                : "Use as background",
              icon: Wallpaper,
              active: isBackground,
              onClick: onToggleBackground,
            },
          ]
        : []),
    ]}
  />
);

const MediaRow = ({
  item,
  library,
  isBackground,
  onOpen,
  onPresent,
  onToggleBackground,
  onQuickShare,
  onDelete,
}: MediaCardProps) => (
  <LibraryListRow
    cover={<MediaThumb item={item} />}
    title={item.name}
    details={mediaDetails(item)}
    onOpen={onOpen}
    actions={
      <>
        <PresentMenu onPresent={({ live }) => onPresent(live)} />
        <PinButton kind={item.kind} item={item} library={library} />
        <IconButton
          filled
          danger
          size="sm"
          icon={Trash2}
          title={`Delete ${item.kind}`}
          onClick={onDelete}
        />
        <MediaMenu
          item={item}
          isBackground={isBackground}
          onOpen={onOpen}
          onToggleBackground={onToggleBackground}
          onQuickShare={onQuickShare}
        />
      </>
    }
  />
);

const MediaCard = ({
  item,
  library,
  isBackground,
  onOpen,
  onPresent,
  onToggleBackground,
  onQuickShare,
  onDelete,
}: MediaCardProps) => {
  return (
    <div className={cardClassName} {...cardOpenProps(item.name, onOpen)}>
      <div className={cardThumbClassName} title="Open editor">
        <MediaThumb item={item} />
      </div>
      <div className={cardBodyClassName}>
        <CardTitle title={item.name} />
        <div className={cardSubClassName}>
          {item.width && item.height ? `${item.width}×${item.height} · ` : ""}
          {formatBytes(item.size || 0)}
        </div>
        <CardActions>
          <PresentMenu fill onPresent={({ live }) => onPresent(live)} />
          <PinButton kind={item.kind} item={item} library={library} />
          <IconButton
            filled
            danger
            size="sm"
            icon={Trash2}
            title={`Delete ${item.kind}`}
            onClick={onDelete}
          />
          <MediaMenu
            item={item}
            isBackground={isBackground}
            onOpen={onOpen}
            onToggleBackground={onToggleBackground}
            onQuickShare={onQuickShare}
          />
        </CardActions>
      </div>
    </div>
  );
};

export const ImagesPage = () => <MediaLibraryPage kind="image" />;
export const VideosPage = () => <MediaLibraryPage kind="video" />;
