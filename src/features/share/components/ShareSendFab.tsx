import { SendHorizontal, Square } from "lucide-react";
import { ProgressRing } from "../../../components/ui/ProgressRing";

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
        <button
          type="button"
          title="Stop sending"
          aria-label="Stop sending"
          onClick={onStop}
          className="grid size-9.5 place-items-center rounded-full border border-danger/35 bg-panel-solid text-danger shadow-overlay"
        >
          <Square size={16} />
        </button>
      )}

      {isBusy ? (
        <div className="grid size-14.5 place-items-center rounded-full border border-line bg-panel-solid shadow-overlay">
          <ProgressRing
            size={48}
            thickness={4}
            value={progress ?? 0}
            indeterminate={progress === null}
            label="Sending"
          >
            <span className="text-xs font-bold text-fg tabular-nums">
              {progress === null ? "" : `${progress}%`}
            </span>
          </ProgressRing>
        </div>
      ) : (
        <button
          type="button"
          title="Send what you chose"
          aria-label="Send what you chose"
          onClick={onSend}
          className="grid size-14.5 place-items-center rounded-full border border-accent-soft/35 bg-accent text-on-accent shadow-[0_10px_28px_rgb(37_99_235/0.4)] hover:brightness-110"
        >
          <SendHorizontal size={22} />
        </button>
      )}
    </div>
  );
};
