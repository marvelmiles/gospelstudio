import { useState } from "react";
import {
  BookOpen,
  Bookmark,
  Eye,
  EyeOff,
  FileText,
  Image as ImageIcon,
  Layers,
  Megaphone,
  MonitorPlay,
  MonitorX,
  Trash2,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStore } from "../../store/useStore";
import { cn } from "../../lib/cn";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { keepsSelectionProps } from "../../lib/selectionScope";
import {
  OverlayContentPicker,
  type PickableKind,
} from "./OverlayContentPicker";
import { OverlayImagePicker } from "./OverlayImagePicker";
import { OverlayPassagePicker } from "./OverlayPassagePicker";
import { OverlaySectionLabel } from "./OverlayControls";
import { OverlaySettingsPanel } from "./OverlaySettingsPanel";
import { SaveOverlayDialog } from "./SaveOverlayDialog";
import { SavedOverlaysModal } from "./SavedOverlaysModal";
import {
  createContentOverlay,
  createMarqueeOverlay,
  hasStagedEdits,
  isMarquee,
  overlayVisibility,
  type OverlayVisibility,
  type StreamOverlay,
  type StreamOverlayKind,
} from "./lib/streamOverlay";
import {
  addStreamOverlay,
  clearStreamOverlays,
  linkStreamOverlayPreset,
  removeStreamOverlay,
  takeAllStreamOverlaysOffAir,
  toggleStreamOverlayHidden,
  toggleStreamOverlayLive,
} from "./lib/streamOverlayStore";

const KIND_ICON: Record<StreamOverlayKind, LucideIcon> = {
  scripture: BookOpen,
  manuscript: FileText,
  image: ImageIcon,
  video: Video,
  marquee: Megaphone,
};

const ADD_BUTTONS: { kind: PickableKind; label: string }[] = [
  { kind: "manuscript", label: "Manuscript" },
  { kind: "video", label: "Clip" },
];

const DEFAULT_MARQUEE_TEXT =
  "Welcome. Please silence your phones during the service.";

export const StreamOverlayPanel = ({
  overlays,
  selectedId,
  onSelect,
}: {
  overlays: StreamOverlay[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) => {
  const [picking, setPicking] = useState<PickableKind | null>(null);
  const [pickingPicture, setPickingPicture] = useState(false);
  const [pickingPassage, setPickingPassage] = useState(false);
  const [pickingSaved, setPickingSaved] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [unsavingId, setUnsavingId] = useState<string | null>(null);
  const presets = useStore((s) => s.overlayPresets);
  const removeOverlayPreset = useStore((s) => s.removeOverlayPreset);
  const pushToast = useStore((s) => s.pushToast);
  const savedPresetOf = (overlay: StreamOverlay) =>
    overlay.presetId
      ? presets.find((preset) => preset.id === overlay.presetId)
      : undefined;
  const saving = overlays.find((overlay) => overlay.id === savingId) ?? null;
  const unsaving = overlays.find((overlay) => overlay.id === unsavingId);
  const unsavingPreset = unsaving ? savedPresetOf(unsaving) : undefined;
  const selected =
    overlays.find((overlay) => overlay.id === selectedId) ?? null;
  const anyOnAir = overlays.some((overlay) => overlay.status === "live");

  const stacked = [...overlays].reverse();

  return (
    <div {...keepsSelectionProps} className="flex flex-col gap-3.5">
      <div>
        <OverlaySectionLabel>Add to the broadcast</OverlaySectionLabel>
        <div className="flex flex-wrap gap-1.75">
          <Button
            variant="subtle"
            size="sm"
            onClick={() => setPickingPassage(true)}
          >
            <BookOpen size={14} />
            Passage
          </Button>
          {ADD_BUTTONS.map(({ kind, label }) => {
            const Icon = KIND_ICON[kind];
            return (
              <Button
                key={kind}
                variant="subtle"
                size="sm"
                onClick={() => setPicking(kind)}
              >
                <Icon size={14} />
                {label}
              </Button>
            );
          })}
          <Button
            variant="subtle"
            size="sm"
            onClick={() => setPickingPicture(true)}
          >
            <ImageIcon size={14} />
            Picture
          </Button>
          <Button
            variant="subtle"
            size="sm"
            onClick={() =>
              addStreamOverlay(createMarqueeOverlay(DEFAULT_MARQUEE_TEXT))
            }
          >
            <Megaphone size={14} />
            Announcement
          </Button>
          <Button
            variant="subtle"
            size="sm"
            title="Add an overlay you saved for another service"
            onClick={() => setPickingSaved(true)}
          >
            <Bookmark size={14} />
            {`Saved (${presets.length})`}
          </Button>
        </div>
      </div>

      {overlays.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Nothing staged yet"
          message="Add an overlay above. It stays off air until you show it."
          compact
          bare
        />
      ) : (
        <div>
          <div className="flex items-center justify-between gap-2">
            <OverlaySectionLabel>Elements</OverlaySectionLabel>
            <span className="mb-1.75 flex gap-3">
              {anyOnAir && (
                <TextAction
                  label="Clear the broadcast, keeping every element staged"
                  onClick={takeAllStreamOverlaysOffAir}
                >
                  Take all off air
                </TextAction>
              )}
              <TextAction
                label="Remove every element"
                onClick={() => {
                  clearStreamOverlays();
                  onSelect(null);
                }}
              >
                Remove all
              </TextAction>
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {stacked.map((overlay) => (
              <OverlayRow
                key={overlay.id}
                overlay={overlay}
                selected={overlay.id === selectedId}
                isSaved={savedPresetOf(overlay) !== undefined}
                onSelect={() =>
                  onSelect(overlay.id === selectedId ? null : overlay.id)
                }
                onToggleSaved={() =>
                  savedPresetOf(overlay)
                    ? setUnsavingId(overlay.id)
                    : setSavingId(overlay.id)
                }
              />
            ))}
          </div>
        </div>
      )}

      {selected && <OverlaySettingsPanel overlay={selected} />}

      <OverlayContentPicker
        kind={picking}
        onClose={() => setPicking(null)}
        onPick={(kind, item) => {
          const overlay = createContentOverlay(kind, item.id, item.name);
          addStreamOverlay(overlay);
          onSelect(overlay.id);
          setPicking(null);
        }}
      />

      <OverlayPassagePicker
        open={pickingPassage}
        onClose={() => setPickingPassage(false)}
        onPick={(choice) => {
          const overlay = createContentOverlay(
            "scripture",
            choice.contentId,
            choice.label,
          );
          addStreamOverlay(overlay);
          onSelect(overlay.id);
          setPickingPassage(false);
        }}
      />

      {saving && (
        <SaveOverlayDialog overlay={saving} onClose={() => setSavingId(null)} />
      )}

      <ConfirmDialog
        open={unsavingPreset !== undefined}
        title="Remove from saved?"
        message={`"${unsavingPreset?.name ?? ""}" is taken out of Saved. The element stays on this broadcast.`}
        confirmLabel="Remove"
        onConfirm={() => {
          if (unsaving && unsavingPreset) {
            removeOverlayPreset(unsavingPreset.id);
            linkStreamOverlayPreset(unsaving.id, undefined);
            pushToast(`"${unsavingPreset.name}" removed from saved.`);
          }
          setUnsavingId(null);
        }}
        onCancel={() => setUnsavingId(null)}
      />

      <SavedOverlaysModal
        open={pickingSaved}
        onClose={() => setPickingSaved(false)}
        onUse={(overlay) => {
          addStreamOverlay(overlay);
          onSelect(overlay.id);
        }}
      />

      <OverlayImagePicker
        open={pickingPicture}
        onClose={() => setPickingPicture(false)}
        onPick={(choice) => {
          const overlay = createContentOverlay(
            "image",
            choice.id,
            choice.name,
            choice.source,
          );
          addStreamOverlay(overlay);
          onSelect(overlay.id);
          setPickingPicture(false);
        }}
      />
    </div>
  );
};

const TextAction = ({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: string;
}) => (
  <button
    title={label}
    onClick={onClick}
    className="border-none bg-transparent p-0 text-xs font-semibold text-dim"
  >
    {children}
  </button>
);

const OverlayRow = ({
  overlay,
  selected,
  isSaved,
  onSelect,
  onToggleSaved,
}: {
  overlay: StreamOverlay;
  selected: boolean;
  isSaved: boolean;
  onSelect: () => void;
  onToggleSaved: () => void;
}) => {
  const Icon = KIND_ICON[overlay.kind];
  const visibility = overlayVisibility(overlay);
  const live = overlay.status === "live";
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-[10px] border bg-canvas py-1.5 pr-1.75 pl-2.5",
        selected ? "border-accent" : "border-line",
        overlay.hidden && "opacity-55",
      )}
    >
      <button
        onClick={onSelect}
        aria-pressed={selected}
        className="flex min-w-0 flex-1 items-center gap-2.25 border-none bg-transparent p-0 text-left text-[13px] font-semibold text-fg"
      >
        <Icon size={14} className="shrink-0 text-accent-soft" />
        <span className="min-w-0 flex-1 truncate">
          {isMarquee(overlay) ? overlay.text : overlay.label}
        </span>
        <StatusChip visibility={visibility} staged={hasStagedEdits(overlay)} />
      </button>
      <RowButton
        icon={Bookmark}
        label={
          isSaved
            ? "Saved, and kept in step with every change. Click to remove it from saved"
            : "Save this element for another service"
        }
        active={isSaved}
        onClick={onToggleSaved}
      />
      <RowButton
        icon={overlay.hidden ? EyeOff : Eye}
        label={
          overlay.hidden
            ? "Show this element again"
            : "Hide this element without changing whether it is on air"
        }
        onClick={() => toggleStreamOverlayHidden(overlay.id)}
      />
      <RowButton
        icon={live ? MonitorX : MonitorPlay}
        label={live ? "Take off the broadcast" : "Show on the broadcast now"}
        accent={!live}
        onClick={() => toggleStreamOverlayLive(overlay.id)}
      />
      <RowButton
        icon={Trash2}
        label="Remove from the broadcast"
        danger
        onClick={() => removeStreamOverlay(overlay.id)}
      />
    </div>
  );
};

const VISIBILITY_LABEL: Record<OverlayVisibility, string> = {
  live: "On air",
  draft: "Draft",
  hidden: "Hidden",
};

const StatusChip = ({
  visibility,
  staged,
}: {
  visibility: OverlayVisibility;
  staged: boolean;
}) => {
  const onAir = visibility === "live";
  const waiting = onAir && staged;
  return (
    <span
      title={
        waiting
          ? "Changes are waiting to be applied to the broadcast"
          : undefined
      }
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-1.75 py-px text-[9.5px] font-bold tracking-[0.3px] uppercase",
        !onAir && "border-line bg-transparent text-dim",
        onAir && !waiting && "border-accent bg-accent/18 text-accent",
        waiting && "border-warning bg-warning/18 text-warning",
      )}
    >
      {waiting ? "Not applied" : VISIBILITY_LABEL[visibility]}
    </span>
  );
};

const RowButton = ({
  icon: Icon,
  label,
  onClick,
  danger,
  accent,
  active,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  danger?: boolean;
  accent?: boolean;
  active?: boolean;
}) => {
  return (
    <button
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "grid size-6.25 shrink-0 place-items-center rounded-[7px] border-none",
        active ? "bg-accent/16" : "bg-transparent",
        danger
          ? "text-danger"
          : accent || active
            ? "text-accent-soft"
            : "text-sub",
      )}
    >
      <Icon size={13} fill={active ? "currentColor" : "none"} />
    </button>
  );
};
