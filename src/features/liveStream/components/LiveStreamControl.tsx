import { lazy, Suspense, useState } from "react";
import { RadioTower } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingArea } from "@/components/shared/LoadingArea";
import { Modal } from "@/components/shared/Modal";
import { useLiveStreamStore } from "../lib/liveStreamStore";
import { OnAirButton } from "./OnAirButton";

const LiveStreamDialog = lazy(() =>
  import("./LiveStreamDialog").then((module) => ({
    default: module.LiveStreamDialog,
  })),
);

const DIALOG_TITLE = "Live stream";

export const LiveStreamControl = () => {
  const [isOpen, setIsOpen] = useState(false);
  const phase = useLiveStreamStore((state) => state.phase);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return (
    <>
      {phase === "live" || phase === "stopping" ? (
        <OnAirButton onOpen={open} />
      ) : (
        <Button
          size="sm"
          variant="secondary"
          busy={phase === "starting"}
          onClick={open}
          title="Stream the live screen to YouTube, Facebook and other platforms"
        >
          <RadioTower />
          Stream
        </Button>
      )}
      {isOpen && (
        <Suspense
          fallback={
            <Modal open onClose={close} title={DIALOG_TITLE}>
              <LoadingArea />
            </Modal>
          }
        >
          <LiveStreamDialog title={DIALOG_TITLE} onClose={close} />
        </Suspense>
      )}
    </>
  );
};
