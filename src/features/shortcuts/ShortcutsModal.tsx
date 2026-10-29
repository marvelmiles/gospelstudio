import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStore } from "../../store/useStore";
import { cn } from "../../lib/utils";
import { Modal } from "@/components/shared/Modal";
import { SectionTitle } from "@/components/shared/Field";
import { InfoTip } from "@/components/shared/InfoTip";
import { SHORTCUT_GROUPS } from "../../lib/shortcuts";
import { Kbd } from "@/components/ui/kbd";

const ARROW_KEYS: Partial<
  Record<string, { label: string; icons: LucideIcon[] }>
> = {
  arrows: {
    label: "Arrow keys",
    icons: [ArrowLeft, ArrowUp, ArrowRight, ArrowDown],
  },
  "up-down": { label: "Up or down arrow", icons: [ArrowUp, ArrowDown] },
  left: { label: "Left arrow", icons: [ArrowLeft] },
  right: { label: "Right arrow", icons: [ArrowRight] },
};

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
          Every shortcut in the studio, grouped by where it works. Each group
          says when its keys are live: in an editor, while presenting, in the
          window projected on the audience screen, or on the Bible page.
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
                "flex items-center justify-between gap-3 py-2",
                index < group.shortcuts.length - 1 && "border-b border-border",
              )}
            >
              <span className="text-[13.5px] text-foreground">
                {shortcut.description}
              </span>
              <span className="flex max-w-65 shrink-0 flex-wrap justify-end gap-1.25">
                {shortcut.keys.map((key) => (
                  <Kbd
                    key={key}
                    aria-label={ARROW_KEYS[key]?.label}
                    className="h-auto min-w-5.5 gap-0.5 rounded-md border bg-white/7 px-2 py-0.75 font-mono font-semibold text-foreground"
                  >
                    {ARROW_KEYS[key]
                      ? ARROW_KEYS[key].icons.map((Icon, index) => (
                          <Icon key={index} size={12} aria-hidden />
                        ))
                      : key}
                  </Kbd>
                ))}
              </span>
            </div>
          ))}
        </div>
      ))}
    </Modal>
  );
};
