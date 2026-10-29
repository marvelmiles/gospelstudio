import { useMemo, useRef, useState, type ReactNode } from "react";
import { Library, Pause, Pencil, Play, Upload } from "lucide-react";
import type { AudioItem, AudioSettings, MediaItem } from "../../types";
import { useStore } from "../../store/useStore";
import { cn } from "../../lib/utils";
import {
  DEFAULT_AUDIO_SETTINGS,
  NO_AUDIO_ID,
  audioPlayLength,
  audioSettingsOf,
  formatDuration,
} from "../../lib/media";
import { mostRecent } from "../../lib/recentItems";
import type { AssetUsageRequest } from "../../lib/assetUsage";
import type { MediaPlayback } from "../../lib/presentChannel";
import { AudioSurface } from "../media/AudioSurface";
import { Button } from "@/components/ui/button";
import { RadioDot } from "./RadioDot";

const AUDIO_PICKER_LIMIT = 10;

interface AudioPickerProps {
  audio: AudioItem[];
  value: string;
  onSelect: (id: string) => void;
  inheritLabel?: string;
  onUploaded?: (id: string) => void;
  onManage?: () => void;
  settings?: AudioSettings | null;
  onEditUsage?: (request: AssetUsageRequest) => void;
  limit?: number;
}

const PREVIEW_PLAYBACK: MediaPlayback = {
  playing: true,
  muted: false,
  volume: 100,
  seekTime: 0,
  seekToken: 0,
};

const soundtrackOf = (item: MediaItem): AudioItem => ({
  id: item.id,
  name: item.name,
  blobId: item.id,
  mediaId: item.id,
  size: item.size,
  duration: item.duration,
  createdAt: item.createdAt,
});

export const AudioPicker = ({
  audio,
  value,
  onSelect,
  inheritLabel,
  onUploaded,
  onManage,
  settings,
  onEditUsage,
  limit = AUDIO_PICKER_LIMIT,
}: AudioPickerProps) => {
  const media = useStore((s) => s.media);
  const beginUpload = useStore((s) => s.beginUpload);
  const addVideoAudio = useStore((s) => s.addVideoAudio);
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const entries = useMemo(() => {
    const taken = new Set(
      audio.flatMap((item) =>
        [item.mediaId, item.blobId].filter((id): id is string => Boolean(id)),
      ),
    );
    const all: AudioItem[] = [
      ...audio,
      ...media.flatMap((item) =>
        item.kind === "video" && !taken.has(item.id)
          ? [soundtrackOf(item)]
          : [],
      ),
    ];
    return mostRecent(all, {
      limit,
      createdAt: (item) => item.createdAt,
      keep: (item) => item.id === value,
    });
  }, [audio, limit, media, value]);

  const silent = value === NO_AUDIO_ID || (!inheritLabel && !value);

  const previewItem = entries.find((item) => item.id === previewId);

  const previewPlayback = useMemo<MediaPlayback>(
    () => ({
      ...PREVIEW_PLAYBACK,
      seekTime: previewItem?.settings?.trimStart ?? 0,
      volume: previewItem?.settings?.volume ?? 100,
    }),
    [previewItem],
  );

  const isSoundtrack = (item: AudioItem): boolean =>
    !audio.some((sound) => sound.id === item.id);

  const adopt = (item: AudioItem): string =>
    isSoundtrack(item) ? addVideoAudio(item.id) : item.id;

  const select = (item: AudioItem) => {
    const id = adopt(item);
    if (id) onSelect(id);
  };

  const edit = (item: AudioItem) => {
    if (!onEditUsage) return;
    const adopting = isSoundtrack(item);
    const assetId = adopt(item);
    if (!assetId) return;
    const inUse = assetId === value;
    const defaults = adopting
      ? { ...DEFAULT_AUDIO_SETTINGS }
      : audioSettingsOf(item);
    onEditUsage({
      assetId,
      kind: "audio",
      inUse,
      settings: (inUse ? settings : null) ?? defaults,
      defaults,
    });
  };

  return (
    <>
      <div
        role="radiogroup"
        aria-label="Background audio"
        className="mb-2.5 max-h-58 overflow-y-auto rounded-[11px] border border-border"
      >
        {inheritLabel && (
          <AudioRow
            label={inheritLabel}
            selected={value === ""}
            onSelect={() => onSelect("")}
          />
        )}
        <AudioRow
          label="None"
          selected={silent}
          onSelect={() => onSelect(NO_AUDIO_ID)}
        />
        {entries.map((item) => (
          <AudioRow
            key={item.id}
            label={item.name}
            meta={
              audioPlayLength(item)
                ? formatDuration(audioPlayLength(item))
                : undefined
            }
            selected={value === item.id}
            onSelect={() => select(item)}
            actions={
              <>
                <RowButton
                  active={previewId === item.id}
                  label={
                    previewId === item.id
                      ? `Stop ${item.name}`
                      : `Listen to ${item.name}`
                  }
                  title={previewId === item.id ? "Stop" : "Listen"}
                  onClick={() =>
                    setPreviewId(previewId === item.id ? null : item.id)
                  }
                >
                  {previewId === item.id ? (
                    <Pause size={13} />
                  ) : (
                    <Play size={13} />
                  )}
                </RowButton>
                {onEditUsage && (
                  <RowButton
                    className="reveal"
                    active={false}
                    label={`Edit ${item.name} for this use`}
                    title="Edit for this use"
                    onClick={() => edit(item)}
                  >
                    <Pencil size={13} />
                  </RowButton>
                )}
              </>
            }
          />
        ))}
      </div>

      {previewItem && (
        <AudioSurface
          key={previewItem.id}
          item={previewItem}
          loop={false}
          playback={previewPlayback}
          onEnded={() => setPreviewId(null)}
        />
      )}

      <div className="flex flex-wrap gap-1.75">
        {onManage && (
          <Button variant="secondary" size="sm" onClick={onManage}>
            <Library size={14} />
            Manage audio
          </Button>
        )}
        {onUploaded && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={14} />
            Upload audio
          </Button>
        )}
      </div>
      {onUploaded && (
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          multiple
          hidden
          onChange={(event) => {
            const files = Array.from(event.target.files || []);
            if (files.length)
              beginUpload(
                "audio",
                files,
                (ids) => ids[0] && onUploaded(ids[0]),
              );
            event.target.value = "";
          }}
        />
      )}
    </>
  );
};

interface AudioRowProps {
  label: string;
  meta?: string;
  selected: boolean;
  onSelect: () => void;
  actions?: ReactNode;
}

const AudioRow = ({
  label,
  meta,
  selected,
  onSelect,
  actions,
}: AudioRowProps) => (
  <div
    data-active={selected || undefined}
    className={cn(
      "group flex items-center gap-1.5 border-b border-border py-1 pr-1.5 pl-1",
      selected ? "bg-primary/12" : "bg-transparent",
    )}
  >
    <button
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className="flex min-w-0 flex-1 items-center gap-2.25 border-none bg-transparent p-1.5 text-left"
    >
      <RadioDot selected={selected} />
      <span className="min-w-0">
        <span
          className={cn(
            "flex items-center gap-1.25 truncate text-[12.5px]",
            selected ? "text-primary-soft" : "text-foreground",
          )}
        >
          {label}
        </span>
        {meta && (
          <span className="block text-[11px] text-muted-foreground tabular-nums">
            {meta}
          </span>
        )}
      </span>
    </button>
    {actions}
  </div>
);

interface RowButtonProps {
  active: boolean;
  label: string;
  title: string;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}

const RowButton = ({
  active,
  label,
  title,
  onClick,
  className,
  children,
}: RowButtonProps) => (
  <button
    onClick={onClick}
    aria-label={label}
    title={title}
    className={cn(
      "grid size-7 shrink-0 place-items-center rounded-lg border",
      active
        ? "border-primary/40 bg-primary/16 text-primary-soft"
        : "border-transparent bg-transparent text-muted-foreground",
      className,
    )}
  >
    {children}
  </button>
);
