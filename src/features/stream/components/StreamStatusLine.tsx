import type { ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "../../../lib/utils";

interface StreamStatusLineProps {
  children: ReactNode;
  tone?: "neutral" | "danger";
  isBusy?: boolean;
}

export const StreamStatusLine = ({
  children,
  tone = "neutral",
  isBusy = false,
}: StreamStatusLineProps) => (
  <div
    role="status"
    className={cn(
      "mt-3 flex items-center gap-2 text-[13px]",
      tone === "danger" ? "text-destructive" : "text-muted-foreground",
    )}
  >
    {isBusy && <Spinner size={14} />}
    {children}
  </div>
);
