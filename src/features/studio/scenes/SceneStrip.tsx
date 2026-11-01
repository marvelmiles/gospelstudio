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
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  BookmarkPlus,
  Copy,
  LayoutTemplate,
  MonitorPlay,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useStore } from "../../../store/useStore";
import { cn } from "../../../lib/utils";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ActionContextMenu } from "@/components/shared/ContextMenu";
import { MoreMenu } from "@/components/shared/MoreMenu";
import type { MenuItem } from "@/components/shared/menuItem";
import type { Scene } from "../types/scene";
import { useProductionStore } from "../store/productionStore";
import {
  duplicateScene,
  moveScene,
  removeScene,
  renameScene,
  saveSceneAsLayout,
  showSceneInPreview,
} from "../store/sceneActions";
import { usePreviewTab } from "../hooks/usePreviewTab";
import { LayoutDiagram } from "./LayoutDiagram";
import { NameDialog } from "./NameDialog";
import { TemplateGallery, type GalleryTarget } from "./TemplateGallery";

const NO_SCENES: Scene[] = [];

type SceneDialog =
  | { kind: "rename"; scene: Scene }
  | { kind: "layout"; scene: Scene }
  | { kind: "delete"; scene: Scene };

export const SceneStrip = ({ className }: { className?: string }) => {
  const scenes = useProductionStore(
    (state) => state.production?.scenes ?? NO_SCENES,
  );
  const previewSceneId = useProductionStore(
    (state) => state.production?.previewSceneId,
  );
  const liveSceneId = useProductionStore(
    (state) => state.production?.program?.sceneId,
  );
  const pushToast = useStore((state) => state.pushToast);
  const openPreviewTab = usePreviewTab();
  const [dialog, setDialog] = useState<SceneDialog | null>(null);
  const [gallery, setGallery] = useState<GalleryTarget | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const targetIndex = scenes.findIndex((scene) => scene.id === over.id);
    if (targetIndex >= 0) moveScene(String(active.id), targetIndex);
  };

  const menuItems = useCallback(
    (scene: Scene): MenuItem[] => [
      {
        label: "Preview",
        icon: MonitorPlay,
        title: "Open this scene in the preview tab to check your changes",
        onClick: () => {
          showSceneInPreview(scene.id);
          openPreviewTab();
        },
      },
      {
        label: "Rename",
        icon: Pencil,
        onClick: () => setDialog({ kind: "rename", scene }),
      },
      {
        label: "Duplicate",
        icon: Copy,
        onClick: () => duplicateScene(scene.id),
      },
      {
        label: "Change layout",
        icon: LayoutTemplate,
        onClick: () => setGallery({ kind: "apply", sceneId: scene.id }),
      },
      {
        label: "Save as a reusable layout",
        icon: BookmarkPlus,
        onClick: () => setDialog({ kind: "layout", scene }),
      },
      { divider: true },
      {
        label: "Delete scene",
        icon: Trash2,
        danger: true,
        onClick: () => setDialog({ kind: "delete", scene }),
      },
    ],
    [openPreviewTab],
  );

  return (
    <section aria-label="Scenes" className={cn("min-w-0", className)}>
      <div className="overflow-x-auto pb-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={scenes.map((scene) => scene.id)}
            strategy={horizontalListSortingStrategy}
          >
            <ol className="m-0 flex list-none gap-2 p-0">
              {scenes.map((scene, index) => (
                <SceneCard
                  key={scene.id}
                  scene={scene}
                  number={index + 1}
                  isPreview={scene.id === previewSceneId}
                  isLive={scene.id === liveSceneId}
                  menuItems={menuItems}
                />
              ))}
              <li className="w-32 shrink-0">
                <button
                  type="button"
                  onClick={() => setGallery({ kind: "new" })}
                  title="Add a scene from a ready-made layout or start blank"
                  className="flex size-full min-h-22 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-[12px] font-semibold text-muted-foreground transition-colors outline-none hover:border-primary/50 hover:bg-primary/6 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <Plus size={18} />
                  New scene
                </button>
              </li>
            </ol>
          </SortableContext>
        </DndContext>
      </div>

      <TemplateGallery target={gallery} onClose={() => setGallery(null)} />

      {dialog?.kind === "rename" && (
        <NameDialog
          title="Rename scene"
          label="Scene name"
          initialName={dialog.scene.name}
          onSave={(name) => renameScene(dialog.scene.id, name)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "layout" && (
        <NameDialog
          title="Save as a reusable layout"
          label="Layout name"
          initialName={dialog.scene.name}
          confirmLabel="Save layout"
          onSave={(name) =>
            void saveSceneAsLayout(dialog.scene.id, name).then((saved) =>
              pushToast(
                saved
                  ? `Saved "${name}" as a layout.`
                  : "The layout could not be saved.",
                saved ? "success" : "error",
              ),
            )
          }
          onClose={() => setDialog(null)}
        />
      )}
      <ConfirmDialog
        open={dialog?.kind === "delete"}
        title={`Delete ${dialog?.scene.name ?? "this scene"}?`}
        message="Everything placed on this scene is removed. Press Ctrl+Z straight after if you change your mind."
        onConfirm={() => {
          if (dialog) removeScene(dialog.scene.id);
          setDialog(null);
        }}
        onCancel={() => setDialog(null)}
      />
    </section>
  );
};

interface SceneCardProps {
  scene: Scene;
  number: number;
  isPreview: boolean;
  isLive: boolean;
  menuItems: (scene: Scene) => MenuItem[];
}

const SceneCard = memo(
  ({ scene, number, isPreview, isLive, menuItems }: SceneCardProps) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: scene.id });

    return (
      <li
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        className={cn("w-32 shrink-0", isDragging && "z-10 opacity-60")}
      >
        <ActionContextMenu items={() => menuItems(scene)}>
          <div
            className={cn(
              "group relative rounded-xl border p-1.5 transition-colors",
              isPreview
                ? "border-primary/60 bg-primary/12"
                : "border-border bg-secondary hover:border-primary/30",
              isLive && "ring-2 ring-destructive/70",
            )}
          >
            <button
              type="button"
              {...attributes}
              {...listeners}
              onClick={() => showSceneInPreview(scene.id)}
              aria-pressed={isPreview}
              aria-label={`Scene ${number}: ${scene.name}${isLive ? ", on the live screen" : ""}. Click to prepare it, drag to reorder.`}
              className="block w-full cursor-pointer rounded-lg text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <LayoutDiagram
                layers={scene.layers}
                background={scene.background}
              />
              <span className="mt-1.25 flex items-center gap-1.5 pr-6">
                <span className="text-[10.5px] font-bold text-subtle-foreground tabular-nums">
                  {number}
                </span>
                <span className="min-w-0 truncate text-[12px] font-semibold text-foreground">
                  {scene.name}
                </span>
              </span>
            </button>
            {isLive && (
              <span className="pointer-events-none absolute top-2.5 left-2.5 rounded-sm bg-destructive px-1.25 py-px text-[9.5px] font-extrabold tracking-[0.06em] text-white uppercase">
                Live
              </span>
            )}
            <div className="absolute right-1 bottom-1">
              <MoreMenu
                items={menuItems(scene)}
                size="sm"
                title={`More actions for ${scene.name}`}
              />
            </div>
          </div>
        </ActionContextMenu>
      </li>
    );
  },
);

SceneCard.displayName = "SceneCard";
