import { cn } from "../../lib/cn";

interface SpinnerProps {
  size?: number;
  padded?: boolean;
  className?: string;
}

export const Spinner = ({ size = 16, padded, className }: SpinnerProps) => (
  <span
    role="status"
    aria-label="Loading"
    style={{ width: size, height: size, borderWidth: Math.max(2, size / 8) }}
    className={cn(
      "inline-block shrink-0 animate-spin rounded-full border-solid border-current/25 border-t-current text-accent [animation-duration:0.7s]",
      padded && "m-5",
      className,
    )}
  />
);

export const LoadingArea = ({ size = 26 }: { size?: number }) => (
  <div className="grid size-full min-h-30 place-items-center">
    <Spinner size={size} />
  </div>
);
