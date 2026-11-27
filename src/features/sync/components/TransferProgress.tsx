import { Progress } from "@/components/ui/progress";
import { useSyncStore } from "../syncStore";
import { transferPercent } from "../syncStatusView";

interface TransferProgressProps {
  label: string;
}

/* Uploads can't report progress through fetch, so they show a moving bar without a number. */
export const TransferProgress = ({ label }: TransferProgressProps) => {
  const transfer = useSyncStore((state) => state.transfer);
  if (!transfer) return null;
  const percent = transferPercent(transfer);

  if (percent === null)
    return (
      <div
        role="progressbar"
        aria-label={label}
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-primary/20"
      >
        <div className="h-full w-2/5 rounded-full bg-primary motion-safe:animate-pulse" />
      </div>
    );

  return (
    <div className="mt-2 flex items-center gap-2.5">
      <Progress
        value={percent}
        aria-label={`${label}, ${percent}% done`}
        className="h-1.5"
      />
      <span className="w-9 shrink-0 text-right text-[12px] text-muted-foreground tabular-nums">
        {percent}%
      </span>
    </div>
  );
};
