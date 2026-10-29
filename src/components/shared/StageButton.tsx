import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface StageButtonProps extends Omit<
  ComponentProps<typeof Button>,
  "children" | "size"
> {
  icon: LucideIcon;
  title: string;
  active?: boolean;
  solid?: boolean;
}

export const StageButton = ({
  icon: Icon,
  title,
  active,
  solid,
  className,
  ...props
}: StageButtonProps) => (
  <Button
    variant="ghost"
    size="icon"
    title={title}
    aria-label={title}
    aria-pressed={active}
    className={cn(
      "size-10 rounded-[10px] border-stage-line text-white enabled:hover:bg-white/14 enabled:hover:text-white [&_svg:not([class*='size-'])]:size-4.5",
      solid ? "bg-white/10" : "bg-white/6",
      className,
    )}
    {...props}
  >
    <Icon />
  </Button>
);
