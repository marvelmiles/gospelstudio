import { cn } from "../../../lib/utils";
import { useSyncStore } from "../syncStore";
import { useSyncStatus } from "../useSyncStatus";

/* Only the title is announced: the detail can change several times a second while a file downloads. */
export const SyncStatusSummary = () => {
  const phase = useSyncStore((state) => state.phase);
  const status = useSyncStatus();
  const StatusIcon = status.icon;

  return (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-xl",
          phase === "error"
            ? "bg-destructive/14 text-destructive"
            : "bg-primary/14 text-primary-soft",
        )}
      >
        <StatusIcon
          size={18}
          aria-hidden
          className={cn(phase === "syncing" && "motion-safe:animate-spin")}
        />
      </span>
      <div className="min-w-0">
        <div
          aria-live="polite"
          className="text-[14px] font-semibold text-foreground"
        >
          {status.title}
        </div>
        <p className="m-0 mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
          {status.detail}
        </p>
      </div>
    </div>
  );
};
