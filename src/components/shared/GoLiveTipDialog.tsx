import { useState, type ReactNode } from "react";
import { Keyboard, Maximize2, type LucideIcon } from "lucide-react";
import { useStore } from "../../store/useStore";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { CheckboxField } from "./CheckboxField";

interface FullscreenTip {
  icon: LucideIcon;
  title: string;
  detail: ReactNode;
}

const FULLSCREEN_TIPS: FullscreenTip[] = [
  {
    icon: Keyboard,
    title: "Press F11 right after going live",
    detail: (
      <>
        The live window has focus as soon as it opens, so pressing{" "}
        <Kbd className="h-auto border px-1.5 py-px font-mono">F11</Kbd> straight
        away fills the projected display.
      </>
    ),
  },
  {
    icon: Maximize2,
    title: "Or use the fullscreen button",
    detail:
      "Move the mouse over the projected display and click the fullscreen button in its top right corner.",
  },
];

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
          <CheckboxField
            checked={dontShowAgain}
            onChange={setDontShowAgain}
            label="Don't show again"
          />
          <span className="flex-1" />
          <Button onClick={close}>Got it</Button>
        </>
      }
    >
      <p className="mt-0 mb-4 text-[13.5px] leading-[1.7] text-muted-foreground">
        Your presentation is now on the external display. To show it full screen
        there, use either of these:
      </p>
      <ol className="m-0 flex list-none flex-col gap-3.5 p-0">
        {FULLSCREEN_TIPS.map((tip) => (
          <li key={tip.title} className="flex items-start gap-3.25">
            <span className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-primary/14 text-primary-soft">
              <tip.icon size={19} />
            </span>
            <span className="min-w-0">
              <span className="block text-[13.5px] font-semibold text-foreground">
                {tip.title}
              </span>
              <span className="mt-0.5 block text-[13px] leading-[1.6] text-muted-foreground">
                {tip.detail}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </Modal>
  );
};
