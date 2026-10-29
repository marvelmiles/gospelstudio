import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { IconButton } from "@/components/shared/IconButton";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  <nav aria-label={title} className="mb-4.5">
    <div className="px-1 pb-2 section-label">{title}</div>
    <div className="flex flex-col gap-1">
      {items.map((item) => {
        const active = item.path ? isRouteActive(item.path, pathname) : false;
        return (
          <Button
            key={item.id}
            variant="ghost"
            aria-current={active || undefined}
            onClick={() => {
              item.run();
              onClose();
            }}
            className={cn(
              "h-auto w-full justify-start gap-3 rounded-[11px] px-3 py-2.75 text-left whitespace-normal text-foreground [&_svg:not([class*='size-'])]:size-4.5",
              active &&
                "border-primary/32 bg-primary/14 text-primary-soft enabled:hover:bg-primary/18 enabled:hover:text-primary-soft",
            )}
          >
            <item.icon />
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{item.label}</span>
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                {item.description}
              </span>
            </span>
          </Button>
        );
      })}
    </div>
  </nav>
);

export const NavDrawer = ({
  open,
  onClose,
  pathname,
  destinations,
  actions,
}: NavDrawerProps) => (
  <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
    <SheetContent
      side="right"
      showCloseButton={false}
      aria-describedby={undefined}
      className="w-[min(320px,88vw)] gap-0 overflow-y-auto bg-sidebar px-3.5 pt-4 pb-7 shadow-overlay sm:max-w-none"
    >
      <SheetHeader className="mb-4.5 flex-row items-center justify-between p-0 px-0.5">
        <SheetTitle className="text-[17px]">{APP_NAME}</SheetTitle>
        <SheetClose asChild>
          <IconButton icon={X} title="Close menu" />
        </SheetClose>
      </SheetHeader>
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
    </SheetContent>
  </Sheet>
);
