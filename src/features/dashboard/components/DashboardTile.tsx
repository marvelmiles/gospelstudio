import type { LucideIcon } from "lucide-react";
import { formatCount } from "../../../lib/formatNumber";
import { cn } from "../../../lib/utils";

type TileTone =
  | "accent"
  | "chart-1"
  | "chart-2"
  | "chart-3"
  | "chart-4"
  | "chart-5"
  | "chart-6"
  | "chart-7";

const TONE_CLASSES: Record<TileTone, string> = {
  accent: "bg-primary-soft/13 text-primary-soft",
  "chart-1": "bg-chart-1/13 text-chart-1",
  "chart-2": "bg-chart-2/13 text-chart-2",
  "chart-3": "bg-chart-3/13 text-chart-3",
  "chart-4": "bg-chart-4/13 text-chart-4",
  "chart-5": "bg-chart-5/13 text-chart-5",
  "chart-6": "bg-chart-6/13 text-chart-6",
  "chart-7": "bg-chart-7/13 text-chart-7",
};

export interface DashboardTileProps {
  icon: LucideIcon;
  label: string;
  value?: number;
  sub?: string;
  tone?: TileTone;
  primary?: boolean;
  title: string;
  onClick: () => void;
}

export const DashboardTile = ({
  icon: Icon,
  label,
  value,
  sub,
  tone = "accent",
  primary,
  title,
  onClick,
}: DashboardTileProps) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={cn(
      "flex min-h-21 w-full items-center gap-3.25 glass px-4.25 py-4 text-left transition-[translate,border-color] duration-150 hover:-translate-y-0.5",
      primary
        ? "border-primary-soft/45 bg-primary shadow-[0_4px_12px_rgb(37_99_235/0.25),inset_0_1px_0_rgb(255_255_255/0.12)]"
        : "bg-card/85 hover:border-input",
    )}
  >
    <span
      className={cn(
        "grid size-10.5 shrink-0 place-items-center rounded-xl",
        primary ? "bg-white/18 text-primary-foreground" : TONE_CLASSES[tone],
      )}
    >
      <Icon size={20} />
    </span>
    <span className="min-w-0 flex-1">
      {value === undefined ? (
        <>
          <span
            className={cn(
              "block text-[14.5px] leading-tight font-semibold",
              primary ? "text-primary-foreground" : "text-foreground",
            )}
          >
            {label}
          </span>
          {sub && (
            <span
              className={cn(
                "mt-0.75 block truncate text-[12.5px]",
                primary ? "text-white/78" : "text-muted-foreground",
              )}
            >
              {sub}
            </span>
          )}
        </>
      ) : (
        <>
          <span className="block text-[28px] leading-none font-semibold text-foreground">
            {formatCount(value)}
          </span>
          <span className="mt-1.25 block truncate text-[13px] text-muted-foreground">
            {label}
          </span>
        </>
      )}
    </span>
  </button>
);
