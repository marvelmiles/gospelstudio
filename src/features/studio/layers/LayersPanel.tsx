import { memo, useCallback, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  BringToFront,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Layers,
  Link2,
  Lock,
  LockOpen,
  Pencil,
  Plus,
  SendToBack,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/shared/IconButton";
import { InfoTip } from "@/components/shared/InfoTip";
import { MiniButton } from "@/components/shared/MiniButton";
import { MoreMenu } from "@/components/shared/MoreMenu";
import type { MenuItem } from "@/components/shared/menuItem";
import type { Layer } from "../types/layer";
import { LAYER_ICONS } from "../lib/layerCatalog";
import { LAYER_NAMES } from "../lib/layerDefaults";
import { itemMenuItems } from "../lib/itemEditing";
import { canStepLayer, topFirst } from "../lib/layerOrdering";
import {
  selectLayer,
  showSidebarView,
  useEditorStore,
} from "../store/editorStore";
import {
  deleteLayer,
  duplicateLayer,
  moveLayer,
  renameLayer,
  stepLayerOrder,
  toggleLayerLocked,
  toggleLayerVisible,
} from "../store/layerActions";
import { usePreviewScene } from "../store/productionStore";
import { useItemOpeners } from "../hooks/useItemOpeners";
import { NameDialog } from "../scenes/NameDialog";
import { SidebarPane } from "../sidebar/SidebarPane";
import { cloneMenuItems, deleteItemLabel } from "./cloneMenuItems";

export const LayersPanel = () => {
  const scene = usePreviewScene();
  const selectedLayerId = useEditorStore((state) => state.selectedLayerId);
  const openers = useItemOpeners();
  const [renaming, setRenaming] = useState<Layer | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const layers = scene?.layers ?? [];
  const orderedLayers = topFirst(layers);

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const targetIndex = layers.findIndex((layer) => layer.id === over.id);
    if (targetIndex >= 0) moveLayer(String(active.id), targetIndex);
  };

  const menuItems = useCallback(
    (layer: Layer, all: Layer[]): MenuItem[] => {
      const itemActions = itemMenuItems(layer, openers);
      return [
        ...itemActions,
        ...(itemActions.length > 0 ? [{ divider: true }] : []),
        { label: "Rename", icon: Pencil, onClick: () => setRenaming(layer) },
        {
          label: "Duplicate",
          icon: Copy,
          title: "A separate copy you can change on its own",
          onClick: () => duplicateLayer(layer.id),
        },
        ...cloneMenuItems(layer),
        { divider: true },
        {
          label: "Bring to front",
          icon: BringToFront,
          disabled: !canStepLayer(all, layer.id, "front"),
          onClick: () => stepLayerOrder(layer.id, "front"),
        },
        {
          label: "Bring forward",
          icon: ChevronUp,
          disabled: !canStepLayer(all, layer.id, "forward"),
          onClick: () => stepLayerOrder(layer.id, "forward"),
        },
        {
          label: "Send backward",
          icon: ChevronDown,
          disabled: !canStepLayer(all, layer.id, "backward"),
          onClick: () => stepLayerOrder(layer.id, "backward"),
        },
        {
          label: "Send to back",
          icon: SendToBack,
          disabled: !canStepLayer(all, layer.id, "back"),
          onClick: () => stepLayerOrder(layer.id, "back"),
        },
        { divider: true },
        {
          label: deleteItemLabel(layer),
          icon: Trash2,
          danger: true,
          onClick: () => deleteLayer(layer.id),
        },
      ];
    },
    [openers],
  );

  return (
    <SidebarPane
      title="In this scene"
      actions={
        <>
          <InfoTip title="In this scene" align="end">
            Click an item here or on the preview to change it. Drag a row to put
            it in front of or behind the others. The three dots open its editor,
            its PiP window and more.
          </InfoTip>
          <IconButton
            icon={SlidersHorizontal}
            title="Scene name, colour and transition"
            size="sm"
            onClick={() => showSidebarView("scene")}
          />
        </>
      }
      toolbar={
        <Button className="w-full" onClick={() => showSidebarView("add")}>
          <Plus />
          Add to this scene
        </Button>
      }
    >
      {layers.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
          <Layers size={22} className="text-subtle-foreground" />
          <p className="m-0 text-[12.5px] leading-relaxed text-muted-foreground">
            Nothing here yet. Pick a layout on the preview, or add things one at
            a time.
          </p>
        </div>
      ) : (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={orderedLayers.map((layer) => layer.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {orderedLayers.map((layer) => (
                  <LayerRow
                    key={layer.id}
                    layer={layer}
                    isSelected={layer.id === selectedLayerId}
                    menuItems={menuItems(layer, layers)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </>
      )}
      {renaming && (
        <NameDialog
          title="Rename"
          label="Name"
          initialName={renaming.name}
          onSave={(name) => renameLayer(renaming.id, name)}
          onClose={() => setRenaming(null)}
        />
      )}
    </SidebarPane>
  );
};

interface LayerRowProps {
  layer: Layer;
  isSelected: boolean;
  menuItems: MenuItem[];
}

const LayerRow = memo(({ layer, isSelected, menuItems }: LayerRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: layer.id });
  const Icon = LAYER_ICONS[layer.type];

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-1 rounded-[10px] border py-1 pr-1 pl-0.5",
        isSelected
          ? "border-primary/45 bg-primary/14"
          : "border-transparent bg-background hover:border-border",
        isDragging && "relative z-10 opacity-70 shadow-overlay",
        !layer.visible && "opacity-60",
      )}
    >
      <span
        {...attributes}
        {...listeners}
        title="Drag to change the order"
        className="flex h-7 w-5 shrink-0 cursor-grab touch-none items-center justify-center text-subtle-foreground"
      >
        <GripVertical size={14} />
      </span>
      <button
        type="button"
        onClick={() => selectLayer(layer.id)}
        aria-pressed={isSelected}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-1 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <Icon
          size={15}
          className={cn(
            "shrink-0",
            isSelected ? "text-primary-soft" : "text-muted-foreground",
          )}
        />
        <span className="min-w-0">
          <span className="flex items-center gap-1 text-[12.5px] font-semibold text-foreground">
            <span className="truncate">{layer.name}</span>
            {layer.linkId && (
              <span
                title="Clone: changes to one change the others"
                className="shrink-0 text-primary-soft"
              >
                <Link2 size={12} aria-hidden />
                <span className="sr-only">Clone</span>
              </span>
            )}
          </span>
          {layer.name !== LAYER_NAMES[layer.type] && (
            <span className="block truncate text-[10.5px] text-subtle-foreground">
              {LAYER_NAMES[layer.type]}
            </span>
          )}
        </span>
      </button>
      <MiniButton
        icon={layer.visible ? Eye : EyeOff}
        title={layer.visible ? `Hide ${layer.name}` : `Show ${layer.name}`}
        active={!layer.visible}
        onClick={() => toggleLayerVisible(layer)}
      />
      <MiniButton
        icon={layer.locked ? Lock : LockOpen}
        title={
          layer.locked
            ? `Unlock ${layer.name} so it can be moved`
            : `Lock ${layer.name} in place`
        }
        active={layer.locked}
        onClick={() => toggleLayerLocked(layer)}
      />
      <MoreMenu items={menuItems} size="sm" title={`More for ${layer.name}`} />
    </li>
  );
});

LayerRow.displayName = "LayerRow";
