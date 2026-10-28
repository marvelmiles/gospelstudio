import type { ReactNode } from "react";
import { Spinner } from "../../../components/ui/Spinner";
import { cn } from "../../../lib/cn";

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
      tone === "danger" ? "text-danger" : "text-sub",
    )}
  >
    {isBusy && <Spinner size={14} />}
    {children}
  </div>
);
