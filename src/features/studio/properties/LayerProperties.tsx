import { useState } from "react";
import {
  Copy,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  Pencil,
  Trash2,
} from "lucide-react";
import { MoreMenu } from "@/components/shared/MoreMenu";
import type { MenuItem } from "@/components/shared/menuItem";
import type { Layer } from "../types/layer";
import { LAYER_ICONS } from "../lib/layerCatalog";
import { itemMenuItems } from "../lib/itemEditing";
import { useItemOpeners } from "../hooks/useItemOpeners";
import { selectLayer } from "../store/editorStore";
import {
  deleteLayer,
  duplicateLayer,
  renameLayer,
  toggleLayerLocked,
  toggleLayerVisible,
} from "../store/layerActions";
import { NameDialog } from "../scenes/NameDialog";
import { SidebarPane } from "../sidebar/SidebarPane";
import { AnnouncementProperties } from "./AnnouncementProperties";
import { ArrangeProperties } from "./ArrangeProperties";
import { BackgroundProperties } from "./BackgroundProperties";
import { CameraProperties } from "./CameraProperties";
import { DeckProperties } from "./DeckProperties";
import { ImageProperties } from "./ImageProperties";
import { LiveSceneNote } from "./LiveSceneNote";
import { LowerThirdProperties } from "./LowerThirdProperties";
import { QrProperties } from "./QrProperties";
import { ShapeProperties } from "./ShapeProperties";
import { TextProperties } from "./TextProperties";
import { useLayerEditor } from "./useLayerEditor";
import { VideoProperties } from "./VideoProperties";

export const LayerProperties = ({ layer }: { layer: Layer }) => {
  const edit = useLayerEditor(layer);
  const openers = useItemOpeners();
  const [isRenaming, setIsRenaming] = useState(false);
  const itemActions = itemMenuItems(layer, openers);

  const menuItems: MenuItem[] = [
    ...itemActions,
    ...(itemActions.length > 0 ? [{ divider: true }] : []),
    { label: "Rename", icon: Pencil, onClick: () => setIsRenaming(true) },
    {
      label: layer.visible ? "Hide" : "Show",
      icon: layer.visible ? EyeOff : Eye,
      onClick: () => toggleLayerVisible(layer),
    },
    {
      label: layer.locked ? "Unlock" : "Lock in place",
      icon: layer.locked ? LockOpen : Lock,
      onClick: () => toggleLayerLocked(layer),
    },
    {
      label: "Duplicate",
      icon: Copy,
      title: "Ctrl+D",
      onClick: () => duplicateLayer(layer.id),
    },
    { divider: true },
    {
      label: "Delete",
      icon: Trash2,
      title: "Delete key",
      danger: true,
      onClick: () => deleteLayer(layer.id),
    },
  ];

  return (
    <SidebarPane
      title={layer.name}
      icon={LAYER_ICONS[layer.type]}
      onBack={() => selectLayer(null)}
      actions={
        <MoreMenu
          items={menuItems}
          size="sm"
          title={`More for ${layer.name}`}
        />
      }
    >
      <LiveSceneNote />
      <ContentProperties layer={layer} />
      <ArrangeProperties layer={layer} edit={edit} />

      {isRenaming && (
        <NameDialog
          title="Rename"
          label="Name"
          initialName={layer.name}
          onSave={(name) => renameLayer(layer.id, name)}
          onClose={() => setIsRenaming(false)}
        />
      )}
    </SidebarPane>
  );
};

const ContentProperties = ({ layer }: { layer: Layer }) => {
  switch (layer.type) {
    case "camera":
      return <CameraProperties layer={layer} />;
    case "bible":
    case "manuscript":
      return <DeckProperties layer={layer} />;
    case "text":
      return <TextProperties layer={layer} />;
    case "image":
      return <ImageProperties layer={layer} />;
    case "video":
      return <VideoProperties layer={layer} />;
    case "announcement":
      return <AnnouncementProperties layer={layer} />;
    case "lowerThird":
      return <LowerThirdProperties layer={layer} />;
    case "qr":
      return <QrProperties layer={layer} />;
    case "shape":
      return <ShapeProperties layer={layer} />;
    case "background":
      return <BackgroundProperties layer={layer} />;
  }
};
