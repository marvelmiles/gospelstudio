import { MicOff, Volume2, VolumeX } from "lucide-react";
import { cn } from "../../lib/utils";
import { Badge } from "@/components/ui/badge";
import { statusPillClassName } from "./lib/streamBadge";

export const AudioSharingPill = ({
  available,
  muted,
  size = "md",
}: {
  available: boolean;
  muted: boolean;
  size?: "sm" | "md";
}) => {
  const small = size === "sm";

  const { Icon, label, title, dim } = !available
    ? {
        Icon: MicOff,
        label: "No audio",
        title: "The sender isn't sharing audio",
        dim: true,
      }
    : muted
      ? {
          Icon: VolumeX,
          label: "Muted",
          title: "The sender's audio is muted on this device",
          dim: true,
        }
      : {
          Icon: Volume2,
          label: "Audio",
          title: "The sender is sharing audio",
          dim: false,
        };

  return (
    <Badge
      variant="secondary"
      title={title}
      className={cn(
        statusPillClassName(small),
        "border-border",
        dim ? "text-subtle-foreground" : "text-muted-foreground",
        small ? "[&>svg]:size-2.75" : "[&>svg]:size-3",
      )}
    >
      <Icon /> {label}
    </Badge>
  );
};
