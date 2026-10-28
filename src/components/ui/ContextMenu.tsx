import { useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";

export interface MenuItem {
  label?: string;
  icon?: LucideIcon;
  fn?: () => void;
  danger?: boolean;
  divider?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

export const ContextMenu = ({ x, y, items, onClose }: ContextMenuProps) => {
  useEffect(() => {
    const close = () => onClose();
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [onClose]);

  return (
    <div
      style={{
        left: Math.min(x, window.innerWidth - 210),
        top: Math.min(y, window.innerHeight - items.length * 38 - 10),
      }}
      className="fixed z-300 w-49 glass bg-panel-solid p-1.5 shadow-overlay"
    >
      {items.map((item, index) =>
        item.divider ? (
          <div key={index} className="mx-2 my-1.25 h-px bg-line" />
        ) : (
          <button
            key={index}
            onClick={() => {
              item.fn?.();
              onClose();
            }}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg border-none bg-transparent px-2.75 py-2.25 text-left text-[13.5px] hover:bg-raise",
              item.danger ? "text-danger" : "text-fg",
            )}
          >
            {item.icon && <item.icon size={15} />} {item.label}
          </button>
        ),
      )}
    </div>
  );
};
