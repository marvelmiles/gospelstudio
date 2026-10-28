import { useState } from "react";
import { Maximize2 } from "lucide-react";
import { useStore } from "../../store/useStore";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Checkbox } from "./Field";

const GO_LIVE_FULLSCREEN_TIP =
  "The live window fills the external display on its own. The first time on a machine your browser asks whether this site may manage windows: choose Allow and the window moves across by itself. Inside the live window, F or the arrow at its top right corner toggles fullscreen, and Esc leaves it.";

export const GoLiveTipDialog = () => {
  const open = useStore((s) => s.goLiveTipOpen);
  const dismiss = useStore((s) => s.dismissGoLiveTip);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const close = () => {
    dismiss(dontShowAgain);
    setDontShowAgain(false);
  };

  return (
    <Modal
      open={open}
      onClose={close}
      dismissible={false}
      title="You're live"
      width={470}
      footer={
        <>
          <Checkbox
            checked={dontShowAgain}
            onChange={setDontShowAgain}
            label="Don't show again"
          />
          <span className="flex-1" />
          <Button variant="primary" onClick={close}>
            Got it
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3.25">
        <span className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-accent/14 text-accent-soft">
          <Maximize2 size={19} />
        </span>
        <p className="m-0 text-[13.5px] leading-[1.7] text-fg">
          {GO_LIVE_FULLSCREEN_TIP}
        </p>
      </div>
    </Modal>
  );
};
