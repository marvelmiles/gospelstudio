import { useMemo, useRef } from "react";
import { Film, Music, Pencil, Share2, Trash2, Upload } from "lucide-react";
import type { AudioItem } from "../../types";
import { cn } from "../../lib/utils";
import { useStore } from "../../store/useStore";
import { useAssetUrl } from "../../hooks/useAssetUrl";
import { useLibrarySort } from "../../hooks/useLibrarySort";
import type { LibrarySortOption } from "../../lib/librarySort";
import { ATTENTION_CLASS, attentionAttribute } from "../../hooks/useAttention";
import { audioPlayLength, formatDuration } from "../../lib/media";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/shared/IconButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { LibrarySection } from "@/components/shared/LibrarySection";
import { LibrarySortSelect } from "@/components/shared/LibrarySortSelect";
import { MoreMenu } from "@/components/shared/MoreMenu";
import { QuickShareModal } from "../share/QuickShareModal";
import { useQuickShareTarget } from "../share/lib/useQuickShareTarget";
import { useOpenAssetEditor } from "./assetLibraryNavigation";
import { LibraryAddList } from "./LibraryAddList";
import { sortAssets } from "./assetSort";
import routes from "../../routes";
import { formatCount } from "../../lib/formatNumber";

interface AudioPanelProps {
  attentionId: string | null;
}

export const AudioPanel = ({ attentionId }: AudioPanelProps) => {
  const audio = useStore((s) => s.audio);
  const addVideoAudio = useStore((s) => s.addVideoAudio);
  const [sort, setSort] = useLibrarySort("asset-audio");
  const addedVideoIds = useMemo(
    () =>
      new Set(audio.flatMap((item) => (item.mediaId ? [item.mediaId] : []))),
    [audio],
  );

  return (
    <div className="flex flex-col gap-3.5">
      <SoundsList attentionId={attentionId} sort={sort} onSort={setSort} />
      <LibraryAddList
        kind="video"
        title="Sound from your videos"
        description="Use the soundtrack of a clip from your Videos page as a sound."
        addedMediaIds={addedVideoIds}
        addLabel="Use sound"
        sort={sort}
        attentionId={attentionId}
        onAdd={addVideoAudio}
      />
    </div>
  );
};

interface SoundsListProps {
  attentionId: string | null;
  sort: LibrarySortOption;
  onSort: (sort: LibrarySortOption) => void;
}

const SoundsList = ({ attentionId, sort, onSort }: SoundsListProps) => {
  const audio = useStore((s) => s.audio);
  const sounds = useMemo(() => sortAssets(audio, sort), [audio, sort]);
  const beginUpload = useStore((s) => s.beginUpload);
  const removeAudio = useStore((s) => s.removeAudio);
  const openEditor = useOpenAssetEditor();
  const quickShare = useQuickShareTarget();
  const audioInput = useRef<HTMLInputElement>(null);

  return (
    <LibrarySection
      title="Sounds"
      meta={formatCount(audio.length)}
      description="Background audio you can attach to a theme, a manuscript or a single slide."
      action={
        <>
          <LibrarySortSelect value={sort} onChange={onSort} nameLabel="Name" />
          <Button size="sm" onClick={() => audioInput.current?.click()}>
            <Upload size={14} />
            Upload audio
          </Button>
        </>
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
      {sounds.length === 0 ? (
        <EmptyState
          icon={Music}
          title="No sounds yet"
          message="Upload audio to play it behind your slides."
          compact
          bare
        />
      ) : (
        sounds.map((item) => (
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
        "flex flex-wrap items-center gap-3 rounded-[10px] border-b border-border px-2 py-2.75",
        attention && ATTENTION_CLASS,
      )}
    >
      <div className="grid size-9.5 shrink-0 place-items-center rounded-[9px] bg-primary/14 text-primary-soft">
        {item.mediaId ? <Film size={17} /> : <Music size={17} />}
      </div>
      <div className="min-w-30 flex-1">
        <div className="text-sm text-foreground">{item.name}</div>
        <div className="text-[11.5px] text-muted-foreground">
          {item.builtIn
            ? "Built in"
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
