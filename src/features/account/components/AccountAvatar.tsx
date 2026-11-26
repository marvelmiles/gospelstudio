import { cn } from "../../../lib/utils";
import type { SyncPhase } from "../../sync/syncStore";

interface AccountAvatarProps {
  churchName: string;
  size?: "md" | "lg";
  phase?: SyncPhase;
}

const PHASE_DOT: Record<SyncPhase, string> = {
  idle: "bg-success",
  syncing: "bg-info animate-pulse",
  paused: "bg-warning",
  offline: "bg-warning",
  error: "bg-destructive",
  off: "bg-muted-foreground",
};

const initialsOf = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("") || "?";

export const AccountAvatar = ({
  churchName,
  size = "md",
  phase,
}: AccountAvatarProps) => (
  <span
    aria-hidden
    className={cn(
      "relative grid shrink-0 place-items-center rounded-full bg-primary/20 font-bold text-primary-soft ring-1 ring-primary/35",
      size === "lg" ? "size-10 text-[14px]" : "size-8 text-[12px]",
    )}
  >
    {initialsOf(churchName)}
    {phase && (
      <span
        className={cn(
          "absolute -right-0.5 -bottom-0.5 size-2.75 rounded-full ring-2 ring-sidebar",
          PHASE_DOT[phase],
        )}
      />
    )}
  </span>
);
