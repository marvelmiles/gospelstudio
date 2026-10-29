import { SendHorizontal, Square } from "lucide-react";
import { ProgressRing } from "@/components/shared/ProgressRing";
import { Button } from "@/components/ui/button";

interface ShareSendFabProps {
  canSend: boolean;
  isBusy: boolean;
  progress: number | null;
  onSend: () => void;
  onStop: () => void;
}

export const ShareSendFab = ({
  canSend,
  isBusy,
  progress,
  onSend,
  onStop,
}: ShareSendFabProps) => {
  if (!isBusy && !canSend) return null;

  return (
    <div className="fixed right-5.5 bottom-5.5 z-60 flex flex-col items-center gap-2.5">
      {isBusy && (
        <Button
          variant="destructive"
          size="icon"
          title="Stop sending"
          aria-label="Stop sending"
          onClick={onStop}
          className="size-9.5 rounded-full bg-card shadow-overlay"
        >
          <Square />
        </Button>
      )}

      {isBusy ? (
        <div className="grid size-14.5 place-items-center rounded-full border border-border bg-card shadow-overlay">
          <ProgressRing
            size={48}
            thickness={4}
            value={progress ?? 0}
            indeterminate={progress === null}
            label="Sending"
          >
            <span className="text-xs font-bold text-foreground tabular-nums">
              {progress === null ? "" : `${progress}%`}
            </span>
          </ProgressRing>
        </div>
      ) : (
        <Button
          size="icon"
          title="Send what you chose"
          aria-label="Send what you chose"
          onClick={onSend}
          className="size-14.5 rounded-full shadow-[0_10px_28px_rgb(37_99_235/0.4)] [&_svg:not([class*='size-'])]:size-5.5"
        >
          <SendHorizontal />
        </Button>
      )}
    </div>
  );
};
