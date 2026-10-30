import { useMemo, useRef, useState, type ReactNode } from "react";
import { Library, Palette, Pencil, Upload } from "lucide-react";
import type {
  Background,
  ImageSettings,
  MediaItem,
  VideoSettings,
} from "../../types";
import { useStore } from "../../store/useStore";
import { cn } from "../../lib/utils";
import {
  DEFAULT_BACKGROUND_IMAGE_SETTINGS,
  backgroundImageSettings,
  backgroundVideoSettings,
  findBackgroundClip,
  isImageBackground,
  isVideoBackground,
  snapshotBackgroundImage,
} from "../../lib/media";
import { mostRecent } from "../../lib/recentItems";
import type { AssetUsageRequest } from "../../lib/assetUsage";
import { Button } from "@/components/ui/button";
import { ImageSurface } from "../media/ImageSurface";
import { VideoThumb } from "../media/VideoThumb";
import { LazyMount } from "@/components/shared/LazyMount";
import { CustomColorPicker } from "./CustomColorPicker";
import { BgSwatch } from "./BgSwatch";
import { RadioDot } from "./RadioDot";

interface InheritedBackground {
  label: string;
  background?: Background;
  imageSettings?: ImageSettings | null;
  videoSettings?: VideoSettings | null;
}

interface BackgroundPickerProps {
  backgrounds: Background[];
  value: string;
  onSelect: (id: string, image?: ImageSettings) => void;
  inherit?: InheritedBackground;
  highlightId?: string;
  onUploaded?: (id: string, image?: ImageSettings) => void;
  onAddColor?: (value: string, name?: string) => void;
  onManage?: () => void;
  imageSettings?: ImageSettings | null;
  videoSettings?: VideoSettings | null;
  onEditUsage?: (request: AssetUsageRequest) => void;
}

type PickerEntry =
  | { source: "library"; background: Background }
  | { source: "module"; item: MediaItem };

const entryId = (entry: PickerEntry): string =>
  entry.source === "library" ? entry.background.id : entry.item.id;

const entryName = (entry: PickerEntry): string =>
  entry.source === "library" ? entry.background.name : entry.item.name;

const entryCreatedAt = (entry: PickerEntry): string | undefined =>
  entry.source === "library"
    ? entry.background.createdAt
    : entry.item.createdAt;

const entryFileId = (entry: PickerEntry): string =>
  entry.source === "library"
    ? (entry.background.blobId ??
      entry.background.mediaId ??
      entry.background.id)
    : entry.item.id;

const backgroundFileIds = (backgrounds: Background[]): Set<string> =>
  new Set(
    backgrounds.flatMap((background) =>
      [background.blobId, background.mediaId].filter((id): id is string =>
        Boolean(id),
      ),
    ),
  );

const entryFingerprint = (entry: PickerEntry): string | null => {
  const { kind, name, size } =
    entry.source === "library"
      ? {
          kind: entry.background.type,
          name: entry.background.name,
          size: entry.background.size,
        }
      : { kind: entry.item.kind, name: entry.item.name, size: entry.item.size };
  if (!size || (kind !== "image" && kind !== "video")) return null;
  return `${kind}:${size}:${name.trim().toLowerCase()}`;
};

const withoutRepeats = (
  entries: PickerEntry[],
  activeId: string,
): PickerEntry[] => {
  const seen = new Set<string>();
  const inUseFirst = [
    ...entries.filter((entry) => entryId(entry) === activeId),
    ...entries.filter((entry) => entryId(entry) !== activeId),
  ];
  return inUseFirst.filter((entry) => {
    const keys = [entryFileId(entry), entryFingerprint(entry)].filter(
      (key): key is string => Boolean(key),
    );
    if (keys.some((key) => seen.has(key))) return false;
    for (const key of keys) seen.add(key);
    return true;
  });
};

export const BackgroundPicker = ({
  backgrounds,
  value,
  onSelect,
  inherit,
  highlightId,
  onUploaded,
  onAddColor,
  onManage,
  imageSettings,
  videoSettings,
  onEditUsage,
}: BackgroundPickerProps) => {
  const media = useStore((s) => s.media);
  const beginUpload = useStore((s) => s.beginUpload);
  const attachImageBackground = useStore((s) => s.attachImageBackground);
  const attachVideoBackground = useStore((s) => s.attachVideoBackground);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showColor, setShowColor] = useState(false);

  const activeId = highlightId ?? value;

  const clipFor = (background?: Background) =>
    findBackgroundClip(media, background?.mediaId);

  const attachedFileIds = useMemo(
    () => backgroundFileIds(backgrounds),
    [backgrounds],
  );

  const unattached = useMemo(
    () => media.filter((item) => !attachedFileIds.has(item.id)),
    [media, attachedFileIds],
  );

  const entries = useMemo<PickerEntry[]>(() => {
    const all: PickerEntry[] = [
      ...backgrounds.map(
        (background) => ({ source: "library", background }) as PickerEntry,
      ),
      ...unattached.map((item) => ({ source: "module", item }) as PickerEntry),
    ];
    return mostRecent(withoutRepeats(all, activeId), {
      createdAt: entryCreatedAt,
    });
  }, [backgrounds, unattached, activeId]);

  const selectBackground = (id: string) => {
    const background = backgrounds.find((bg) => bg.id === id);
    onSelect(id, snapshotBackgroundImage(background));
  };

  const editBackground = (background: Background) => {
    if (!onEditUsage) return;
    const inUse = background.id === activeId;
    if (isImageBackground(background)) {
      const defaults = backgroundImageSettings(background);
      onEditUsage({
        assetId: background.id,
        kind: "image",
        inUse,
        settings: (inUse ? imageSettings : null) ?? defaults,
        defaults,
      });
      return;
    }
    const clip = clipFor(background);
    if (!clip) return;
    const defaults = backgroundVideoSettings(clip);
    onEditUsage({
      assetId: background.id,
      kind: "video",
      inUse,
      settings: (inUse ? videoSettings : null) ?? defaults,
      defaults,
    });
  };

  const attachFromModule = (item: MediaItem): string =>
    item.kind === "image"
      ? attachImageBackground(item.id)
      : attachVideoBackground(item.id);

  const selectFromModule = (item: MediaItem) => {
    const id = attachFromModule(item);
    if (!id) return;
    onSelect(
      id,
      item.kind === "image"
        ? (item.image ?? { ...DEFAULT_BACKGROUND_IMAGE_SETTINGS })
        : undefined,
    );
  };

  const editFromModule = (item: MediaItem) => {
    if (!onEditUsage) return;
    const assetId = attachFromModule(item);
    if (!assetId) return;
    const inUse = assetId === activeId;
    if (item.kind === "image") {
      const defaults: ImageSettings = {
        ...DEFAULT_BACKGROUND_IMAGE_SETTINGS,
        ...item.image,
      };
      onEditUsage({
        assetId,
        kind: "image",
        inUse,
        settings: defaults,
        defaults,
      });
      return;
    }
    const defaults = backgroundVideoSettings(item);
    onEditUsage({
      assetId,
      kind: "video",
      inUse,
      settings: defaults,
      defaults,
    });
  };

  const canEdit = (entry: PickerEntry): boolean => {
    if (!onEditUsage) return false;
    if (entry.source === "module") return true;
    const { background } = entry;
    return (
      isImageBackground(background) ||
      (isVideoBackground(background) && Boolean(clipFor(background)))
    );
  };

  return (
    <>
      {inherit && (
        <InheritOption
          inherit={inherit}
          selected={value === ""}
          onSelect={() => onSelect("")}
        />
      )}

      <SwatchGrid>
        {entries.map((entry) => (
          <SwatchTile
            key={entryId(entry)}
            name={entryName(entry)}
            active={activeId === entryId(entry)}
            onPick={() =>
              entry.source === "library"
                ? selectBackground(entry.background.id)
                : selectFromModule(entry.item)
            }
            onEdit={
              canEdit(entry)
                ? () =>
                    entry.source === "library"
                      ? editBackground(entry.background)
                      : editFromModule(entry.item)
                : undefined
            }
          >
            {entry.source === "library" ? (
              <BgSwatch
                bg={entry.background}
                settings={
                  activeId === entry.background.id ? imageSettings : undefined
                }
                className="size-full"
              />
            ) : (
              <ModuleThumb item={entry.item} />
            )}
          </SwatchTile>
        ))}
      </SwatchGrid>

      <div className="flex flex-wrap gap-1.75">
        {onManage && (
          <Button variant="secondary" size="sm" onClick={onManage}>
            <Library size={14} />
            Manage backgrounds
          </Button>
        )}
        {onUploaded && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={14} />
            Upload image
          </Button>
        )}
        {onAddColor && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowColor((v) => !v)}
          >
            <Palette size={14} />
            Solid / custom color
          </Button>
        )}
      </div>

      {onAddColor && showColor && (
        <div className="mt-2.5">
          <CustomColorPicker
            onAdd={(value, name) => {
              onAddColor(value, name);
              setShowColor(false);
            }}
          />
        </div>
      )}

      {onUploaded && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length)
              beginUpload(
                "background",
                files,
                (ids) =>
                  ids[0] &&
                  onUploaded(ids[0], { ...DEFAULT_BACKGROUND_IMAGE_SETTINGS }),
              );
            e.target.value = "";
          }}
        />
      )}
    </>
  );
};

const SwatchGrid = ({ children }: { children: ReactNode }) => (
  <div className="mb-3 grid max-h-61 grid-cols-4 content-start gap-1.5 overflow-y-auto">
    {children}
  </div>
);

interface InheritOptionProps {
  inherit: InheritedBackground;
  selected: boolean;
  onSelect: () => void;
}

const InheritOption = ({ inherit, selected, onSelect }: InheritOptionProps) => (
  <button
    aria-pressed={selected}
    onClick={onSelect}
    className={cn(
      "mb-2 flex w-full items-center gap-2.25 rounded-[10px] border px-2.5 py-2 text-left text-[12.5px] font-semibold",
      selected
        ? "border-primary bg-primary/12 text-primary-soft"
        : "border-border bg-transparent text-foreground",
    )}
  >
    <RadioDot selected={selected} />
    <span className="min-w-0 flex-1 truncate">{inherit.label}</span>
    <BgSwatch
      bg={inherit.background}
      settings={inherit.imageSettings}
      videoSettings={inherit.videoSettings}
      className="h-5 w-8.5 shrink-0 rounded-[5px] border border-border"
    />
  </button>
);

interface SwatchTileProps {
  name: string;
  active: boolean;
  onPick: () => void;
  onEdit?: () => void;
  children: ReactNode;
}

const SwatchTile = ({
  name,
  active,
  onPick,
  onEdit,
  children,
}: SwatchTileProps) => (
  <div data-active={active || undefined} className="group relative">
    <button
      title={name}
      aria-pressed={active}
      onClick={onPick}
      className={cn(
        "block aspect-video w-full overflow-hidden rounded-[7px] border-[1.5px] bg-transparent p-0",
        active ? "border-primary" : "border-border",
      )}
    >
      {children}
    </button>
    {onEdit && (
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onEdit}
        title="Edit for this use"
        aria-label={`Edit ${name} for this use`}
        className="absolute top-1 right-1 size-5 rounded-md bg-black/62 text-white reveal enabled:hover:bg-black/80 enabled:hover:text-white [&_svg:not([class*='size-'])]:size-2.75"
      >
        <Pencil />
      </Button>
    )}
  </div>
);

const ModuleThumb = ({ item }: { item: MediaItem }) => (
  <div className="relative size-full bg-black">
    <LazyMount>
      {item.kind === "image" ? (
        <ImageSurface item={item} variant="thumb" />
      ) : (
        <VideoThumb item={item} />
      )}
    </LazyMount>
  </div>
);
