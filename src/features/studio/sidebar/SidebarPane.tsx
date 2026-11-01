import type { ReactNode } from "react";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { IconButton } from "@/components/shared/IconButton";

interface SidebarPaneProps {
  title: string;
  icon?: LucideIcon;
  onBack?: () => void;
  actions?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
}

export const SidebarPane = ({
  title,
  icon: Icon,
  onBack,
  actions,
  toolbar,
  children,
}: SidebarPaneProps) => (
  <section aria-label={title} className="flex min-h-0 flex-1 flex-col gap-3">
    <header className="flex min-h-8 items-center gap-1.5">
      {onBack && (
        <IconButton
          icon={ArrowLeft}
          title="Back to the list"
          size="sm"
          onClick={onBack}
          className="-ml-1"
        />
      )}
      {Icon && (
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/14 text-primary-soft">
          <Icon size={15} />
        </span>
      )}
      <h2 className="m-0 min-w-0 flex-1 truncate text-[14.5px] font-semibold text-foreground">
        {title}
      </h2>
      {actions}
    </header>
    {toolbar}
    <div className="-mr-1 min-h-0 flex-1 overflow-y-auto pr-1">{children}</div>
  </section>
);
