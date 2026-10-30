import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCount } from "../../lib/formatNumber";
import type { IncrementalList } from "../../hooks/useIncrementalList";

interface LoadMoreFooterProps<T> {
  list: IncrementalList<T>;
  noun: string;
}

export const LoadMoreFooter = <T,>({
  list: { visibleItems, total, hasMore, showMore, attachSentinel },
  noun,
}: LoadMoreFooterProps<T>) => {
  if (!hasMore) return null;
  return (
    <div
      ref={attachSentinel}
      className="mt-5 flex flex-col items-center gap-2.5 text-center"
    >
      <p className="m-0 text-[12.5px] text-muted-foreground" aria-live="polite">
        Showing {formatCount(visibleItems.length)} of {formatCount(total)}{" "}
        {noun}
      </p>
      <Button variant="secondary" size="sm" onClick={showMore}>
        <ChevronDown size={15} />
        Show more
      </Button>
    </div>
  );
};
