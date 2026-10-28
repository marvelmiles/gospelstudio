import { MicOff, Volume2, VolumeX } from "lucide-react";
import { cn } from "../../lib/cn";
import { statusPillClassName } from "./StreamStatusBadge";

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
    <span
      title={title}
      className={cn(
        statusPillClassName(small),
        "border border-line bg-raise",
        dim ? "text-dim" : "text-sub",
      )}
    >
      <Icon size={small ? 11 : 12} /> {label}
    </span>
  );
};
