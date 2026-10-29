import { Loader2Icon, type LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

const Spinner = ({ className, size = 16, ...props }: LucideProps) => (
  <Loader2Icon
    role="status"
    aria-label="Loading"
    size={size}
    className={cn("shrink-0 animate-spin text-primary", className)}
    {...props}
  />
);

export { Spinner };
