import { Fragment, useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "../../../lib/utils";
import type {
  FeatureReport,
  FeaturesReport,
} from "../../../lib/analytics/reportTypes";
import { formatCountLabel } from "../../../lib/formatNumber";
import { formatExact } from "../lib/reportFormat";

const NOT_SET_UP = "Not set up";

const returningLabel = (value: number | null): string =>
  value === null ? NOT_SET_UP : formatExact(value);

const numberCell = "px-3 py-2 text-right tabular-nums";

const FeatureRows = ({ feature }: { feature: FeatureReport }) => {
  const [isOpen, setIsOpen] = useState(false);
  const eventRowId = (index: number): string =>
    `feature-${feature.id}-action-${index}`;

  return (
    <Fragment>
      <tr className="border-t">
        <th scope="row" className="px-1 py-1 text-left font-normal">
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls={feature.events
              .map((_, index) => eventRowId(index))
              .join(" ")}
            onClick={() => setIsOpen((open) => !open)}
            className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left font-semibold text-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <ChevronRight
              size={15}
              className={cn(
                "shrink-0 text-subtle-foreground transition-transform",
                isOpen && "rotate-90",
              )}
            />
            {feature.label}
          </button>
        </th>
        <td className={cn(numberCell, "font-semibold text-foreground")}>
          {formatExact(feature.visitors)}
        </td>
        <td className={cn(numberCell, "text-foreground")}>
          {formatExact(feature.actions)}
        </td>
        <td className={cn(numberCell, "text-foreground")}>
          {returningLabel(feature.returningVisitors)}
        </td>
      </tr>
      {feature.events.map((event, index) => (
        <tr
          key={event.name}
          id={eventRowId(index)}
          hidden={!isOpen}
          className="text-muted-foreground"
        >
          <td className="py-1.5 pr-3 pl-10">{event.name}</td>
          <td className={numberCell}>{formatExact(event.visitors)}</td>
          <td className={numberCell}>{formatExact(event.occurrences)}</td>
          <td className={numberCell}>
            {returningLabel(event.returningVisitors)}
          </td>
        </tr>
      ))}
    </Fragment>
  );
};

export const FeatureTable = ({ report }: { report: FeaturesReport }) => (
  <div className="grid gap-2.5">
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-130 border-collapse text-[13px]">
        <caption className="sr-only">
          Unique visitors and total actions for each feature and each tracked
          action
        </caption>
        <thead className="bg-secondary">
          <tr className="text-left text-[11.5px] tracking-[0.4px] text-subtle-foreground uppercase">
            <th scope="col" className="px-3 py-2 font-semibold">
              Feature
            </th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">
              Unique visitors
            </th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">
              Total actions
            </th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">
              Returning visitors
            </th>
          </tr>
        </thead>
        <tbody>
          {report.features.map((feature) => (
            <FeatureRows key={feature.id} feature={feature} />
          ))}
        </tbody>
      </table>
    </div>
    <p className="m-0 text-xs leading-relaxed text-subtle-foreground">
      A feature&apos;s unique visitors counts each person once across all of its
      actions, so it is often smaller than the action rows added together. Total
      actions leaves out session ends and failed camera broadcasts. Open a
      feature to see every action.
    </p>
    {report.eventsWithoutData.length > 0 && (
      <details className="text-xs text-subtle-foreground">
        <summary className="cursor-pointer">
          {formatCountLabel(report.eventsWithoutData.length, "tracked action")}{" "}
          with no data in this period
        </summary>
        <p className="mt-1.5 mb-0 leading-relaxed">
          {report.eventsWithoutData.join(", ")}. If one stays empty while the
          feature is in use, add it as a custom event goal in Plausible.
        </p>
      </details>
    )}
  </div>
);
