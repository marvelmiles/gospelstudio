import type { KeyboardEvent } from "react";
import { Check, Music, Settings } from "lucide-react";
import { cn } from "../../../lib/utils";
import { BgSwatch } from "../../../components/controls/BgSwatch";
import { ImageSurface } from "../../../components/media/ImageSurface";
import { VideoThumb } from "../../../components/media/VideoThumb";
import { LazyMount } from "@/components/shared/LazyMount";
import type { ShareItem, SharePreview } from "../../../lib/shareCatalog";

interface ShareItemTileProps {
  item: ShareItem;
  picked: boolean;
  disabled: boolean;
  onToggle: () => void;
}

export const ShareItemTile = ({
  item,
  picked,
  disabled,
  onToggle,
}: ShareItemTileProps) => {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    if (!disabled) onToggle();
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={picked}
      aria-label={item.name}
      title={item.name}
      onClick={disabled ? undefined : onToggle}
      onKeyDown={onKeyDown}
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border-[1.5px]",
        picked ? "border-primary bg-primary/12" : "border-border bg-background",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
      )}
    >
      <div className="relative aspect-video w-full bg-secondary">
        <ShareItemCover preview={item.preview} />
        <span
          aria-hidden
          className={cn(
            "absolute top-1.5 right-1.5 grid size-5.25 place-items-center rounded-[7px] border",
            picked
              ? "border-primary bg-primary text-primary-foreground"
              : "border-white/35 bg-black/55 text-white/85",
          )}
        >
          {picked && <Check size={13} strokeWidth={3} />}
        </span>
      </div>
      <div className="min-w-0 px-2.5 pt-2 pb-2.5">
        <div className="truncate text-[12.5px] font-semibold text-foreground">
          {item.name}
        </div>
        {item.detail && (
          <div className="mt-0.5 truncate text-[11px] text-subtle-foreground">
            {item.detail}
          </div>
        )}
      </div>
    </div>
  );
};

const coverTextClassName = (shadowed: boolean) =>
  cn(
    "absolute inset-0 grid place-items-center",
    shadowed && "[text-shadow:0_1px_6px_rgb(0_0_0/0.65)]",
  );

const ShareItemCover = ({ preview }: { preview: SharePreview }) => {
  if (preview.kind === "media") {
    return (
      <LazyMount>
        {preview.item.kind === "image" ? (
          <ImageSurface item={preview.item} variant="thumb" />
        ) : (
          <VideoThumb item={preview.item} />
        )}
      </LazyMount>
    );
  }

  if (preview.kind === "background") {
    return (
      <BgSwatch
        bg={preview.background}
        settings={preview.settings}
        videoSettings={preview.videoSettings}
        className="size-full"
      />
    );
  }

  if (preview.kind === "deck") {
    const theme = preview.theme;
    return (
      <BgSwatch
        bg={preview.background}
        settings={preview.settings}
        videoSettings={preview.videoSettings}
        className="size-full"
      >
        <span
          style={{
            textAlign: theme?.align ?? "center",
            fontFamily: theme?.fontFamily,
            fontWeight: theme?.fontWeight ?? 600,
            letterSpacing: theme ? theme.letterSpacing / 4 : 0,
            color: theme?.color,
          }}
          className={cn(
            coverTextClassName(Boolean(preview.background)),
            "overflow-hidden px-2.5 py-2 text-[11px] leading-[1.35] text-foreground",
            theme?.uppercase && "uppercase",
          )}
        >
          <span className="line-clamp-3">{preview.text}</span>
        </span>
      </BgSwatch>
    );
  }

  if (preview.kind === "theme") {
    const { theme } = preview;
    return (
      <BgSwatch bg={preview.background} className="size-full">
        <span
          style={{
            fontFamily: theme.fontFamily,
            fontWeight: theme.fontWeight,
            letterSpacing: theme.letterSpacing / 3,
            color: theme.color,
          }}
          className={cn(
            coverTextClassName(Boolean(preview.background)),
            "text-[22px]",
            theme.uppercase && "uppercase",
          )}
        >
          Aa
        </span>
      </BgSwatch>
    );
  }

  return (
    <div className="absolute inset-0 grid place-items-center bg-primary/10 text-primary-soft">
      {preview.kind === "audio" ? <Music size={22} /> : <Settings size={22} />}
    </div>
  );
};
