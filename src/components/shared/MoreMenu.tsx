import { MoreHorizontal } from "lucide-react";
import { cn } from "../../lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconButton } from "./IconButton";
import { activeMenuItemClassName, type MenuItem } from "./menuItem";

interface MoreMenuProps {
  items: MenuItem[];
  title?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  size?: "sm" | "md";
  filled?: boolean;
}

export const MoreMenu = ({
  items,
  title = "More actions",
  side = "bottom",
  align = "end",
  size = "md",
  filled,
}: MoreMenuProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <IconButton
        icon={MoreHorizontal}
        title={title}
        size={size}
        filled={filled}
      />
    </DropdownMenuTrigger>
    <DropdownMenuContent side={side} align={align} className="min-w-52.5">
      {items.map((item, index) =>
        item.divider ? (
          <DropdownMenuSeparator key={index} />
        ) : (
          <DropdownMenuItem
            key={index}
            title={item.title}
            disabled={item.disabled}
            variant={item.danger ? "destructive" : "default"}
            onSelect={item.onClick}
            className={cn(item.active && activeMenuItemClassName)}
          >
            {item.icon && <item.icon />}
            {item.label}
          </DropdownMenuItem>
        ),
      )}
    </DropdownMenuContent>
  </DropdownMenu>
);
