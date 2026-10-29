import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "@/components/ui/button";

interface MiniButtonProps extends Omit<
  ComponentProps<typeof Button>,
  "children" | "size"
> {
  icon: LucideIcon;
  title: string;
  active?: boolean;
  danger?: boolean;
}

export const MiniButton = ({
  icon: Icon,
  title,
  active,
  danger,
  className,
  ...props
}: MiniButtonProps) => (
  <Button
    variant="ghost"
    size="icon-sm"
    title={title}
    aria-label={title}
    aria-pressed={active}
    className={cn(
      "size-7 [&_svg:not([class*='size-'])]:size-3.75",
      danger && "text-destructive enabled:hover:text-destructive",
      className,
    )}
    {...props}
  >
    <Icon />
  </Button>
);
