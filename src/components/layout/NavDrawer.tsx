import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";
import { IconButton } from "../ui/Button";
import type { AppNavigationItem } from "./appNavigation";
import { isRouteActive } from "../../routes";
import { APP_NAME } from "../../lib/appInfo";

interface NavDrawerProps {
  open: boolean;
  onClose: () => void;
  pathname: string;
  destinations: AppNavigationItem[];
  actions: AppNavigationItem[];
}

interface NavSectionProps {
  title: string;
  items: AppNavigationItem[];
  pathname: string;
  onClose: () => void;
}

const NavSection = ({ title, items, pathname, onClose }: NavSectionProps) => (
  <div className="mb-4.5">
    <div className="px-1 pb-2 section-label">{title}</div>
    <div className="flex flex-col gap-1">
      {items.map((item) => {
        const active = item.path ? isRouteActive(item.path, pathname) : false;
        return (
          <button
            key={item.id}
            type="button"
            aria-current={active || undefined}
            onClick={() => {
              item.run();
              onClose();
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-[11px] border px-3 py-2.75 text-left",
              active
                ? "border-accent/32 bg-accent/14 text-accent-soft"
                : "border-transparent bg-transparent text-fg",
            )}
          >
            <item.icon size={18} className="shrink-0" />
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{item.label}</span>
              <span className="mt-0.5 block text-xs text-sub">
                {item.description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

export const NavDrawer = ({
  open,
  onClose,
  pathname,
  destinations,
  actions,
}: NavDrawerProps) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-380 flex animate-fade-in justify-end bg-scrim backdrop-blur-[6px]"
      onClick={onClose}
    >
      <nav
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        onClick={(event) => event.stopPropagation()}
        className="h-full w-[min(320px,88vw)] overflow-y-auto border-l border-line bg-canvas-2 px-3.5 pt-4 pb-7 shadow-overlay"
      >
        <div className="mb-4.5 flex items-center justify-between px-0.5">
          <span className="text-[17px] font-semibold text-fg">{APP_NAME}</span>
          <IconButton icon={X} title="Close menu" onClick={onClose} />
        </div>
        <NavSection
          title="Go to"
          items={destinations}
          pathname={pathname}
          onClose={onClose}
        />
        <NavSection
          title="Studio"
          items={actions}
          pathname={pathname}
          onClose={onClose}
        />
      </nav>
    </div>,
    document.body,
  );
};
