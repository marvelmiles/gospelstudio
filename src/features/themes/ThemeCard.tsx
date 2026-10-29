import type { Background, Theme } from "../../types";
import { ATTENTION_CLASS, attentionAttribute } from "../../hooks/useAttention";
import { resolveStyle } from "../../lib/resolve";
import { cn } from "../../lib/utils";
import { SlideCanvas } from "../../components/SlideCanvas";
import { KeepOnResetBadge } from "@/components/shared/KeepOnResetToggle";
import { THEME_SAMPLE_SLIDE } from "./themeSample";

interface ThemeCardProps {
  theme: Theme;
  background: Background;
  active: boolean;
  attention: boolean;
  onSelect: () => void;
}

export const ThemeCard = ({
  theme,
  background,
  active,
  attention,
  onSelect,
}: ThemeCardProps) => (
  <button
    onClick={onSelect}
    aria-current={active}
    {...attentionAttribute(theme.id)}
    className={cn(
      "block w-full rounded-[11px] border p-1.5 text-left",
      active ? "border-primary/40 bg-primary/12" : "border-border bg-secondary",
      attention && ATTENTION_CLASS,
    )}
  >
    <div className="overflow-hidden rounded-[7px]">
      <SlideCanvas
        slide={THEME_SAMPLE_SLIDE}
        style={resolveStyle(undefined, undefined, theme)}
        bg={background}
        radius={7}
      />
    </div>
    <div
      className={cn(
        "px-1 pt-1.75 pb-0.75 text-[12.5px] font-semibold",
        active ? "text-primary-soft" : "text-foreground",
      )}
    >
      {theme.name}
      {theme.builtIn && (
        <span className="font-medium text-subtle-foreground"> · default</span>
      )}
      {theme.keepOnReset && !theme.builtIn && (
        <span className="ml-1.5 align-middle">
          <KeepOnResetBadge item={theme} />
        </span>
      )}
    </div>
  </button>
);
