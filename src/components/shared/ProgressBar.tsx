import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  value: number;
  label?: string;
}

export const ProgressBar = ({ value, label }: ProgressBarProps) => {
  const percent = Math.max(0, Math.min(100, value));
  return (
    <div className="mt-3">
      {label && (
        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          <span className="tabular-nums">{Math.round(percent)}%</span>
        </div>
      )}
      <Progress value={percent} aria-label={label} />
    </div>
  );
};
