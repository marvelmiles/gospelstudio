import { useStore } from "../../store/useStore";
import { cn } from "../../lib/utils";
import { Modal } from "@/components/shared/Modal";
import { SectionTitle } from "@/components/shared/Field";
import { InfoTip } from "@/components/shared/InfoTip";
import { SHORTCUT_GROUPS } from "../../lib/shortcuts";
import { ShortcutKeys } from "./ShortcutKeys";

export const ShortcutsModal = () => {
  const overlay = useStore((s) => s.overlay);
  const close = useStore((s) => s.closeOverlay);

  return (
    <Modal
      open={overlay === "shortcuts"}
      onClose={close}
      title="Keyboard Shortcuts"
      width={540}
      info={
        <InfoTip title="Keyboard shortcuts">
          Every shortcut in the app, grouped by where it works. Each group says
          when its keys are live: in an editor, while presenting, in the Studio
          or its PiP window, in the window projected on the audience screen, or
          on the Bible page.
        </InfoTip>
      }
    >
      {SHORTCUT_GROUPS.map((group) => (
        <div key={group.title} className="mb-1.5">
          <SectionTitle
            info={
              group.note ? (
                <InfoTip title={group.title}>{group.note}</InfoTip>
              ) : undefined
            }
          >
            {group.title}
          </SectionTitle>
          {group.shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className={cn(
                "flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 py-2",
                index < group.shortcuts.length - 1 && "border-b border-border",
              )}
            >
              <span className="min-w-[min(10rem,100%)] flex-1 text-[13.5px] text-foreground">
                {shortcut.description}
              </span>
              <ShortcutKeys keys={shortcut.keys} />
            </div>
          ))}
        </div>
      ))}
    </Modal>
  );
};
