import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface IconButtonProps extends Omit<
  ComponentProps<typeof Button>,
  "children" | "size"
> {
  icon: LucideIcon;
  title: string;
  active?: boolean;
  danger?: boolean;
  filled?: boolean;
  size?: "sm" | "md";
}

export const IconButton = ({
  icon: Icon,
  title,
  active,
  danger,
  filled,
  size = "md",
  className,
  ...props
}: IconButtonProps) => (
  <Button
    variant={filled ? "secondary" : "ghost"}
    size={size === "sm" ? "icon-sm" : "icon"}
    title={title}
    aria-label={title}
    aria-pressed={active}
    className={cn(
      filled && "text-muted-foreground",
      danger &&
        "text-destructive enabled:hover:bg-destructive/16 enabled:hover:text-destructive",
      className,
    )}
    {...props}
  >
    <Icon />
  </Button>
);
