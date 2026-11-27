import {
  BookOpen,
  Clapperboard,
  File,
  FileText,
  Film,
  Image as ImageIcon,
  LayoutTemplate,
  Music,
  Palette,
  Settings2,
  Wallpaper,
  type LucideIcon,
} from "lucide-react";
import { formatBytes } from "../../lib/storageStats";
import type { SyncActivityItem, SyncItemKind } from "./syncActivity";

interface SyncItemKindLabel {
  label: string;
  icon: LucideIcon;
}

export const SYNC_ITEM_KINDS: Record<SyncItemKind, SyncItemKindLabel> = {
  manuscript: { label: "Manuscript", icon: FileText },
  scripture: { label: "Bible passage", icon: BookOpen },
  media: { label: "Picture or video", icon: ImageIcon },
  image: { label: "Picture", icon: ImageIcon },
  video: { label: "Video", icon: Film },
  sound: { label: "Sound", icon: Music },
  background: { label: "Background", icon: Wallpaper },
  theme: { label: "Theme", icon: Palette },
  production: { label: "Studio production", icon: Clapperboard },
  layout: { label: "Scene layout", icon: LayoutTemplate },
  settings: { label: "Settings", icon: Settings2 },
  file: { label: "File", icon: File },
};

export const syncItemTitle = (item: SyncActivityItem): string => {
  const name = item.name?.trim();
  if (name) return name;
  const kind = SYNC_ITEM_KINDS[item.kind].label.toLowerCase();
  return item.isRemoval ? `Removed ${kind}` : `Untitled ${kind}`;
};

const statusLabel = ({ status, direction }: SyncActivityItem): string => {
  switch (status) {
    case "active":
      return direction === "upload" ? "Uploading" : "Downloading";
    case "paused":
      return "Paused";
    case "failed":
      return "Couldn't sync";
    case "waiting":
      return direction === "upload"
        ? "Waiting to upload"
        : "Waiting to download";
  }
};

export const syncItemMeta = (item: SyncActivityItem): string =>
  [
    SYNC_ITEM_KINDS[item.kind].label,
    item.isRemoval ? "Removed on this device" : null,
    item.bytes ? formatBytes(item.bytes) : null,
    statusLabel(item),
  ]
    .filter(Boolean)
    .join(" · ");

export const stopItemMessage = (item: SyncActivityItem): string => {
  if (item.direction === "download")
    return "This device won't download it. It stays in your account and on your other devices.";
  if (item.isRemoval)
    return "It was removed on this device only. Your account and your other devices keep it.";
  return "This change stays on this device only, and your other devices keep the copy they have. If you change it again later, it syncs as usual.";
};
