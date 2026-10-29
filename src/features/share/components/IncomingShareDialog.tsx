import { useState } from "react";
import { Inbox, Square } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ProgressRing } from "@/components/shared/ProgressRing";
import { formatBytes } from "../../../lib/storageStats";
import type { IncomingShare } from "../lib/useIncomingShare";

interface IncomingShareDialogProps {
  incoming: IncomingShare | null;
  onAccept: () => void;
  onDecline: () => void;
  onStop: () => void;
}

const TITLE: Record<IncomingShare["stage"], string> = {
  asking: "Incoming library",
  receiving: "Receiving",
  importing: "Receiving",
};

export const IncomingShareDialog = ({
  incoming,
  onAccept,
  onDecline,
  onStop,
}: IncomingShareDialogProps) => {
  const [isConfirmingStop, setIsConfirmingStop] = useState(false);
  if (!incoming) return null;

  const { stage, fromName, summary, bytes, receivedBytes } = incoming;
  const isAsking = stage === "asking";
  const percent =
    bytes > 0 ? Math.min(99, Math.round((receivedBytes / bytes) * 100)) : 0;

  const bodyClassName =
    "mt-0 text-[13.5px] leading-[1.6] text-muted-foreground";

  return (
    <>
      <Modal
        open
        onClose={isAsking ? onDecline : () => setIsConfirmingStop(true)}
        dismissible={isAsking}
        title={TITLE[stage]}
        width={440}
        footer={
          isAsking ? (
            <>
              <Button variant="secondary" onClick={onDecline}>
                Not now
              </Button>
              <Button onClick={onAccept}>Accept</Button>
            </>
          ) : (
            <Button
              variant="destructive"
              disabled={stage === "importing"}
              onClick={() => setIsConfirmingStop(true)}
            >
              <Square size={14} />
              Stop
            </Button>
          )
        }
      >
        <div className="flex items-start gap-3">
          <span className="grid size-9.5 shrink-0 place-items-center rounded-[11px] bg-primary/14 text-primary-soft">
            <Inbox size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <p className={cn(bodyClassName, isAsking ? "mb-3" : "mb-3.5")}>
              <strong className="text-foreground">{fromName}</strong> is sending{" "}
              {summary}
              {bytes > 0 ? ` (${formatBytes(bytes)})` : ""}.
            </p>
            {isAsking ? (
              <p className={cn(bodyClassName, "mb-0")}>
                Everything you already have is kept. Where the same item exists
                on both devices, the incoming copy wins.
              </p>
            ) : (
              <div className="flex items-center gap-3">
                <ProgressRing
                  size={44}
                  thickness={4}
                  value={percent}
                  indeterminate={stage === "importing"}
                  label="Receiving"
                />
                <span className="text-[12.5px] text-subtle-foreground tabular-nums">
                  {stage === "importing"
                    ? "Finishing"
                    : `${formatBytes(receivedBytes)} of ${formatBytes(bytes)}`}
                </span>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={isConfirmingStop}
        title="Stop receiving?"
        message={`Nothing from ${fromName} is added, and your library stays as it is.`}
        confirmLabel="Stop"
        onConfirm={() => {
          setIsConfirmingStop(false);
          onStop();
        }}
        onCancel={() => setIsConfirmingStop(false)}
      />
    </>
  );
};
