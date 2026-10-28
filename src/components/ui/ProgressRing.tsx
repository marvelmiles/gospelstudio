import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface ProgressRingProps {
  value?: number;
  size?: number;
  thickness?: number;
  className?: string;
  trackClassName?: string;
  indeterminate?: boolean;
  label: string;
  children?: ReactNode;
}

const SWEEP_FRACTION = 0.3;

export const ProgressRing = ({
  value = 0,
  size = 30,
  thickness = 3,
  className,
  trackClassName,
  indeterminate = false,
  label,
  children,
}: ProgressRingProps) => {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.max(0, Math.min(100, value));
  const sweep = indeterminate
    ? circumference * SWEEP_FRACTION
    : (circumference * percent) / 100;
  const centre = size / 2;

  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : Math.round(percent)}
      style={{ width: size, height: size }}
      className={cn(
        "relative inline-grid shrink-0 place-items-center text-accent",
        className,
      )}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden
        className={cn("absolute inset-0", indeterminate && "animate-spin")}
      >
        <g transform={`rotate(-90 ${centre} ${centre})`}>
          <circle
            cx={centre}
            cy={centre}
            r={radius}
            fill="none"
            strokeWidth={thickness}
            className={cn("stroke-track", trackClassName)}
          />
          <circle
            cx={centre}
            cy={centre}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={`${sweep} ${circumference}`}
            className={cn(
              !indeterminate && "transition-[stroke-dasharray] duration-200",
            )}
          />
        </g>
      </svg>
      {children != null && (
        <span className="relative inline-flex">{children}</span>
      )}
    </span>
  );
};
