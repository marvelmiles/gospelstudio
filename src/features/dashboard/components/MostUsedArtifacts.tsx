import { useState } from "react";
import { Layers, Volume2, X } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCount } from "../../../lib/formatNumber";
import { cn } from "../../../lib/utils";
import { BgSwatch } from "../../../components/controls/BgSwatch";
import { RankBar } from "./RankBar";
import type { UsageTab, UsedItem } from "../utils";

interface MostUsedArtifactsProps {
  mostUsed: Record<UsageTab, UsedItem[]>;
}

const USAGE_TABS: { id: UsageTab; label: string }[] = [
  { id: "background", label: "Backgrounds" },
  { id: "theme", label: "Themes" },
  { id: "sound", label: "Sounds" },
];

export const MostUsedArtifacts = ({ mostUsed }: MostUsedArtifactsProps) => {
  const [usageTab, setUsageTab] = useState<UsageTab>("background");

  const mostUsedList = mostUsed[usageTab];
  const highestUseCount = Math.max(1, ...mostUsedList.map((m) => m.count));

  return (
    <div className="glass p-5.5">
      <h3 className="mt-0 mb-3 text-lg text-foreground">Most Used Artifacts</h3>
      <div className="mb-3 flex gap-1.5">
        {USAGE_TABS.map((tab) => {
          const activeTab = usageTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setUsageTab(tab.id)}
              className={cn(
                "flex-1 rounded-[9px] border py-1.75 text-[12.5px] font-semibold",
                activeTab
                  ? "border-primary/40 bg-primary/16 text-primary-soft"
                  : "border-border bg-transparent text-muted-foreground",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {mostUsedList.length === 0 ? (
        <EmptyState
          bare
          compact
          icon={Layers}
          title="Nothing used yet"
          message="This fills in as you build manuscripts with themes, backgrounds and sounds."
        />
      ) : (
        mostUsedList.map((item, rank) => (
          <div key={item.id} className="flex items-center gap-2.75 py-2">
            {item.bg ? (
              <BgSwatch
                bg={item.bg}
                className="h-6.75 w-11.5 shrink-0 rounded-md border border-border"
              />
            ) : (
              <div className="grid h-6.75 w-11.5 shrink-0 place-items-center rounded-md border border-border bg-primary/14 text-primary-soft">
                <Volume2 size={14} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13.5px] text-foreground">
                {item.name}
              </div>
              <RankBar
                value={item.count}
                max={highestUseCount}
                rank={rank}
                className="mt-1 h-1.25"
              />
            </div>
            <span className="inline-flex items-center text-[12.5px] text-muted-foreground tabular-nums">
              <X size={11} aria-label="times" />
              {formatCount(item.count)}
            </span>
          </div>
        ))
      )}
    </div>
  );
};
