import { useId, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Panel } from "@/components/shared/Panel";
import { OfflineNotice } from "./OfflineNotice";

const OFFLINE_MESSAGE = "You're offline. Connect to continue.";

interface AuthPageLayoutProps {
  title: string;
  description?: ReactNode;
  icon?: LucideIcon;
  footer?: ReactNode;
  children: ReactNode;
}

const PageMark = ({ icon: Icon }: { icon?: LucideIcon }) =>
  Icon ? (
    <span className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-primary/14 text-primary-soft">
      <Icon size={22} aria-hidden />
    </span>
  ) : (
    <img
      src="/favicon.svg"
      alt=""
      width={44}
      height={44}
      className="mx-auto mb-4 block size-11"
    />
  );

export const AuthPageLayout = ({
  title,
  description,
  icon,
  footer,
  children,
}: AuthPageLayoutProps) => {
  const titleId = useId();

  return (
    <div className="flex min-h-full items-start justify-center px-4 py-8 sm:items-center sm:py-12">
      <Panel className="w-full max-w-100 overflow-hidden p-0 sm:p-0">
        <section aria-labelledby={titleId} className="px-5 pt-7 pb-6 sm:px-8">
          <header className="mb-6 text-center">
            <PageMark icon={icon} />
            <h1
              id={titleId}
              className="m-0 text-[22px] leading-tight font-semibold tracking-tight text-foreground"
            >
              {title}
            </h1>
            {description && (
              <p className="mx-auto mt-2 mb-0 max-w-76 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </header>
          <OfflineNotice message={OFFLINE_MESSAGE} />
          {children}
        </section>
        {footer && (
          <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 border-t bg-background/35 px-5 py-4 text-center text-[13px] text-muted-foreground sm:px-8">
            {footer}
          </div>
        )}
      </Panel>
    </div>
  );
};
