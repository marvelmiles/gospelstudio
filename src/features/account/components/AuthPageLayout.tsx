import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Panel } from "@/components/shared/Panel";
import { pageClassName } from "@/components/shared/PageHeader";

interface AuthPageLayoutProps {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export const AuthPageLayout = ({
  icon: Icon,
  title,
  description,
  children,
  footer,
}: AuthPageLayoutProps) => (
  <div className={pageClassName}>
    <Panel className="mx-auto mt-1 w-full max-w-110 sm:mt-6">
      <span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-primary/14 text-primary-soft">
        <Icon size={22} aria-hidden />
      </span>
      <h1 className="m-0 text-center text-xl font-semibold text-foreground">
        {title}
      </h1>
      <p className="mt-1.5 mb-5 text-center text-[13.5px] leading-relaxed text-muted-foreground">
        {description}
      </p>
      {children}
    </Panel>
    {footer && (
      <div className="mx-auto mt-4 flex max-w-110 flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-center text-[13px] text-muted-foreground">
        {footer}
      </div>
    )}
  </div>
);
