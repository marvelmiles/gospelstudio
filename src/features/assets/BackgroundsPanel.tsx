import { useMemo, useState } from "react";
import { Film, Image as ImageIcon, Palette, Pencil, X } from "lucide-react";
import type { Background } from "../../types";
import { useStore } from "../../store/useStore";
import { ATTENTION_CLASS, attentionAttribute } from "../../hooks/useAttention";
import { isImageBackground, isVideoBackground } from "../../lib/media";
import { LibrarySection } from "../../components/ui/LibrarySection";
import { SegmentedTabs } from "../../components/ui/SegmentedTabs";
import type { SegmentedTab } from "../../components/ui/SegmentedTabs";
import { pillTabPanelProps } from "../../components/ui/tabPanel";
import { BgSwatch } from "../../components/controls/BgSwatch";
import { CustomColorPicker } from "../../components/controls/CustomColorPicker";
import { BackgroundImageEditorModal } from "../../components/media/BackgroundImageEditorModal";
import { MediaSourceList } from "./MediaSourceList";
import {
  assetGridClassName,
  cardOverlayButtonClassName,
} from "./assetCardStyles";
import { cn } from "../../lib/cn";
import { formatCount } from "../../lib/formatNumber";

type BackgroundTab = "images" | "colors" | "videos";

const TAB_PREFIX = "asset-backgrounds";

const isColorBackground = (background: Background): boolean =>
  background.type === "solid" || background.type === "gradient";

const tabOf = (background: Background): BackgroundTab =>
  background.type === "image"
    ? "images"
    : background.type === "video"
      ? "videos"
      : "colors";

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
  const [tab, setTab] = useState<BackgroundTab>(() => {
    const target = backgrounds.find((bg) => bg.id === targetItemId);
    if (target) return tabOf(target);
    const item = media.find((entry) => entry.id === targetItemId);
    return item?.kind === "video" ? "videos" : "images";
  });

  const images = useMemo(
    () => backgrounds.filter(isImageBackground),
    [backgrounds],
  );
  const colors = useMemo(
    () => backgrounds.filter(isColorBackground),
    [backgrounds],
  );
  const videoCount = useMemo(
    () => backgrounds.filter(isVideoBackground).length,
    [backgrounds],
  );

  const tabs: SegmentedTab<BackgroundTab>[] = [
    { id: "images", label: "Images", icon: ImageIcon, count: images.length },
    { id: "colors", label: "Colors", icon: Palette, count: colors.length },
    { id: "videos", label: "Videos", icon: Film, count: videoCount },
  ];

  return (
    <div className="flex flex-col gap-3.5">
      <SegmentedTabs<BackgroundTab>
        ariaLabel="Background kinds"
        idPrefix={TAB_PREFIX}
        tabs={tabs}
        value={tab}
        onChange={setTab}
        minSegmentWidth={104}
      />
      <div {...pillTabPanelProps(TAB_PREFIX, tab)}>
        {tab === "images" && (
          <ImagesTab images={images} attentionId={attentionId} />
        )}
        {tab === "colors" && (
          <ColorsTab colors={colors} attentionId={attentionId} />
        )}
        {tab === "videos" && <VideosTab attentionId={attentionId} />}
      </div>
    </div>
  );
};

interface BackgroundTabProps {
  attentionId: string | null;
}

const ImagesTab = ({
  images,
  attentionId,
}: BackgroundTabProps & { images: Background[] }) => {
  const media = useStore((s) => s.media);
  const attachImageBackground = useStore((s) => s.attachImageBackground);
  const removeBackground = useStore((s) => s.removeBackground);
  const [editing, setEditing] = useState<Background | null>(null);

  const pictureIds = useMemo(
    () =>
      new Set(
        media.flatMap((item) => (item.kind === "image" ? [item.id] : [])),
      ),
    [media],
  );

  const attached = useMemo(() => {
    const map = new Map<string, string>();
    for (const background of images)
      if (background.blobId && pictureIds.has(background.blobId))
        map.set(background.blobId, background.id);
    return map;
  }, [images, pictureIds]);

  const standalone = useMemo(
    () =>
      images.filter(
        (background) =>
          !background.blobId || !pictureIds.has(background.blobId),
      ),
    [images, pictureIds],
  );

  return (
    <>
      <MediaSourceList
        kind="image"
        title="Image backgrounds"
        description="Your Images page. Attach a picture to set it behind any slide; the pencil opens it in the image editor."
        attentionId={attentionId}
        addedByMediaId={attached}
        onAdd={attachImageBackground}
        onRemove={(backgroundId) => void removeBackground(backgroundId)}
        addLabel="Attach"
        addedLabel="Attached"
        addedFilterLabel="Background images"
        section="backgrounds"
        filterable
        emptyMessage="Upload a picture and it is attached as a background."
      />
      {standalone.length > 0 && (
        <div className="mt-3.5">
          <LibrarySection
            title="Saved pictures"
            meta={`${formatCount(standalone.length)} saved`}
            description="Backgrounds saved on their own rather than from your Images page."
          >
            <BackgroundGrid
              backgrounds={standalone}
              attentionId={attentionId}
              onEditImage={setEditing}
            />
          </LibrarySection>
        </div>
      )}
      {editing && (
        <BackgroundImageEditorModal
          key={editing.id}
          background={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
};

const ColorsTab = ({
  colors,
  attentionId,
}: BackgroundTabProps & { colors: Background[] }) => {
  const addCustomBackground = useStore((s) => s.addCustomBackground);

  return (
    <LibrarySection
      title="Colors and gradients"
      meta={`${formatCount(colors.length)} saved`}
      description="Pick a preset or write any CSS color or gradient of your own."
    >
      <CustomColorPicker
        onAdd={(value, name) => addCustomBackground(value, name)}
      />
      <BackgroundGrid backgrounds={colors} attentionId={attentionId} />
    </LibrarySection>
  );
};

const VideosTab = ({ attentionId }: BackgroundTabProps) => {
  const backgrounds = useStore((s) => s.backgrounds);
  const attachVideoBackground = useStore((s) => s.attachVideoBackground);
  const removeBackground = useStore((s) => s.removeBackground);
  const attached = useMemo(() => {
    const map = new Map<string, string>();
    for (const bg of backgrounds)
      if (isVideoBackground(bg) && bg.mediaId) map.set(bg.mediaId, bg.id);
    return map;
  }, [backgrounds]);

  return (
    <MediaSourceList
      kind="video"
      title="Video backgrounds"
      description="Your Videos page. Attach a clip to loop it behind slides; the pencil opens it in the video editor."
      attentionId={attentionId}
      addedByMediaId={attached}
      onAdd={attachVideoBackground}
      onRemove={(backgroundId) => void removeBackground(backgroundId)}
      addLabel="Attach"
      addedLabel="Attached"
      addedFilterLabel="Background videos"
      section="backgrounds"
      filterable
      emptyMessage="Upload a video and it is attached as a background."
    />
  );
};

interface BackgroundGridProps {
  backgrounds: Background[];
  attentionId: string | null;
  onEditImage?: (background: Background) => void;
}

const BackgroundGrid = ({
  backgrounds,
  attentionId,
  onEditImage,
}: BackgroundGridProps) => {
  const removeBackground = useStore((s) => s.removeBackground);

  return (
    <div className={assetGridClassName}>
      {backgrounds.map((bg) => (
        <div
          key={bg.id}
          {...attentionAttribute(bg.id)}
          className={cn(
            "relative rounded-[11px]",
            bg.id === attentionId && ATTENTION_CLASS,
          )}
        >
          <BgSwatch
            bg={bg}
            className="aspect-video rounded-[9px] border border-line"
          />
          <div className="mt-1.25 truncate text-xs text-fg">{bg.name}</div>
          {!bg.builtIn && (
            <div className="absolute top-1.5 right-1.5 flex gap-1.25">
              {onEditImage && (
                <button
                  onClick={() => onEditImage(bg)}
                  aria-label={`Edit ${bg.name}`}
                  title="Edit image"
                  className={cardOverlayButtonClassName}
                >
                  <Pencil size={13} />
                </button>
              )}
              <button
                onClick={() => void removeBackground(bg.id)}
                aria-label={`Remove ${bg.name}`}
                title="Remove"
                className={cardOverlayButtonClassName}
              >
                <X size={13} />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
