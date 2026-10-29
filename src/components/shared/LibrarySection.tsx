import type { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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
  <Card className="gap-0 overflow-hidden rounded-[14px] bg-card/85 py-0 shadow-none">
    <CardHeader className="flex flex-wrap items-center justify-between gap-3 border-b px-3.75 py-3.25 [.border-b]:pb-3.25">
      <div className="min-w-0 flex-[1_1_200px]">
        <div className="flex items-center gap-2 text-[13.5px] font-semibold text-foreground">
          <span className="truncate">{title}</span>
          {meta && (
            <span className="shrink-0 text-[11.5px] font-semibold text-muted-foreground tabular-nums">
              {meta}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-0.75 mb-0 text-[12.5px] leading-[1.55] text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="flex flex-wrap items-center gap-2.5">{action}</div>
      )}
    </CardHeader>
    <CardContent className="p-3.75">{children}</CardContent>
  </Card>
);
