import { useMemo, useState } from "react";
import {
  Combine,
  Film,
  Image as ImageIcon,
  Radio,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { MediaItem } from "../../types";
import type { SecondaryModuleKind } from "../../lib/presentChannel";
import { useStore } from "../../store/useStore";
import { sortMediaByRecency } from "../../lib/media";
import { useThumbUrl } from "../../lib/blobUrls";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { InfoTip } from "@/components/shared/InfoTip";
import { PillTabs, type PillTab } from "@/components/shared/PillTabs";
import { SearchInput } from "@/components/shared/SearchInput";
import { PipPlacementControls } from "@/components/shared/PipPlacementControls";
import { StageButton } from "@/components/shared/StageButton";
import { primaryCamera, useStreamSession } from "../stream/lib/streamSession";
import { MiniButton } from "@/components/shared/MiniButton";
import { cn } from "../../lib/utils";

const TABS: PillTab<SecondaryModuleKind>[] = [
  { id: "stream", label: "Live camera", icon: Radio },
  { id: "video", label: "Videos", icon: Film },
  { id: "image", label: "Images", icon: ImageIcon },
];

interface SecondaryModuleMenuProps {
  variant: "stage" | "mini";
}

export const SecondaryModuleMenu = ({ variant }: SecondaryModuleMenuProps) => {
  const [open, setOpen] = useState(false);
  const secondary = useStore((s) => s.secondaryPresentation);
  const active = Boolean(secondary);

  const title = active
    ? "Second module: choose, move or remove it"
    : "Add a second module in a corner of the stage";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {variant === "stage" ? (
          <StageButton icon={Combine} title={title} active={active} />
        ) : (
          <MiniButton icon={Combine} title={title} active={active} />
        )}
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="flex w-80 max-w-[calc(100vw-24px)] flex-col gap-3 p-3.5"
      >
        <SecondaryModulePanel onDone={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};

const SecondaryModulePanel = ({ onDone }: { onDone: () => void }) => {
  const media = useStore((s) => s.media);
  const pushToast = useStore((s) => s.pushToast);
  const secondary = useStore((s) => s.secondaryPresentation);
  const presentSecondary = useStore((s) => s.presentSecondary);
  const patchPlacement = useStore((s) => s.patchSecondaryPlacement);
  const setMuted = useStore((s) => s.setSecondaryMuted);
  const stopSecondary = useStore((s) => s.stopSecondary);
  const session = useStreamSession();

  const [tab, setTab] = useState<SecondaryModuleKind>(
    secondary?.kind ?? "video",
  );
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    if (tab === "stream") return [];
    const needle = query.trim().toLowerCase();
    return media
      .filter((item) => item.kind === tab)
      .filter((item) => !needle || item.name.toLowerCase().includes(needle))
      .sort(sortMediaByRecency);
  }, [media, tab, query]);

  const cameraName = primaryCamera(session)?.deviceName;

  const choose = (kind: SecondaryModuleKind, id?: string) => {
    if (presentSecondary(kind, id)) {
      onDone();
      return;
    }
    pushToast("That item is no longer in the library.", "error");
  };

  return (
    <>
      <div className="flex items-center gap-1.5 text-[15px] font-semibold text-foreground">
        Second module
        <InfoTip title="Second module">
          Runs in a corner of the stage beside whatever is already on it, on the
          preview and on the audience display alike.
        </InfoTip>
      </div>

      {secondary && (
        <div className="flex flex-col gap-2.5 rounded-[11px] border border-primary/35 bg-background p-2.75">
          <div className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-foreground">
              {secondary.kind === "stream"
                ? (cameraName ?? "Live camera")
                : (secondary.item?.name ?? "Missing item")}
            </span>
            <Button
              variant={secondary.muted ? "secondary" : "default"}
              size="sm"
              onClick={() => setMuted(!secondary.muted)}
              title={
                secondary.muted
                  ? "Let this window be heard"
                  : "Silence this window"
              }
            >
              {secondary.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              {secondary.muted ? "Muted" : "Audible"}
            </Button>
          </div>

          <PipPlacementControls
            placement={secondary.placement}
            onChange={patchPlacement}
          />

          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              stopSecondary();
              onDone();
            }}
          >
            <Trash2 size={14} />
            Remove the second module
          </Button>
        </div>
      )}

      <PillTabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === "stream" ? (
        <CameraChoice
          connected={Boolean(primaryCamera(session)?.stream)}
          name={cameraName}
          chosen={secondary?.kind === "stream"}
          onChoose={() => choose("stream")}
        />
      ) : (
        <>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={tab === "video" ? "Search videos…" : "Search images…"}
            className="min-w-0"
          />
          <div className="flex max-h-55 flex-col gap-1.5 overflow-y-auto">
            {items.length === 0 ? (
              <span className="px-0.5 py-2.5 text-[12.5px] text-subtle-foreground">
                {query
                  ? "Nothing matches that."
                  : `No ${tab === "video" ? "videos" : "images"} in the library yet.`}
              </span>
            ) : (
              items.map((item) => (
                <MediaChoice
                  key={item.id}
                  item={item}
                  chosen={secondary?.id === item.id}
                  onChoose={() => choose(item.kind, item.id)}
                />
              ))
            )}
          </div>
        </>
      )}
    </>
  );
};

const CameraChoice = ({
  connected,
  name,
  chosen,
  onChoose,
}: {
  connected: boolean;
  name?: string;
  chosen: boolean;
  onChoose: () => void;
}) => (
  <div className="flex flex-col gap-2">
    <p className="m-0 text-xs leading-normal text-muted-foreground">
      {connected
        ? `Shows ${name ?? "the camera"} the Stream module is receiving, live in the corner.`
        : "No camera is connected yet. Join one from the Stream page and it appears here on its own."}
    </p>
    <Button
      variant={chosen ? "secondary" : "default"}
      size="sm"
      onClick={onChoose}
      disabled={chosen}
    >
      <Radio size={14} />
      {chosen ? "Already in the corner" : "Show the live camera"}
    </Button>
  </div>
);

const MediaChoice = ({
  item,
  chosen,
  onChoose,
}: {
  item: MediaItem;
  chosen: boolean;
  onChoose: () => void;
}) => {
  const thumbUrl = useThumbUrl(item.hasThumb ? item.id : null);
  return (
    <button
      onClick={onChoose}
      title={chosen ? `${item.name} is already showing` : `Show ${item.name}`}
      className={cn(
        "flex items-center gap-2.5 rounded-[10px] border p-1.5 text-left text-foreground",
        chosen
          ? "border-primary/30 bg-primary/16"
          : "border-transparent bg-transparent",
      )}
    >
      <span className="grid h-7.5 w-13 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-background text-subtle-foreground">
        {thumbUrl ? (
          <img src={thumbUrl} alt="" className="size-full object-cover" />
        ) : item.kind === "video" ? (
          <Film size={14} />
        ) : (
          <ImageIcon size={14} />
        )}
      </span>
      <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">
        {item.name}
      </span>
    </button>
  );
};
