import { cn } from "../../../lib/utils";

interface RankBarProps {
  value: number;
  max: number;
  rank: number;
  className?: string;
}

export const RankBar = ({ value, max, rank, className }: RankBarProps) => (
  <div className={cn("rounded-full bg-muted", className)}>
    <div
      style={{
        width: `${(value / max) * 100}%`,
        opacity: Math.max(0.35, 1 - rank * 0.16),
      }}
      className={cn(
        "h-full rounded-full bg-linear-to-r from-primary to-primary-soft",
        rank === 0 && "shadow-[0_0_10px_rgb(37_99_235/0.35)]",
      )}
    />
  </div>
);
