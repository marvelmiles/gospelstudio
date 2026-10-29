import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import {
  ContextMenu as ContextMenuRoot,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { activeMenuItemClassName, type MenuItem } from "./menuItem";

interface ActionContextMenuProps {
  items: () => MenuItem[];
  onOpen?: () => void;
  children: ReactNode;
}

export const ActionContextMenu = ({
  items,
  onOpen,
  children,
}: ActionContextMenuProps) => (
  <ContextMenuRoot onOpenChange={(open) => open && onOpen?.()}>
    <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
    <ContextMenuContent className="w-49">
      {items().map((item, index) =>
        item.divider ? (
          <ContextMenuSeparator key={index} />
        ) : (
          <ContextMenuItem
            key={index}
            title={item.title}
            disabled={item.disabled}
            variant={item.danger ? "destructive" : "default"}
            onSelect={item.onClick}
            className={cn(item.active && activeMenuItemClassName)}
          >
            {item.icon && <item.icon />}
            {item.label}
          </ContextMenuItem>
        ),
      )}
    </ContextMenuContent>
  </ContextMenuRoot>
);
