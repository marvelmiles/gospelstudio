import { useMemo, useState } from "react";
import {
  BookOpen,
  Bookmark,
  Check,
  FileText,
  Image as ImageIcon,
  Megaphone,
  Pencil,
  Trash2,
  Video,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStore } from "../../store/useStore";
import { cn } from "../../lib/utils";
import { MiniButton } from "@/components/shared/MiniButton";
import { Modal } from "@/components/shared/Modal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchInput } from "@/components/shared/SearchInput";
import { Input } from "@/components/ui/input";
import {
  fromSavedOverlay,
  isSavedMarquee,
  isSavedOverlayReady,
  type SavedOverlay,
  type StreamOverlayPreset,
} from "./lib/overlayPresets";
import type { StreamOverlay, StreamOverlayKind } from "./lib/streamOverlay";

const KIND_ICON: Record<StreamOverlayKind, LucideIcon> = {
  scripture: BookOpen,
  manuscript: FileText,
  image: ImageIcon,
  video: Video,
  marquee: Megaphone,
};

const KIND_NOUN: Record<StreamOverlayKind, string> = {
  scripture: "Passage",
  manuscript: "Manuscript",
  image: "Picture",
  video: "Clip",
  marquee: "Announcement",
};

const MISSING_NOTE: Record<StreamOverlayKind, string> = {
  scripture: "The passage this was saved from is gone",
  manuscript: "The manuscript this was saved from is gone",
  image: "The picture this was saved from is gone",
  video: "The clip this was saved from is gone",
  marquee: "",
};

const describe = (saved: SavedOverlay): string =>
  isSavedMarquee(saved) ? saved.text : saved.label;

interface SavedOverlaysModalProps {
  open: boolean;
  onClose: () => void;
  onUse: (overlay: StreamOverlay) => void;
}

export const SavedOverlaysModal = ({
  open,
  onClose,
  onUse,
}: SavedOverlaysModalProps) => {
  const presets = useStore((s) => s.overlayPresets);
  const manuscripts = useStore((s) => s.manuscripts);
  const scriptures = useStore((s) => s.scriptures);
  const media = useStore((s) => s.media);
  const backgrounds = useStore((s) => s.backgrounds);
  const removeOverlayPreset = useStore((s) => s.removeOverlayPreset);
  const pushToast = useStore((s) => s.pushToast);
  const [query, setQuery] = useState("");
  const [pendingRemoval, setPendingRemoval] =
    useState<StreamOverlayPreset | null>(null);

  const library = useMemo(
    () => ({ manuscripts, scriptures, media, backgrounds }),
    [manuscripts, scriptures, media, backgrounds],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return presets;
    return presets.filter(
      (preset) =>
        preset.name.toLowerCase().includes(needle) ||
        describe(preset.overlay).toLowerCase().includes(needle),
    );
  }, [presets, query]);

  if (!open) return null;

  const use = (preset: StreamOverlayPreset) => {
    if (!isSavedOverlayReady(preset.overlay, library)) {
      pushToast(
        `"${preset.name}" can't be used: ${MISSING_NOTE[preset.overlay.kind].toLowerCase()}.`,
        "error",
      );
      return;
    }
    onUse(fromSavedOverlay(preset.overlay, preset.id));
    onClose();
  };

  const remove = () => {
    if (!pendingRemoval) return;
    removeOverlayPreset(pendingRemoval.id);
    pushToast(`"${pendingRemoval.name}" removed.`);
    setPendingRemoval(null);
  };

  return (
    <>
      <Modal open onClose={onClose} title="Saved overlays" width={470}>
        {presets.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="Nothing saved yet"
            message="Use the bookmark on an element to keep it for another service."
            compact
            bare
          />
        ) : (
          <>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search saved overlays…"
              className="mb-3 min-w-0"
            />
            {filtered.length === 0 ? (
              <EmptyState
                icon={Bookmark}
                title="No matches"
                message="Try a different search."
                compact
                bare
              />
            ) : (
              <div className="flex max-h-90 flex-col gap-1.5 overflow-y-auto">
                {filtered.map((preset) => (
                  <PresetRow
                    key={preset.id}
                    preset={preset}
                    ready={isSavedOverlayReady(preset.overlay, library)}
                    onUse={() => use(preset)}
                    onRemove={() => setPendingRemoval(preset)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingRemoval)}
        title="Remove saved overlay?"
        message={`"${pendingRemoval?.name ?? ""}" is removed from your saved overlays. Anything already on the broadcast stays where it is.`}
        confirmLabel="Remove"
        onConfirm={remove}
        onCancel={() => setPendingRemoval(null)}
      />
    </>
  );
};

interface PresetRowProps {
  preset: StreamOverlayPreset;
  ready: boolean;
  onUse: () => void;
  onRemove: () => void;
}

const PresetRow = ({ preset, ready, onUse, onRemove }: PresetRowProps) => {
  const renameOverlayPreset = useStore((s) => s.renameOverlayPreset);
  const [draftName, setDraftName] = useState<string | null>(null);
  const Icon = KIND_ICON[preset.overlay.kind];

  const commitRename = () => {
    if (draftName !== null) renameOverlayPreset(preset.id, draftName);
    setDraftName(null);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-[11px] border border-border bg-background py-2 pr-2.25 pl-2.75",
        !ready && "opacity-60",
      )}
    >
      {draftName === null ? (
        <button
          onClick={onUse}
          title={
            ready
              ? `Add "${preset.name}" to the broadcast`
              : MISSING_NOTE[preset.overlay.kind]
          }
          className="flex min-w-0 flex-1 items-center gap-2.5 border-none bg-transparent p-0 text-left"
        >
          <Icon size={15} className="shrink-0 text-primary-soft" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-semibold text-foreground">
              {preset.name}
            </span>
            <span
              className={cn(
                "block truncate text-[11.5px]",
                ready ? "text-subtle-foreground" : "text-warning",
              )}
            >
              {ready
                ? `${KIND_NOUN[preset.overlay.kind]} · ${describe(preset.overlay)}`
                : MISSING_NOTE[preset.overlay.kind]}
            </span>
          </span>
        </button>
      ) : (
        <Input
          value={draftName}
          autoFocus
          className="min-w-0 flex-1 px-2.25 py-1.5 text-[13px]"
          onChange={(event) => setDraftName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") commitRename();
            if (event.key === "Escape") setDraftName(null);
          }}
        />
      )}

      {draftName === null ? (
        <>
          <MiniButton
            icon={Pencil}
            title={`Rename "${preset.name}"`}
            onClick={() => setDraftName(preset.name)}
          />
          <MiniButton
            icon={Trash2}
            title={`Remove "${preset.name}"`}
            danger
            onClick={onRemove}
          />
        </>
      ) : (
        <>
          <MiniButton
            icon={Check}
            title="Save the name"
            onClick={commitRename}
          />
          <MiniButton
            icon={X}
            title="Keep the old name"
            onClick={() => setDraftName(null)}
          />
        </>
      )}
    </div>
  );
};
