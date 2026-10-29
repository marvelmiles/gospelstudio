import { FileText } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCount } from "../../../lib/formatNumber";
import { RankBar } from "./RankBar";
import type { CollectionUsage } from "../useDashboardData";

interface ManuscriptsByCategoryProps {
  data: CollectionUsage[];
  largest: number;
}

export const ManuscriptsByCategory = ({
  data,
  largest,
}: ManuscriptsByCategoryProps) => (
  <div className="glass p-5.5">
    <h3 className="mt-0 mb-3.5 text-lg text-foreground">
      Manuscripts by Collection
    </h3>
    {data.length === 0 && (
      <EmptyState
        bare
        compact
        icon={FileText}
        title="No collections yet"
        message="Put your manuscripts in a collection and the breakdown appears here."
      />
    )}
    {data.map((collection, rank) => (
      <div key={collection.name} className="mb-2.75">
        <div className="mb-1.25 flex justify-between text-[13px] text-muted-foreground">
          <span>{collection.name}</span>
          <span className="text-foreground">
            {formatCount(collection.count)}
          </span>
        </div>
        <RankBar
          value={collection.count}
          max={largest}
          rank={rank}
          className="h-1.75"
        />
      </div>
    ))}
  </div>
);
