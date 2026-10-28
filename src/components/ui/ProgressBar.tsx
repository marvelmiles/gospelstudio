interface ProgressBarProps {
  value: number;
  label?: string;
}

export const ProgressBar = ({ value, label }: ProgressBarProps) => {
  const percent = Math.max(0, Math.min(100, value));
  return (
    <div className="mt-3">
      {label && (
        <div className="mb-1.5 flex justify-between text-xs text-sub">
          <span>{label}</span>
          <span className="tabular-nums">{Math.round(percent)}%</span>
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-track">
        <div
          style={{ width: `${percent}%` }}
          className="h-full rounded-full bg-accent transition-[width] duration-200"
        />
      </div>
    </div>
  );
};
