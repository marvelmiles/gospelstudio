import { useState, type FormEvent } from "react";
import { CalendarRange } from "lucide-react";
import {
  EARLIEST_REPORT_DAY,
  REPORT_PERIODS,
  addDays,
  customRangeProblem,
  type ReportPeriod,
} from "../../../lib/analytics/reportPeriods";
import { OptionSelect } from "@/components/shared/OptionSelect";
import { Field } from "@/components/shared/Field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ReportSelection } from "../lib/reportApi";

const PERIOD_OPTIONS = REPORT_PERIODS.map(({ id, label }) => ({
  value: id,
  label,
}));

const DEFAULT_CUSTOM_DAYS = 14;

interface ReportFiltersProps {
  selection: ReportSelection;
  today: string;
  onChange: (selection: ReportSelection) => void;
}

export const ReportFilters = ({
  selection,
  today,
  onChange,
}: ReportFiltersProps) => {
  const [isCustomOpen, setIsCustomOpen] = useState(
    selection.period === "custom",
  );
  const [from, setFrom] = useState(
    selection.from ?? addDays(today, 1 - DEFAULT_CUSTOM_DAYS),
  );
  const [to, setTo] = useState(selection.to ?? today);
  const [problem, setProblem] = useState<string | null>(null);

  const choosePeriod = (period: string) => {
    if (period === "custom") {
      setIsCustomOpen(true);
      return;
    }
    setIsCustomOpen(false);
    setProblem(null);
    onChange({ period: period as ReportPeriod });
  };

  const applyCustomRange = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextProblem = customRangeProblem({ from, to }, today);
    setProblem(nextProblem);
    if (!nextProblem) onChange({ period: "custom", from, to });
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-52 max-w-full">
        <Field label="Period">
          <OptionSelect
            aria-label="Report period"
            value={isCustomOpen ? "custom" : selection.period}
            options={PERIOD_OPTIONS}
            onValueChange={choosePeriod}
          />
        </Field>
      </div>
      {isCustomOpen && (
        <form
          onSubmit={applyCustomRange}
          className="flex flex-wrap items-end gap-3"
          noValidate
        >
          <div className="w-40">
            <Field label="From" error={problem}>
              <Input
                type="date"
                value={from}
                min={EARLIEST_REPORT_DAY}
                max={today}
                required
                onChange={(event) => setFrom(event.target.value)}
              />
            </Field>
          </div>
          <div className="w-40">
            <Field label="To">
              <Input
                type="date"
                value={to}
                min={EARLIEST_REPORT_DAY}
                max={today}
                required
                onChange={(event) => setTo(event.target.value)}
              />
            </Field>
          </div>
          <Button type="submit" variant="secondary" className="mb-3.25">
            <CalendarRange size={15} />
            Show range
          </Button>
        </form>
      )}
    </div>
  );
};
