import { useMemo, useRef, useState } from "react";
import { Film, Music, Pencil, Share2, Trash2, Upload } from "lucide-react";
import type { AudioItem } from "../../types";
import { cn } from "../../lib/cn";
import { useStore } from "../../store/useStore";
import { useAssetUrl } from "../../hooks/useAssetUrl";
import { ATTENTION_CLASS, attentionAttribute } from "../../hooks/useAttention";
import { audioPlayLength, formatDuration } from "../../lib/media";
import { Button, IconButton } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { LibrarySection } from "../../components/ui/LibrarySection";
import { MoreMenu } from "../../components/ui/MoreMenu";
import { SegmentedTabs } from "../../components/ui/SegmentedTabs";
import type { SegmentedTab } from "../../components/ui/SegmentedTabs";
import { pillTabPanelProps } from "../../components/ui/tabPanel";
import { QuickShareModal } from "../share/QuickShareModal";
import { useQuickShareTarget } from "../share/lib/useQuickShareTarget";
import { useOpenAssetEditor } from "./assetLibraryNavigation";
import { MediaSourceList } from "./MediaSourceList";
import routes from "../../routes";
import { formatCount } from "../../lib/formatNumber";

type AudioTab = "sounds" | "videos";

const TAB_PREFIX = "asset-audio";

interface AudioPanelProps {
  attentionId: string | null;
  targetItemId: string | null;
}

export const AudioPanel = ({ attentionId, targetItemId }: AudioPanelProps) => {
  const audio = useStore((s) => s.audio);
  const media = useStore((s) => s.media);
  const [tab, setTab] = useState<AudioTab>(() =>
    media.some((item) => item.id === targetItemId) ? "videos" : "sounds",
  );

  const fromVideos = useMemo(
    () => audio.filter((item) => Boolean(item.mediaId)).length,
    [audio],
  );

  const tabs: SegmentedTab<AudioTab>[] = [
    { id: "sounds", label: "Sounds", icon: Music, count: audio.length },
    { id: "videos", label: "From videos", icon: Film, count: fromVideos },
  ];

  return (
    <div className="flex flex-col gap-3.5">
      <SegmentedTabs<AudioTab>
        ariaLabel="Audio sources"
        idPrefix={TAB_PREFIX}
        tabs={tabs}
        value={tab}
        onChange={setTab}
      />
      <div {...pillTabPanelProps(TAB_PREFIX, tab)}>
        {tab === "sounds" ? (
          <SoundsTab attentionId={attentionId} />
        ) : (
          <VideoSoundsTab attentionId={attentionId} />
        )}
      </div>
    </div>
  );
};

const SoundsTab = ({ attentionId }: { attentionId: string | null }) => {
  const audio = useStore((s) => s.audio);
  const beginUpload = useStore((s) => s.beginUpload);
  const removeAudio = useStore((s) => s.removeAudio);
  const openEditor = useOpenAssetEditor();
  const quickShare = useQuickShareTarget();
  const audioInput = useRef<HTMLInputElement>(null);

  return (
    <LibrarySection
      title="Sounds"
      meta={`${formatCount(audio.length)} saved`}
      description="Background audio you can attach to a theme, a manuscript or a single slide."
      action={
        <Button
          variant="primary"
          size="sm"
          onClick={() => audioInput.current?.click()}
        >
          <Upload size={14} />
          Upload audio
        </Button>
      }
    >
      <input
        ref={audioInput}
        type="file"
        accept="audio/*"
        multiple
        hidden
        onChange={(event) => {
          const files = Array.from(event.target.files || []);
          if (files.length) beginUpload("audio", files);
          event.target.value = "";
        }}
      />
      {audio.length === 0 ? (
        <EmptyState
          icon={Music}
          title="No sounds yet"
          message="Upload audio to play it behind your slides."
          compact
          bare
        />
      ) : (
        audio.map((item) => (
          <AudioRow
            key={item.id}
            item={item}
            attention={item.id === attentionId}
            onEdit={() => openEditor(routes.sound(item.id), "audio")}
            onQuickShare={() =>
              quickShare.open([{ collection: "audio", id: item.id }], item.name)
            }
            onRemove={() => void removeAudio(item.id)}
          />
        ))
      )}
      {quickShare.target && (
        <QuickShareModal
          records={quickShare.target.records}
          title={quickShare.target.title}
          onClose={quickShare.close}
        />
      )}
    </LibrarySection>
  );
};

const VideoSoundsTab = ({ attentionId }: { attentionId: string | null }) => {
  const audio = useStore((s) => s.audio);
  const addVideoAudio = useStore((s) => s.addVideoAudio);
  const removeAudio = useStore((s) => s.removeAudio);
  const added = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of audio) if (item.mediaId) map.set(item.mediaId, item.id);
    return map;
  }, [audio]);

  return (
    <MediaSourceList
      kind="video"
      title="Sound from videos"
      description="Your Videos page. Take the soundtrack of a clip and keep it alongside your sounds; the pencil opens the clip in the video editor."
      attentionId={attentionId}
      addedByMediaId={added}
      onAdd={addVideoAudio}
      onRemove={(audioId) => void removeAudio(audioId)}
      addLabel="Use sound"
      addedLabel="In sounds"
      addedFilterLabel="Sounds from videos"
      section="audio"
      filterable
      emptyMessage="Upload a video and its sound is added to your sounds."
    />
  );
};

interface AudioRowProps {
  item: AudioItem;
  attention: boolean;
  onEdit: () => void;
  onQuickShare: () => void;
  onRemove: () => void;
}

const AudioRow = ({
  item,
  attention,
  onEdit,
  onQuickShare,
  onRemove,
}: AudioRowProps) => {
  const url = useAssetUrl(item);
  return (
    <div
      {...attentionAttribute(item.id)}
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-[10px] border-b border-line px-2 py-2.75",
        attention && ATTENTION_CLASS,
      )}
    >
      <div className="grid size-9.5 shrink-0 place-items-center rounded-[9px] bg-accent/14 text-accent-soft">
        {item.mediaId ? <Film size={17} /> : <Music size={17} />}
      </div>
      <div className="min-w-30 flex-1">
        <div className="text-sm text-fg">{item.name}</div>
        <div className="text-[11.5px] text-sub">
          {item.builtIn
            ? "Default"
            : item.mediaId
              ? "From a video"
              : "Uploaded"}
          {audioPlayLength(item)
            ? ` · ${formatDuration(audioPlayLength(item))}`
            : ""}
        </div>
      </div>
      {url && <audio src={url} controls loop preload="none" className="h-8" />}
      {!item.builtIn && (
        <>
          <IconButton icon={Pencil} title="Edit audio" onClick={onEdit} />
          <IconButton icon={Trash2} danger title="Remove" onClick={onRemove} />
          <MoreMenu
            size="sm"
            items={[
              {
                label: "Quick share",
                icon: Share2,
                title: "Send this sound to another device on your WiFi",
                onClick: onQuickShare,
              },
            ]}
          />
        </>
      )}
    </div>
  );
};
