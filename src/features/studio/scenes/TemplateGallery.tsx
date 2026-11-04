import { useState, type ReactNode } from "react";
import { Bookmark, Trash2, type LucideIcon } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { MiniButton } from "@/components/shared/MiniButton";
import type { Layer } from "../types/layer";
import {
  BLANK_TEMPLATE_ID,
  SCENE_TEMPLATES,
  TEMPLATE_GROUP_LABELS,
  type SceneTemplate,
  type TemplateGroup,
} from "../lib/sceneTemplates";
import { useProductionStore } from "../store/productionStore";
import {
  addBlankScene,
  addSceneFromLayout,
  addSceneFromTemplate,
  applyLayout,
  applyTemplate,
  deleteLayout,
} from "../store/sceneActions";
import { useTemplatePreviews } from "../hooks/useTemplatePreviews";
import { LayoutDiagram } from "./LayoutDiagram";

export type GalleryTarget =
  { kind: "new" } | { kind: "apply"; sceneId: string };

const GROUPS = Object.keys(TEMPLATE_GROUP_LABELS) as TemplateGroup[];

interface TemplateGalleryProps {
  target: GalleryTarget | null;
  onClose: () => void;
}

export const TemplateGallery = ({ target, onClose }: TemplateGalleryProps) => {
  const previews = useTemplatePreviews();
  const layouts = useProductionStore((state) => state.layouts);
  const [doomedLayoutId, setDoomedLayoutId] = useState<string | null>(null);

  if (!target) return null;

  const chooseTemplate = (template: SceneTemplate) => {
    if (target.kind === "apply") applyTemplate(target.sceneId, template.id);
    else if (template.id === BLANK_TEMPLATE_ID) addBlankScene();
    else addSceneFromTemplate(template.id);
    onClose();
  };

  const chooseLayout = (layoutId: string) => {
    if (target.kind === "new") addSceneFromLayout(layoutId);
    else applyLayout(target.sceneId, layoutId);
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      width={880}
      title={target.kind === "new" ? "Add a scene" : "Choose a layout"}
    >
      {layouts.length > 0 && (
        <GallerySection title="Your saved layouts" icon={Bookmark}>
          {layouts.map((layout) => (
            <GalleryCard
              key={layout.id}
              name={layout.name}
              description={`${layout.layers.length} element${layout.layers.length === 1 ? "" : "s"}`}
              layers={layout.layers}
              background={layout.background}
              onChoose={() => chooseLayout(layout.id)}
              trailing={
                <MiniButton
                  icon={Trash2}
                  title={`Delete the saved layout ${layout.name}`}
                  danger
                  onClick={() => setDoomedLayoutId(layout.id)}
                />
              }
            />
          ))}
        </GallerySection>
      )}

      {GROUPS.map((group) => (
        <GallerySection key={group} title={TEMPLATE_GROUP_LABELS[group]}>
          {SCENE_TEMPLATES.filter((template) => template.group === group).map(
            (template) => (
              <GalleryCard
                key={template.id}
                name={template.name}
                description={template.description}
                layers={previews.get(template.id) ?? []}
                background={template.background}
                onChoose={() => chooseTemplate(template)}
              />
            ),
          )}
        </GallerySection>
      ))}

      <ConfirmDialog
        open={doomedLayoutId !== null}
        title="Delete this saved layout?"
        message="Scenes you already made from it stay as they are."
        onConfirm={() => {
          if (doomedLayoutId) deleteLayout(doomedLayoutId);
          setDoomedLayoutId(null);
        }}
        onCancel={() => setDoomedLayoutId(null)}
      />
    </Modal>
  );
};

const GallerySection = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
}) => (
  <section className="mb-5 last:mb-0">
    <h3 className="mt-0 mb-2.5 flex items-center gap-1.5 section-label">
      {Icon && <Icon size={13} />}
      {title}
    </h3>
    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(170px,100%),1fr))] gap-2.5">
      {children}
    </div>
  </section>
);

interface GalleryCardProps {
  name: string;
  description: string;
  layers: Layer[];
  background: string;
  onChoose: () => void;
  trailing?: ReactNode;
}

const GalleryCard = ({
  name,
  description,
  layers,
  background,
  onChoose,
  trailing,
}: GalleryCardProps) => (
  <div className="group relative flex flex-col gap-2 rounded-xl border border-border bg-background p-2 transition-colors hover:border-primary/45">
    <button
      type="button"
      onClick={onChoose}
      title={description}
      className="flex flex-col gap-2 rounded-lg text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <LayoutDiagram layers={layers} background={background} />
      <span className="block truncate px-0.5 text-[13px] font-semibold text-foreground">
        {name}
      </span>
    </button>
    {trailing && <div className="absolute top-3 right-3">{trailing}</div>}
  </div>
);
