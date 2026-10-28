import type { ReactNode } from "react";

interface LibrarySectionProps {
  title: string;
  description?: string;
  meta?: string;
  action?: ReactNode;
  children: ReactNode;
}

export const LibrarySection = ({
  title,
  description,
  meta,
  action,
  children,
}: LibrarySectionProps) => (
  <section className="overflow-hidden rounded-[14px] border border-line bg-panel">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-3.75 py-3.25">
      <div className="min-w-0 flex-[1_1_200px]">
        <div className="flex items-center gap-2 text-[13.5px] font-semibold text-fg">
          <span className="truncate">{title}</span>
          {meta && (
            <span className="shrink-0 text-[11.5px] font-semibold text-sub tabular-nums">
              {meta}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-0.75 mb-0 text-[12.5px] leading-[1.55] text-sub">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex flex-wrap items-center gap-2.5">{action}</div>
      )}
    </header>
    <div className="p-3.75">{children}</div>
  </section>
);
