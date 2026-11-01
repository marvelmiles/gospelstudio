import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
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

export const ShortcutKeys = ({ keys }: { keys: string[] }) => (
  <span className="flex max-w-65 shrink-0 flex-wrap justify-end gap-1.25">
    {keys.map((key, index) => (
      <Kbd
        key={`${key}-${index}`}
        aria-label={ARROW_KEYS[key]?.label}
        className="h-auto min-w-5.5 gap-0.5 rounded-md border bg-white/7 px-2 py-0.75 font-mono font-semibold text-foreground"
      >
        {ARROW_KEYS[key]
          ? ARROW_KEYS[key].icons.map((Icon, iconIndex) => (
              <Icon key={iconIndex} size={12} aria-hidden />
            ))
          : key}
      </Kbd>
    ))}
  </span>
);
