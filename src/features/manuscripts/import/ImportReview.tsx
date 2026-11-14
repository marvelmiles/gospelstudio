import { useMemo } from "react";
import { FileText } from "lucide-react";
import { formatCountLabel } from "../../../lib/formatNumber";
import type { ManuscriptDraft } from "../../../lib/manuscript/importDrafts";
import { useIncrementalList } from "../../../hooks/useIncrementalList";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadMoreFooter } from "@/components/shared/LoadMoreFooter";
import { ImportDraftRow } from "./ImportDraftRow";
import { SkippedImports } from "./SkippedImports";
import type { DraftChanges, SkippedImport } from "./useManuscriptImport";

interface ImportReviewProps {
  drafts: ManuscriptDraft[];
  skipped: SkippedImport[];
  batchId: string;
  onChange: (key: string, changes: DraftChanges) => void;
  onRemove: (key: string) => void;
}

export const ImportReview = ({
  drafts,
  skipped,
  batchId,
  onChange,
  onRemove,
}: ImportReviewProps) => {
  const shown = useIncrementalList(drafts, batchId);
  const fileCount = useMemo(
    () => new Set(drafts.map((draft) => draft.sourceName)).size,
    [drafts],
  );

  return (
    <>
      {drafts.length ? (
        <>
          <p className="mt-0 mb-3 text-[13px] leading-[1.6] text-muted-foreground">
            Found {formatCountLabel(drafts.length, "manuscript")} in{" "}
            {formatCountLabel(fileCount, "file")}. Check the titles and
            collections, then import.
          </p>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {shown.visibleItems.map((draft) => (
              <ImportDraftRow
                key={draft.key}
                draft={draft}
                onChange={onChange}
                onRemove={onRemove}
              />
            ))}
          </ul>
          <LoadMoreFooter list={shown} noun="manuscripts" />
        </>
      ) : (
        <EmptyState
          icon={FileText}
          title="Nothing to import"
          message="These files had no new song, hymn or sermon text to add."
          compact
          bare
        />
      )}
      <SkippedImports items={skipped} />
    </>
  );
};
