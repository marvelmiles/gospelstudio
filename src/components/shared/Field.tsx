import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Label } from "@/components/ui/label";

interface FieldProps {
  label: string;
  info?: ReactNode;
  error?: string | null;
  children: ReactNode;
}

export const Field = ({ label, info, error, children }: FieldProps) => (
  <Label className="mb-3.25 block text-sm leading-normal font-normal select-auto">
    <span
      className={cn(
        "mb-1.5 flex items-center gap-1 text-[11.5px] font-semibold tracking-[0.4px] uppercase",
        error ? "text-destructive" : "text-subtle-foreground",
      )}
    >
      {label}
      {info}
    </span>
    {children}
    {error && (
      <span
        role="alert"
        className="mt-1.5 block text-[11.5px] leading-[1.45] text-destructive"
      >
        {error}
      </span>
    )}
  </Label>
);

interface SectionTitleProps {
  children: ReactNode;
  info?: ReactNode;
}

export const SectionTitle = ({ children, info }: SectionTitleProps) => (
  <div className="mt-6.5 mb-3.5 flex items-center gap-1.5 border-b pb-2.25 text-xs font-bold tracking-[0.6px] text-primary uppercase">
    {children}
    {info}
  </div>
);
