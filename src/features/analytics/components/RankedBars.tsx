import { formatCount } from "../../../lib/formatNumber";
import { formatExact } from "../lib/reportFormat";

export interface RankedBarItem {
  key: string;
  label: string;
  value: number;
  detail?: string;
}

interface RankedBarsProps {
  items: RankedBarItem[];
  unit: string;
  emptyMessage: string;
}

export const RankedBars = ({ items, unit, emptyMessage }: RankedBarsProps) => {
  if (items.length === 0)
    return (
      <p className="m-0 py-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );

  const largest = Math.max(1, ...items.map((item) => item.value));
  return (
    <ol className="m-0 grid list-none gap-3 p-0">
      {items.map((item) => (
        <li
          key={item.key}
          tabIndex={0}
          title={`${item.label}: ${formatExact(item.value)} ${unit}${item.detail ? `, ${item.detail}` : ""}`}
          className="grid gap-1.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-[13px]">
            <span className="min-w-24 flex-1 truncate text-foreground">
              {item.label}
            </span>
            <span className="shrink-0 text-muted-foreground tabular-nums">
              <strong className="font-semibold text-foreground">
                {formatCount(item.value)}
              </strong>
              {item.detail && <span className="ml-1.5">{item.detail}</span>}
            </span>
          </span>
          <span
            aria-hidden
            className="block h-2.5 rounded-r-[4px] bg-primary-soft"
            style={{
              width:
                item.value > 0
                  ? `max(2px, ${(item.value / largest) * 100}%)`
                  : 0,
            }}
          />
        </li>
      ))}
    </ol>
  );
};
