import {
  BookOpen,
  FileText,
  Film,
  IdCard,
  Image as ImageIcon,
  Megaphone,
  QrCode,
  Shapes,
  Type,
  Wallpaper,
  Webcam,
  type LucideIcon,
} from "lucide-react";
import type { LayerType } from "../types/layer";

export const LAYER_ICONS: Record<LayerType, LucideIcon> = {
  camera: Webcam,
  bible: BookOpen,
  manuscript: FileText,
  text: Type,
  image: ImageIcon,
  video: Film,
  announcement: Megaphone,
  lowerThird: IdCard,
  qr: QrCode,
  shape: Shapes,
  background: Wallpaper,
};

export const LAYER_TINTS: Record<LayerType, string> = {
  camera: "bg-chart-1/45",
  bible: "bg-chart-3/45",
  manuscript: "bg-chart-5/45",
  text: "bg-chart-7/45",
  image: "bg-chart-2/45",
  video: "bg-chart-6/45",
  announcement: "bg-chart-4/45",
  lowerThird: "bg-chart-1/55",
  qr: "bg-chart-7/40",
  shape: "bg-chart-5/30",
  background: "bg-chart-7/20",
};
